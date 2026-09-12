from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.models import Measurement, IoTDevice, Project, User, ProjectUser
from app.models.enums import MeasurementType, UserRole
from app.schemas.measurement import MeasurementCreate, MeasurementResponse, AnalyticsRequest, AnalyticsResponse

router = APIRouter(prefix="/api/v1/measurements", tags=["Measurements"])


@router.post("", response_model=MeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_measurement(
    payload: MeasurementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = db.query(IoTDevice).filter(IoTDevice.id == payload.device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="IoT device not found")

    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if device.project_id != current_user.id and current_user.role != UserRole.ADMIN:
        member = db.query(ProjectUser).filter(
            ProjectUser.project_id == project.id,
            ProjectUser.user_id == current_user.id,
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to add measurements to this project",
            )

    measurement = Measurement(
        device_id=payload.device_id,
        project_id=payload.project_id,
        measurement_type=payload.measurement_type,
        value=payload.value,
        unit=payload.unit,
        timestamp=payload.timestamp or datetime.now(timezone.utc),
        metadata_json=payload.metadata_json,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


@router.get("/project/{project_id}", response_model=list[MeasurementResponse])
def get_measurements_by_project(
    project_id: str,
    measurement_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Measurement).filter(Measurement.project_id == project_id)
    if measurement_type:
        query = query.filter(Measurement.measurement_type == MeasurementType(measurement_type))
    return query.all()


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    project_id: Optional[str] = None,
    measurement_type: Optional[str] = None,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Measurement)

    if project_id:
        query = query.filter(Measurement.project_id == project_id)

    total = query.count()
    if total == 0:
        return AnalyticsResponse(
            project_id=project_id,
            measurement_type=measurement_type,
            period_days=days,
            total_readings=0,
            avg_value=None,
            min_value=None,
            max_value=None,
            latest_value=None,
            trend=None,
        )

    base_q = query
    if measurement_type:
        base_q = base_q.filter(Measurement.measurement_type == MeasurementType(measurement_type))

    latest = base_q.order_by(Measurement.timestamp.desc()).first()
    all_records = base_q.all()

    values = [r.value for r in all_records if r.value is not None]

    avg_val = sum(values) / len(values) if values else None
    min_val = min(values) if values else None
    max_val = max(values) if values else None
    latest_val = latest.value if latest else None

    trend = None
    if len(values) >= 4:
        mid = len(values) // 2
        first_half_avg = sum(values[:mid]) / mid
        second_half_avg = sum(values[mid:]) / (len(values) - mid)
        if abs(second_half_avg - first_half_avg) / max(first_half_avg, 1) > 0.1:
            trend = "increasing" if second_half_avg > first_half_avg else "decreasing"

    return AnalyticsResponse(
        project_id=project_id,
        measurement_type=measurement_type,
        period_days=days,
        total_readings=total,
        avg_value=avg_val,
        min_value=min_val,
        max_value=max_val,
        latest_value=latest_val,
        trend=trend,
    )