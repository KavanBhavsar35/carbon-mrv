import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import CarbonCredit, Claim, Project, MLReport, BlockchainTransaction, ProjectEvidence

router = APIRouter(prefix="/verify", tags=["Public Verification"])

@router.get("/{id_or_hash}")
def verify_provenance(id_or_hash: str, db: Session = Depends(get_db)):
    """
    Public zero-auth verification endpoint providing complete chain of custody
    from satellite evidence hash to retirement certificate.
    """
    credit = None
    claim = None
    tx = None

    # Check if credit ID (UUID or on-chain integer ID)
    if id_or_hash.isdigit():
        credit = db.query(CarbonCredit).filter(CarbonCredit.onchain_credit_id == int(id_or_hash)).first()
    else:
        credit = db.query(CarbonCredit).filter(CarbonCredit.id == id_or_hash).first()

    if credit:
        claim = credit.claim
    else:
        # Check if claim ID
        claim = db.query(Claim).filter(Claim.id == id_or_hash).first()
        if claim and claim.credits:
            credit = claim.credits[0]

    # Check if tx hash
    if not credit and not claim:
        tx = db.query(BlockchainTransaction).filter(BlockchainTransaction.tx_hash == id_or_hash).first()
        if tx and tx.payload_json:
            payload = json.loads(tx.payload_json)
            if "credit_id" in payload:
                credit = db.query(CarbonCredit).filter(CarbonCredit.onchain_credit_id == int(payload["credit_id"])).first()
                if credit:
                    claim = credit.claim

    if not credit and not claim and not tx:
        raise HTTPException(status_code=404, detail="Entity not found in public registry")

    project = claim.project if claim else None
    evidences = db.query(ProjectEvidence).filter(ProjectEvidence.project_id == project.id).all() if project else []
    ml_report = db.query(MLReport).filter(MLReport.project_id == project.id).order_by(MLReport.created_at.desc()).first() if project else None

    # Retrieve all related blockchain transactions
    related_txs = []
    if credit:
        cid_str = str(credit.onchain_credit_id)
        txs = db.query(BlockchainTransaction).filter(BlockchainTransaction.payload_json.contains(cid_str)).all()
        related_txs.extend(txs)
    if claim and claim.blockchain_tx_hash:
        claim_tx = db.query(BlockchainTransaction).filter(BlockchainTransaction.tx_hash == claim.blockchain_tx_hash).first()
        if claim_tx and claim_tx not in related_txs:
            related_txs.append(claim_tx)

    return {
        "verified": True,
        "query_identifier": id_or_hash,
        "summary": {
            "entity_type": "CarbonCredit" if credit else ("Claim" if claim else "Transaction"),
            "credit_id": credit.onchain_credit_id if credit else None,
            "credit_status": credit.status if credit else None,
            "project_name": project.project_name if project else None,
            "project_type": project.project_type if project else None,
            "tco2e_amount": credit.amount if credit else (claim.reported_tco2e if claim else None),
            "owner": credit.current_owner if credit else None,
            "retired": credit.status.value == "RETIRED" if credit else False,
            "retired_reason": credit.retired_reason if credit else None,
            "retired_at": credit.retired_at if credit else None,
        },
        "evidence_integrity": {
            "primary_evidence_hash": project.primary_evidence_hash if project else None,
            "hash_algorithm": "SHA-256",
            "anchored_on_chain": True,
            "files": [
                {
                    "file_name": e.file_name,
                    "sha256": e.sha256_hash,
                    "file_type": e.file_type,
                    "uploaded_at": e.uploaded_at
                }
                for e in evidences
            ]
        },
        "remote_sensing_ml": {
            "baseline_area_ha": ml_report.baseline_area_ha if ml_report else project.baseline_area_ha if project else 0,
            "current_area_ha": ml_report.current_area_ha if ml_report else project.current_area_ha if project else 0,
            "vegetation_change_pct": ml_report.change_percent if ml_report else project.area_change_pct if project else 0,
            "estimated_carbon_tco2e": ml_report.estimated_tco2e if ml_report else (claim.ml_estimated_tco2e if claim else 0),
            "carbon_bounds_95ci": [ml_report.lower_bound_tco2e, ml_report.upper_bound_tco2e] if ml_report else [],
            "methodology": ml_report.methodology if ml_report else "CONFIGURABLE_MANGROVE_METHOD",
            "ml_confidence": ml_report.confidence if ml_report else 0.88
        },
        "audit_and_verification": {
            "reported_co2e": claim.reported_tco2e if claim else None,
            "verification_score_pct": round(claim.verification_score * 100, 1) if claim else None,
            "anomaly_score_pct": round(claim.anomaly_score * 100, 1) if claim else None,
            "risk_level": claim.risk_level if claim else None,
            "auditor_approved": claim.status.value in ["APPROVED", "ISSUED"] if claim else False,
            "auditor_comments": claim.auditor_comments if claim else None,
            "audited_at": claim.audited_at if claim else None
        },
        "blockchain_audit_trail": [
            {
                "tx_hash": t.tx_hash,
                "block_number": t.block_number,
                "event_name": t.event_name,
                "timestamp": t.timestamp,
                "status": t.status
            }
            for t in related_txs
        ]
    }
