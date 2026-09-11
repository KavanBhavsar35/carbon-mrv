from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models.models import Project, MLReport, User, VerificationReview
from app.models.enums import UserRole, VerificationStatus
from app.schemas.ml import (
    MLReportResponse as MLReportResponseSchema,
    MLVerifyRequest,
)

router = APIRouter(prefix="/api/v1/ml", tags=["ML"])


@router.post("/verify-project/{project_id}", response_model=MLReportResponseSchema, status_code=status.HTTP_201_CREATED)
def verify_project(
    project_id: str,
    payload: MLVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if current_user.id != project.owner_id and current_user.role != UserRole.VERIFIER and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or verifier can trigger ML verification",
        )

    # Trigger ML service (mocked response for now)
    ml_report = MLReport(
        project_id=project_id,
        source_images=payload.image_urls,
        vegetation_cover_pct=payload.latitude if payload.latitude else 75.0,
        estimated_biomass=payload.longitude if payload.longitude else 45.0,
        anomaly_flags=[],
        model_version="v1.0",
        confidence=0.88,
        created_at=datetime.now(timezone.utc),
    )
    db.add(ml_report)
    db.commit()
    db.refresh(ml_report)

    review = VerificationReview(
        project_id=project_id,
        verifier_id=current_user.id,
        status=VerificationStatus.PENDING,
        comments=None,
        ml_report_id=ml_report.id,
    )
    db.add(review)
    db.commit()

    return ml_report


@router.get("/reports/{project_id}", response_model=list[MLReportResponseSchema])
def get_ml_reports(project_id: str, db: Session = Depends(get_db)):
    return db.query(MLReport).filter(MLReport.project_id == project_id).all()