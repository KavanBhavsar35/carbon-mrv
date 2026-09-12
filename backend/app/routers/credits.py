import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import CarbonCredit, BlockchainTransaction, User
from backend.app.schemas.schemas import CreditResponse, CreditTransferRequest, CreditRetireRequest
from backend.app.services.auth_service import get_current_user
from backend.app.services.blockchain_client import blockchain_service
from shared.schemas.models import CreditStatus

router = APIRouter(prefix="/credits", tags=["Carbon Credits"])

@router.get("", response_model=List[CreditResponse])
def list_credits(db: Session = Depends(get_db)):
    credits = db.query(CarbonCredit).order_by(CarbonCredit.minted_at.desc()).all()
    return [CreditResponse.model_validate(c) for c in credits]

@router.get("/{credit_id}", response_model=CreditResponse)
def get_credit(credit_id: str, db: Session = Depends(get_db)):
    credit = db.query(CarbonCredit).filter(
        (CarbonCredit.id == credit_id) | (CarbonCredit.onchain_credit_id == int(credit_id) if credit_id.isdigit() else False)
    ).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Carbon credit not found")
    return CreditResponse.model_validate(credit)

@router.post("/{credit_id}/transfer", response_model=CreditResponse)
def transfer_credit(
    credit_id: str,
    req: CreditTransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    credit = db.query(CarbonCredit).filter(
        (CarbonCredit.id == credit_id) | (CarbonCredit.onchain_credit_id == int(credit_id) if credit_id.isdigit() else False)
    ).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Carbon credit not found")

    # Double-spending / retired transfer protection
    if credit.status == CreditStatus.RETIRED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer retired credit (Blockchain invariant enforced)"
        )

    previous_owner = credit.current_owner
    credit.current_owner = req.to_address

    # Broadcast to blockchain
    onchain_res = blockchain_service.transfer_credit(
        credit_id=credit.onchain_credit_id,
        from_address=previous_owner,
        to_address=req.to_address
    )

    tx_log = BlockchainTransaction(
        tx_hash=onchain_res["tx_hash"],
        block_number=onchain_res["block_number"],
        contract_address=onchain_res["contract_address"],
        event_name="CreditTransferred",
        payload_json=json.dumps({
            "credit_id": credit.onchain_credit_id,
            "from": previous_owner,
            "to": req.to_address
        })
    )
    db.add(tx_log)
    db.commit()
    db.refresh(credit)

    return CreditResponse.model_validate(credit)

@router.post("/{credit_id}/retire", response_model=CreditResponse)
def retire_credit(
    credit_id: str,
    req: CreditRetireRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    credit = db.query(CarbonCredit).filter(
        (CarbonCredit.id == credit_id) | (CarbonCredit.onchain_credit_id == int(credit_id) if credit_id.isdigit() else False)
    ).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Carbon credit not found")

    # Double retirement protection
    if credit.status == CreditStatus.RETIRED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credit already retired (Blockchain double-retirement protection)"
        )

    if not req.reason:
        raise HTTPException(status_code=400, detail="Retirement reason is required")

    credit.status = CreditStatus.RETIRED
    credit.retired_at = datetime.utcnow()
    credit.retired_reason = req.reason
    credit.retired_by = current_user.wallet_address or current_user.email

    # Broadcast to blockchain
    onchain_res = blockchain_service.retire_credit(
        credit_id=credit.onchain_credit_id,
        retired_by=credit.retired_by,
        reason=req.reason
    )
    credit.retire_tx_hash = onchain_res["tx_hash"]

    tx_log = BlockchainTransaction(
        tx_hash=onchain_res["tx_hash"],
        block_number=onchain_res["block_number"],
        contract_address=onchain_res["contract_address"],
        event_name="CreditRetired",
        payload_json=json.dumps({
            "credit_id": credit.onchain_credit_id,
            "retired_by": credit.retired_by,
            "reason": req.reason
        })
    )
    db.add(tx_log)
    db.commit()
    db.refresh(credit)

    return CreditResponse.model_validate(credit)

@router.get("/{credit_id}/history")
def get_credit_history(credit_id: str, db: Session = Depends(get_db)):
    credit = db.query(CarbonCredit).filter(
        (CarbonCredit.id == credit_id) | (CarbonCredit.onchain_credit_id == int(credit_id) if credit_id.isdigit() else False)
    ).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Carbon credit not found")

    cid_str = str(credit.onchain_credit_id)
    txs = db.query(BlockchainTransaction).filter(
        BlockchainTransaction.payload_json.contains(cid_str)
    ).order_by(BlockchainTransaction.timestamp.asc()).all()

    return {
        "credit_id": credit.onchain_credit_id,
        "current_status": credit.status,
        "current_owner": credit.current_owner,
        "amount_tco2e": credit.amount,
        "transactions": [
            {
                "tx_hash": t.tx_hash,
                "block_number": t.block_number,
                "event_name": t.event_name,
                "timestamp": t.timestamp,
                "payload": json.loads(t.payload_json or "{}")
            }
            for t in txs
        ]
    }
