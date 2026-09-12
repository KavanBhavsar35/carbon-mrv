from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models.models import IoTDevice, Project, User
from app.models.enums import DeviceStatus, UserRole
from app.schemas.iot_device import IoTDeviceCreate, IoTDeviceResponse, IoTDeviceUpdate

router = APIRouter(prefix="/api/v1/iot-devices", tags=["IoT Devices"])


@router.post("", response_model=IoTDeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    payload: IoTDeviceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner can register devices",
        )

    device = IoTDevice(
        project_id=payload.project_id,
        device_id=payload.device_id,
        name=payload.name,
        type=payload.type,
        status=DeviceStatus.ACTIVE,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.post("/{device_id}/ping", response_model=IoTDeviceResponse)
def device_ping(
    device_id: str,
    payload: dict,
    device_key: Optional[str] = None,
    db: Session = Depends(get_db),
):
    device = db.query(IoTDevice).filter(IoTDevice.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    device.last_ping = datetime.now(timezone.utc)
    if "status" in payload:
        device.status = DeviceStatus(payload["status"])
    if "metadata_json" in payload:
        device.metadata_json = payload["metadata_json"]

    db.commit()
    db.refresh(device)
    return device


@router.get("/{device_id}", response_model=IoTDeviceResponse)
def get_device(device_id: str, db: Session = Depends(get_db)):
    device = db.query(IoTDevice).filter(IoTDevice.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return device


@router.put("/{device_id}", response_model=IoTDeviceResponse)
def update_device(
    device_id: str,
    payload: IoTDeviceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = db.query(IoTDevice).filter(IoTDevice.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    project = db.query(Project).filter(Project.id == device.project_id).first()
    if project.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner can update device",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)

    db.commit()
    db.refresh(device)
    return device