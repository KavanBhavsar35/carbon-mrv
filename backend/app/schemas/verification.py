from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class VerificationReviewCreate(BaseModel):
    project_id: str
    ml_report_id: Optional[str] = None
    comments: Optional[str] = None


class VerificationReviewResponse(BaseModel):
    id: str
    project_id: str
    verifier_id: str
    status: str
    comments: Optional[str] = None
    ml_report_id: Optional[str] = None
    reviewed_at: datetime

    model_config = {"from_attributes": True}