from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.enums import DeviceType, DeviceStatus


class IoTDeviceBase(BaseModel):
    device_id: str
    name: str
    type: DeviceType


class IoTDeviceCreate(IoTDeviceBase):
    project_id: str


class IoTDeviceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[DeviceType] = None
    status: Optional[DeviceStatus] = None
    metadata_json: Optional[dict] = None


class IoTDeviceResponse(BaseModel):
    id: str
    project_id: str
    device_id: str
    name: str
    type: str
    status: str
    last_ping: Optional[datetime] = None
    metadata_json: Optional[dict] = None

    model_config = {"from_attributes": True}


class IoTDevicePing(BaseModel):
    device_key: str