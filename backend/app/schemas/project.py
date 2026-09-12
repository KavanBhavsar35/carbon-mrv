from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.enums import (
    OrganizationType,
    ProjectType,
    ProjectUserRole,
)


class ProjectUserBase(BaseModel):
    role: ProjectUserRole = ProjectUserRole.VIEWER


class ProjectUserCreate(ProjectUserBase):
    user_id: str


class ProjectUserResponse(BaseModel):
    id: str
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class ProjectBase(BaseModel):
    organization_name: str
    organization_type: OrganizationType
    contact_person: str
    email: str
    phone: str
    project_name: str
    description: str
    project_type: ProjectType
    state: str
    district: str
    village: str
    coordinates: dict | None = None
    total_area: float
    estimated_credits_per_year: float
    registration_number: Optional[str] = None
    has_legal_permits: bool = False
    has_survey_report: bool = False
    has_environmental_clearance: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    project_name: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    coordinates: Optional[dict] = None
    total_area: Optional[float] = None
    estimated_credits_per_year: Optional[float] = None
    registration_number: Optional[str] = None
    has_legal_permits: Optional[bool] = None
    has_survey_report: Optional[bool] = None
    has_environmental_clearance: Optional[bool] = None


class ProjectResponse(BaseModel):
    id: str
    owner_id: str
    organization_name: str
    organization_type: str
    contact_person: str
    email: str
    phone: str
    project_name: str
    description: str
    project_type: str
    state: str
    district: str
    village: str
    coordinates: Optional[dict] = None
    total_area: float
    estimated_credits_per_year: float
    registration_number: Optional[str] = None
    has_legal_permits: bool
    has_survey_report: bool
    has_environmental_clearance: bool
    contract_address: Optional[str] = None
    token_id: Optional[str] = None
    status: str
    total_credits_generated: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectStatusUpdate(BaseModel):
    status: str
    comments: Optional[str] = None