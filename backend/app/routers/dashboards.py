from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Project, Claim, CarbonCredit, BlockchainTransaction
from shared.schemas.models import ClaimStatus, CreditStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])

@router.get("/issuer")
def get_issuer_dashboard(db: Session = Depends(get_db)):
    projects_count = db.query(Project).count()
    claims = db.query(Claim).all()
    active_credits = db.query(CarbonCredit).filter(CarbonCredit.status == CreditStatus.ACTIVE).all()
    total_active_co2e = sum(c.amount for c in active_credits)

    return {
        "registered_projects": projects_count,
        "total_claims": len(claims),
        "pending_audit": len([c for c in claims if c.status in [ClaimStatus.SUBMITTED, ClaimStatus.ANALYZED]]),
        "approved_claims": len([c for c in claims if c.status in [ClaimStatus.APPROVED, ClaimStatus.ISSUED]]),
        "rejected_claims": len([c for c in claims if c.status == ClaimStatus.REJECTED]),
        "active_credits_tco2e": round(total_active_co2e, 2)
    }

@router.get("/auditor")
def get_auditor_dashboard(db: Session = Depends(get_db)):
    claims = db.query(Claim).all()
    pending = [c for c in claims if c.status in [ClaimStatus.SUBMITTED, ClaimStatus.ANALYZED]]
    high_risk = [c for c in pending if c.risk_level == "HIGH"]
    approved = [c for c in claims if c.status in [ClaimStatus.APPROVED, ClaimStatus.ISSUED]]
    rejected = [c for c in claims if c.status == ClaimStatus.REJECTED]

    return {
        "pending_reviews": len(pending),
        "high_risk_alerts": len(high_risk),
        "approved_total": len(approved),
        "rejected_total": len(rejected),
        "average_verification_score": round(
            sum(c.verification_score for c in claims) / max(len(claims), 1) * 100, 1
        )
    }

@router.get("/buyer")
def get_buyer_dashboard(db: Session = Depends(get_db)):
    all_credits = db.query(CarbonCredit).all()
    active = [c for c in all_credits if c.status == CreditStatus.ACTIVE]
    retired = [c for c in all_credits if c.status == CreditStatus.RETIRED]

    return {
        "available_credits_count": len(active),
        "available_tco2e": round(sum(c.amount for c in active), 2),
        "retired_credits_count": len(retired),
        "retired_tco2e": round(sum(c.amount for c in retired), 2),
        "ecosystem_vintage": 2026
    }

@router.get("/regulator")
def get_regulator_dashboard(db: Session = Depends(get_db)):
    projects = db.query(Project).count()
    claims = db.query(Claim).all()
    credits = db.query(CarbonCredit).all()
    txs = db.query(BlockchainTransaction).count()

    return {
        "total_projects": projects,
        "total_claims": len(claims),
        "total_credits_minted": len(credits),
        "total_credits_retired": len([c for c in credits if c.status == CreditStatus.RETIRED]),
        "total_claims_rejected": len([c for c in claims if c.status == ClaimStatus.REJECTED]),
        "total_blockchain_transactions": txs,
        "network": "Hardhat Local / Ethereum Compatible",
        "contract_status": "ONLINE"
    }
