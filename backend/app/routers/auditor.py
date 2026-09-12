import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Claim, CarbonCredit, BlockchainTransaction, User
from backend.app.schemas.schemas import ClaimResponse, AuditDecisionRequest, CreditResponse
from backend.app.services.auth_service import get_current_user
from backend.app.services.blockchain_client import blockchain_service
from shared.schemas.models import ClaimStatus, CreditStatus, UserRole

router = APIRouter(tags=["Auditor"])

@router.get("/auditor/claims", response_model=List[ClaimResponse])
def get_auditor_queue(db: Session = Depends(get_db)):
    """
    Returns claims for auditor review, sorted with suspicious/high-risk claims first.
    """
    claims = db.query(Claim).filter(
        Claim.status.in_([ClaimStatus.SUBMITTED, ClaimStatus.ANALYZED, ClaimStatus.PENDING_AUDIT])
    ).all()

    # Sort high risk first, then medium, then low
    risk_weights = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
    claims.sort(key=lambda c: risk_weights.get(c.risk_level, 0), reverse=True)

    results = []
    for c in claims:
        item = ClaimResponse.model_validate(c)
        item.reasons = json.loads(c.reasons_json or "[]")
        results.append(item)
    return results

@router.post("/claims/{claim_id}/approve", response_model=ClaimResponse)
def approve_claim(
    claim_id: str,
    decision: AuditDecisionRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Anti-self-approval check
    if claim.issuer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Issuer cannot approve their own claim (Anti-self-approval rule)"
        )

    if claim.status == ClaimStatus.APPROVED or claim.status == ClaimStatus.ISSUED:
        raise HTTPException(status_code=400, detail="Claim is already approved or issued")

    # Execute on-chain approval & issuance
    onchain_res = blockchain_service.approve_claim_and_issue(
        claim_id=claim.id,
        project_id=claim.project_id,
        amount_co2e=claim.reported_tco2e,
        recipient=claim.issuer.wallet_address or "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    )

    claim.status = ClaimStatus.ISSUED
    claim.auditor_id = current_user.id
    claim.audited_at = datetime.utcnow()
    claim.auditor_comments = decision.comments if decision else "Approved after evidence & ML verification"
    claim.blockchain_tx_hash = onchain_res["tx_hash"]

    # Mint carbon credit record
    credit = CarbonCredit(
        claim_id=claim.id,
        project_id=claim.project_id,
        onchain_credit_id=onchain_res["credit_id"],
        amount=claim.reported_tco2e,
        current_owner=claim.issuer.wallet_address or "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        status=CreditStatus.ACTIVE,
        vintage_year=2026,
        mint_tx_hash=onchain_res["tx_hash"]
    )
    db.add(credit)

    # Log blockchain tx
    tx_log = BlockchainTransaction(
        tx_hash=onchain_res["tx_hash"],
        block_number=onchain_res["block_number"],
        contract_address=onchain_res["contract_address"],
        event_name="CreditIssued",
        payload_json=json.dumps({
            "credit_id": onchain_res["credit_id"],
            "claim_id": claim.id,
            "amount": claim.reported_tco2e,
            "owner": credit.current_owner
        })
    )
    db.add(tx_log)
    db.commit()
    db.refresh(claim)

    res = ClaimResponse.model_validate(claim)
    res.reasons = json.loads(claim.reasons_json or "[]")
    return res

@router.post("/claims/{claim_id}/reject", response_model=ClaimResponse)
def reject_claim(
    claim_id: str,
    decision: AuditDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.issuer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Issuer cannot reject their own claim"
        )

    reject_reason = decision.reason or decision.comments or "Claim rejected due to biophysical inconsistency / anomaly detection"

    # Record rejection on blockchain
    onchain_res = blockchain_service.reject_claim(
        claim_id=claim.id,
        auditor_address=current_user.wallet_address or "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        reason=reject_reason
    )

    claim.status = ClaimStatus.REJECTED
    claim.auditor_id = current_user.id
    claim.audited_at = datetime.utcnow()
    claim.reject_reason = reject_reason
    claim.blockchain_tx_hash = onchain_res["tx_hash"]

    tx_log = BlockchainTransaction(
        tx_hash=onchain_res["tx_hash"],
        block_number=onchain_res["block_number"],
        contract_address=onchain_res["contract_address"],
        event_name="ClaimRejected",
        payload_json=json.dumps({"claim_id": claim.id, "reason": reject_reason})
    )
    db.add(tx_log)
    db.commit()
    db.refresh(claim)

    res = ClaimResponse.model_validate(claim)
    res.reasons = json.loads(claim.reasons_json or "[]")
    return res
