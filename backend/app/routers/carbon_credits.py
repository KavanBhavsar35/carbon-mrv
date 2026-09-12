from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.models import CarbonCredit, Project, User, Transaction
from app.models.enums import CreditStatus, TransactionStatus, UserRole, TransactionType
from app.schemas.credit import (
    CarbonCreditResponse, CarbonsCreditsListResponse, CarbonCreditSyncRequest,
)

router = APIRouter(prefix="/api/v1/carbon-credits", tags=["Carbon Credits"])


@router.get("", response_model=CarbonsCreditsListResponse)
def get_all_credits(db: Session = Depends(get_db)):
    query = db.query(CarbonCredit)
    total = query.count()
    return CarbonsCreditsListResponse(credits=query.all(), total=total)


@router.get("/project/{project_id}", response_model=list[CarbonCreditResponse])
def get_project_credits(project_id: str, db: Session = Depends(get_db)):
    return db.query(CarbonCredit).filter(CarbonCredit.project_id == project_id).all()


@router.post("/sync", response_model=dict)
def sync_credit(
    payload: CarbonCreditSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only internal services can sync credits",
        )

    credit = None
    if payload.credit_id:
        credit = db.query(CarbonCredit).filter(CarbonCredit.id == payload.credit_id).first()

    if payload.tx_hash:
        existing = db.query(CarbonCredit).filter(CarbonCredit.blockchain_tx_hash == payload.tx_hash).first()
        if existing:
            return {"message": "Already synced", "credit_id": existing.id}

        credit_data = payload.credit_data
        credit = CarbonCredit(
            project_id=credit_data.get("project_id", ""),
            onchain_credit_id=str(credit_data.get("credit_id", "")),
            amount=credit_data.get("amount", 0.0),
            vintage=credit_data.get("vintage", 0),
            status=CreditStatus.ISSUED,
            blockchain_tx_hash=payload.tx_hash,
            owner_wallet_address=credit_data.get("owner_wallet_address"),
            minted_at=credit_data.get("minted_at"),
            retired_at=None,
            retired_reason=None,
            certification_body=credit_data.get("certification_body"),
            certification_id=credit_data.get("certification_id"),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(credit)
        db.flush()

        tx = Transaction(
            type=TransactionType.MINT,
            to_user_id=None,
            project_id=credit.project_id,
            credit_id=credit.id,
            amount=credit.amount,
            tx_hash=payload.tx_hash,
            status=TransactionStatus.COMPLETED,
            metadata_json={"event": "CreditIssued", "data": credit_data},
            created_at=datetime.now(timezone.utc),
        )
        db.add(tx)

        db.commit()
        return {"message": "Synced", "credit_id": credit.id}

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either credit_id or tx_hash is required")


@router.get("/verify/{credit_id_or_tx_hash}", response_model=dict)
def verify_credit(credit_id_or_tx_hash: str, db: Session = Depends(get_db)):
    credit = db.query(CarbonCredit).filter(
        (CarbonCredit.id == credit_id_or_tx_hash) | (CarbonCredit.blockchain_tx_hash == credit_id_or_tx_hash)
    ).first()

    if not credit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit not found")

    project = db.query(Project).filter(Project.id == credit.project_id).first()
    transactions = db.query(Transaction).filter(Transaction.credit_id == credit.id).all()

    return {
        "credit": {
            "id": credit.id,
            "project_id": credit.project_id,
            "onchain_credit_id": credit.onchain_credit_id,
            "amount": credit.amount,
            "vintage": credit.vintage,
            "status": credit.status,
            "blockchain_tx_hash": credit.blockchain_tx_hash,
            "owner_wallet_address": credit.owner_wallet_address,
            "minted_at": str(credit.minted_at) if credit.minted_at else None,
            "retired_at": str(credit.retired_at) if credit.retired_at else None,
            "retired_reason": credit.retired_reason,
            "certification_body": credit.certification_body,
            "certification_id": credit.certification_id,
        },
        "project": {
            "id": project.id,
            "project_name": project.project_name,
            "project_type": project.project_type,
            "organization_name": project.organization_name,
            "status": project.status,
        } if project else None,
        "transaction_history": [
            {
                "id": tx.id,
                "type": tx.type,
                "amount": tx.amount,
                "tx_hash": tx.tx_hash,
                "status": tx.status,
                "created_at": str(tx.created_at),
            }
            for tx in transactions
        ],
    }