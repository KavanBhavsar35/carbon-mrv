"""Shared schema models and enumerations for Circular Carbon Ecosystem."""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ProjectType(str, Enum):
    MANGROVE = "MANGROVE"
    FOREST = "FOREST"
    AGRICULTURE = "AGRICULTURE"
    WETLAND = "WETLAND"
    OTHER = "OTHER"

class ClaimStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    ANALYZED = "ANALYZED"
    PENDING_AUDIT = "PENDING_AUDIT"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ISSUED = "ISSUED"

class CreditStatus(str, Enum):
    ACTIVE = "ACTIVE"
    RETIRED = "RETIRED"

class UserRole(str, Enum):
    ISSUER = "ISSUER"
    AUDITOR = "AUDITOR"
    BUYER = "BUYER"
    REGULATOR = "REGULATOR"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class EvidenceItem(BaseModel):
    file_name: str
    sha256: str
    storage_reference: str
    file_size_bytes: int = 0
    uploaded_at: Optional[str] = None

class ProjectAnalysisRequest(BaseModel):
    project_id: str
    baseline_image: str = Field(..., description="Base64 data URI, file path, or relative storage reference")
    current_image: str = Field(..., description="Base64 data URI, file path, or relative storage reference")
    project_type: ProjectType = ProjectType.MANGROVE
    pixel_resolution_m: float = 1.0

class ProjectAnalysisResponse(BaseModel):
    project_id: str
    baseline_area_ha: float
    current_area_ha: float
    change_ha: float
    change_percent: float
    confidence: float
    baseline_vegetation_pct: float
    current_vegetation_pct: float
    details: Optional[Dict[str, Any]] = None

class CarbonEstimateRequest(BaseModel):
    project_id: str
    area_hectares: float
    project_type: ProjectType = ProjectType.MANGROVE
    methodology: str = "CONFIGURABLE_MANGROVE_METHOD"
    parameters: Optional[Dict[str, float]] = None

class CarbonEstimateResponse(BaseModel):
    project_id: str
    estimated_tco2e: float
    lower_bound_tco2e: float
    upper_bound_tco2e: float
    confidence: float
    methodology: str
    parameters_used: Dict[str, Any] = Field(default_factory=dict)

class ClaimVerificationRequest(BaseModel):
    project_id: str
    reported_tco2e: float
    estimated_tco2e: float
    project_area_hectares: float
    vegetation_change_pct: Optional[float] = 0.0

class ClaimVerificationResponse(BaseModel):
    verification_score: float
    anomaly_score: float
    risk_level: RiskLevel
    is_anomaly: bool
    reasons: List[str]
