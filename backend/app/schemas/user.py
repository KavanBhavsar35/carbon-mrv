from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.enums import UserRole


class UserBase(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.USER
    wallet_address: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    wallet_address: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    wallet_address: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserMeResponse(UserResponse):
    pass