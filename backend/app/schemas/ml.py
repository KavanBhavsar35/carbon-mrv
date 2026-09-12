from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class MLReportBase(BaseModel):
    source_images: List[str]
    vegetation_cover_pct: float
    estimated_biomass: float
    anomaly_flags: Optional[List[dict]] = None
    model_version: str
    confidence: float
    project_id: str


class MLReportCreate(BaseModel):
    project_id: str
    source_images: List[str]
    vegetation_cover_pct: float
    estimated_biomass: float
    anomaly_flags: Optional[List[dict]] = None
    model_version: str
    confidence: float


class MLReportResponse(BaseModel):
    id: str
    project_id: str
    source_images: List[str]
    vegetation_cover_pct: float
    estimated_biomass: float
    anomaly_flags: Optional[List[dict]] = None
    model_version: str
    confidence: float
    created_at: datetime

    model_config = {"from_attributes": True}


class MLVerifyRequest(BaseModel):
    image_urls: List[str]
    latitude: Optional[float] = None
    longitude: Optional[float] = None