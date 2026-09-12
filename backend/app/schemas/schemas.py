from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr
from shared.schemas.models import ProjectType, ClaimStatus, CreditStatus, UserRole, RiskLevel

# Auth Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole = UserRole.ISSUER
    organization: Optional[str] = None
    wallet_address: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    organization: Optional[str] = None
    wallet_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Project Schemas
class ProjectCreate(BaseModel):
    project_name: str
    description: Optional[str] = None
    project_type: ProjectType = ProjectType.MANGROVE
    state: Optional[str] = None
    district: Optional[str] = None
    coordinates_lat: Optional[float] = None
    coordinates_lng: Optional[float] = None
    total_area_ha: Optional[float] = 0.0

class EvidenceResponse(BaseModel):
    id: str
    project_id: str
    file_name: str
    file_type: str
    sha256_hash: str
    file_size_bytes: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class MLReportResponse(BaseModel):
    id: str
    project_id: str
    baseline_area_ha: float
    current_area_ha: float
    change_ha: float
    change_percent: float
    confidence: float
    estimated_tco2e: float
    lower_bound_tco2e: float
    upper_bound_tco2e: float
    methodology: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: str
    owner_id: str
    project_name: str
    description: Optional[str]
    project_type: ProjectType
    state: Optional[str]
    district: Optional[str]
    coordinates_lat: Optional[float]
    coordinates_lng: Optional[float]
    total_area_ha: float
    baseline_area_ha: float
    current_area_ha: float
    area_change_pct: float
    status: str
    primary_evidence_hash: Optional[str]
    onchain_project_id: Optional[str]
    blockchain_tx_hash: Optional[str]
    created_at: datetime
    evidence_items: List[EvidenceResponse] = []
    ml_reports: List[MLReportResponse] = []

    class Config:
        from_attributes = True

# Claim Schemas
class ClaimCreate(BaseModel):
    project_id: str
    reported_tco2e: float

class ClaimResponse(BaseModel):
    id: str
    project_id: str
    issuer_id: str
    reported_tco2e: float
    ml_estimated_tco2e: float
    verification_score: float
    anomaly_score: float
    risk_level: str
    reasons: List[str] = []
    evidence_hash: str
    status: ClaimStatus
    onchain_claim_id: Optional[str]
    blockchain_tx_hash: Optional[str]
    submitted_at: datetime
    audited_at: Optional[datetime] = None
    auditor_id: Optional[str] = None
    reject_reason: Optional[str] = None
    project: Optional[ProjectResponse] = None

    class Config:
        from_attributes = True

class AuditDecisionRequest(BaseModel):
    comments: Optional[str] = ""
    reason: Optional[str] = ""

# Credit Schemas
class CreditTransferRequest(BaseModel):
    to_address: str

class CreditRetireRequest(BaseModel):
    reason: str

class CreditResponse(BaseModel):
    id: str
    claim_id: str
    project_id: str
    onchain_credit_id: int
    amount: float
    current_owner: str
    status: CreditStatus
    vintage_year: int
    minted_at: datetime
    retired_at: Optional[datetime]
    retired_reason: Optional[str]
    retired_by: Optional[str]
    mint_tx_hash: Optional[str]
    retire_tx_hash: Optional[str]

    class Config:
        from_attributes = True
