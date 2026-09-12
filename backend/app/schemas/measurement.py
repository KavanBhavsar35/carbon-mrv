from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.enums import MeasurementType


class MeasurementBase(BaseModel):
    measurement_type: MeasurementType
    value: float
    unit: str
    timestamp: Optional[datetime] = None
    metadata_json: Optional[dict] = None


class MeasurementCreate(BaseModel):
    device_id: str
    project_id: str
    measurement_type: MeasurementType
    value: float
    unit: str
    timestamp: Optional[datetime] = None
    metadata_json: Optional[dict] = None


class MeasurementResponse(BaseModel):
    id: str
    device_id: str
    project_id: str
    measurement_type: str
    value: float
    unit: str
    timestamp: datetime
    metadata_json: Optional[dict] = None

    model_config = {"from_attributes": True}


class AnalyticsRequest(BaseModel):
    project_id: Optional[str] = None
    measurement_type: Optional[MeasurementType] = None
    days: int = 30


class AnalyticsResponse(BaseModel):
    project_id: Optional[str]
    measurement_type: Optional[str]
    period_days: int
    total_readings: int
    avg_value: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    latest_value: Optional[float] = None
    trend: Optional[str] = None