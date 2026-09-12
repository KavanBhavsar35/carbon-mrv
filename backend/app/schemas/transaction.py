from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.enums import TransactionType


class TransactionCreate(BaseModel):
    type: TransactionType
    to_user_id: Optional[str] = None
    project_id: Optional[str] = None
    credit_id: Optional[str] = None
    amount: float
    price_per_credit: Optional[float] = None
    total_price: Optional[float] = None
    currency: Optional[str] = "ETH"
    metadata_json: Optional[dict] = None


class TransactionResponse(BaseModel):
    id: str
    type: str
    from_user_id: Optional[str] = None
    to_user_id: Optional[str] = None
    project_id: Optional[str] = None
    credit_id: Optional[str] = None
    amount: float
    price_per_credit: Optional[float] = None
    total_price: Optional[float] = None
    currency: str
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    status: str
    metadata_json: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}