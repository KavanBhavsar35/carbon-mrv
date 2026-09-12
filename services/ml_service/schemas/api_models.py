from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from shared.schemas.models import ProjectType, RiskLevel

class AnalyzeProjectRequest(BaseModel):
    project_id: str
    baseline_image: str
    current_image: str
    project_type: ProjectType = ProjectType.MANGROVE
    pixel_resolution_m: float = 1.0
    baseline_target_ha: Optional[float] = None
    current_target_ha: Optional[float] = None

class AnalyzeProjectResponse(BaseModel):
    project_id: str
    baseline_area_ha: float
    current_area_ha: float
    change_ha: float
    change_percent: float
    confidence: float
    trend: str
    baseline_vegetation_pct: float
    current_vegetation_pct: float
    evidence_hashes: Dict[str, str]

class EstimateCarbonRequest(BaseModel):
    project_id: str
    area_hectares: float
    project_type: ProjectType = ProjectType.MANGROVE
    methodology: str = "CONFIGURABLE_MANGROVE_METHOD"
    parameters: Optional[Dict[str, float]] = None

class EstimateCarbonResponse(BaseModel):
    project_id: str
    estimated_tco2e: float
    lower_bound_tco2e: float
    upper_bound_tco2e: float
    confidence: float
    methodology: str
    parameters_used: Dict[str, Any]

class VerifyClaimRequest(BaseModel):
    project_id: str
    reported_tco2e: float
    estimated_tco2e: float
    project_area_hectares: float
    vegetation_change_pct: Optional[float] = 0.0

class VerifyClaimResponse(BaseModel):
    verification_score: float
    anomaly_score: float
    risk_level: str
    is_anomaly: bool
    reasons: List[str]
    project_id: str
