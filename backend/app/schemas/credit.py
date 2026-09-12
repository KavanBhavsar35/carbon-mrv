from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class CarbonCreditResponse(BaseModel):
    id: str
    project_id: str
    onchain_credit_id: Optional[str] = None
    amount: float
    vintage: int
    status: str
    blockchain_tx_hash: Optional[str] = None
    owner_wallet_address: Optional[str] = None
    minted_at: Optional[datetime] = None
    retired_at: Optional[datetime] = None
    retired_reason: Optional[str] = None
    certification_body: Optional[str] = None
    certification_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CarbonsCreditsListResponse(BaseModel):
    credits: List[CarbonCreditResponse]
    total: int


class CarbonCreditSyncRequest(BaseModel):
    credit_id: Optional[str] = None
    tx_hash: Optional[str] = None
    credit_data: dict


class VerifyResponse(BaseModel):
    credit: CarbonCreditResponse
    project: dict
    transaction_history: List[dict]