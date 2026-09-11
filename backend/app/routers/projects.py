from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_user_optional, require_roles
from app.models.models import Project, ProjectUser, User, IoTDevice, Measurement, CarbonCredit, Transaction, MLReport, VerificationReview
from app.models.enums import ProjectStatus, ProjectUserRole, UserRole
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectStatusUpdate, ProjectUserCreate, ProjectUserResponse,
)
from app.schemas.measurement import MeasurementResponse
from app.schemas.iot_device import IoTDeviceResponse
from app.schemas.credit import CarbonCreditResponse
from app.schemas.verification import VerificationReviewCreate, VerificationReviewResponse
from app.schemas.transaction import TransactionResponse

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = Project(
        owner_id=current_user.id,
        organization_name=payload.organization_name,
        organization_type=payload.organization_type,
        contact_person=payload.contact_person,
        email=payload.email,
        phone=payload.phone,
        project_name=payload.project_name,
        description=payload.description,
        project_type=payload.project_type,
        state=payload.state,
        district=payload.district,
        village=payload.village,
        coordinates=payload.coordinates,
        total_area=payload.total_area,
        estimated_credits_per_year=payload.estimated_credits_per_year,
        registration_number=payload.registration_number,
        has_legal_permits=payload.has_legal_permits,
        has_survey_report=payload.has_survey_report,
        has_environmental_clearance=payload.has_environmental_clearance,
        status=ProjectStatus.PENDING,
        total_credits_generated=0.0,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    db.add(ProjectUser(
        project_id=project.id,
        user_id=current_user.id,
        role=ProjectUserRole.OWNER,
    ))
    db.commit()
    return project


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    status: Optional[str] = None,
    project_type: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == ProjectStatus(status))
    if project_type:
        from app.models.enums import ProjectType
        query = query.filter(Project.project_type == ProjectType(project_type))
    return query.all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    is_owner = project.owner_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN
    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner or admin can edit",
        )

    if project.status not in (ProjectStatus.PENDING, ProjectStatus.APPROVED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit project in current status",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}/status", response_model=ProjectResponse)
def update_project_status(
    project_id: str,
    payload: ProjectStatusUpdate,
    current_user: User = Depends(require_roles(UserRole.VERIFIER)),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    try:
        new_status = ProjectStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    project.status = new_status
    if new_status in (ProjectStatus.APPROVED, ProjectStatus.REJECTED):
        project.total_credits_generated = project.estimated_credits_per_year

    review = VerificationReview(
        project_id=project.id,
        verifier_id=current_user.id,
        status=new_status,
        comments=None,
        ml_report_id=None,
    )
    db.add(review)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}/measurements", response_model=list[MeasurementResponse])
def get_project_measurements(project_id: str, db: Session = Depends(get_db)):
    return db.query(Measurement).filter(Measurement.project_id == project_id).all()


@router.get("/{project_id}/devices", response_model=list[IoTDeviceResponse])
def get_project_devices(project_id: str, db: Session = Depends(get_db)):
    return db.query(IoTDevice).filter(IoTDevice.project_id == project_id).all()


@router.get("/{project_id}/credits", response_model=list[CarbonCreditResponse])
def get_project_credits(project_id: str, db: Session = Depends(get_db)):
    return db.query(CarbonCredit).filter(CarbonCredit.project_id == project_id).all()


@router.get("/{project_id}/reviews", response_model=list[VerificationReviewResponse])
def get_project_reviews(project_id: str, db: Session = Depends(get_db)):
    return db.query(VerificationReview).filter(VerificationReview.project_id == project_id).all()


@router.get("/{project_id}/transactions", response_model=list[TransactionResponse])
def get_project_transactions(project_id: str, db: Session = Depends(get_db)):
    return db.query(Transaction).filter(Transaction.project_id == project_id).all()