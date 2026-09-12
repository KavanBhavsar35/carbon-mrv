import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any

from sqlalchemy import (
    String, Text, Boolean, Float, Integer, ForeignKey, Enum as SQLEnum,
    JSON, DateTime, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import (
    UserRole, OrganizationType, ProjectType, ProjectStatus, ProjectUserRole,
    DeviceType, DeviceStatus, MeasurementType, VerificationStatus,
    CreditStatus, TransactionType, TransactionStatus
)

def default_uuid() -> str:
    return str(uuid.uuid4())

def default_utcnow() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    wallet_address: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    organization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=default_utcnow, onupdate=default_utcnow, nullable=False
    )

    # Relationships
    owned_projects: Mapped[List["Project"]] = relationship("Project", back_populates="owner")
    project_memberships: Mapped[List["ProjectUser"]] = relationship("ProjectUser", back_populates="user")
    reviews: Mapped[List["VerificationReview"]] = relationship("VerificationReview", back_populates="verifier")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    organization_type: Mapped[OrganizationType] = mapped_column(SQLEnum(OrganizationType), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    project_type: Mapped[ProjectType] = mapped_column(SQLEnum(ProjectType), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    village: Mapped[str] = mapped_column(String(100), nullable=False)
    coordinates: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    total_area: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_credits_per_year: Mapped[float] = mapped_column(Float, nullable=False)
    registration_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    has_legal_permits: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_survey_report: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_environmental_clearance: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    contract_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    token_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(SQLEnum(ProjectStatus), default=ProjectStatus.PENDING, nullable=False)
    total_credits_generated: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=default_utcnow, onupdate=default_utcnow, nullable=False
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="owned_projects")
    members: Mapped[List["ProjectUser"]] = relationship("ProjectUser", back_populates="project")
    devices: Mapped[List["IoTDevice"]] = relationship("IoTDevice", back_populates="project")
    measurements: Mapped[List["Measurement"]] = relationship("Measurement", back_populates="project")
    ml_reports: Mapped[List["MLReport"]] = relationship("MLReport", back_populates="project")
    reviews: Mapped[List["VerificationReview"]] = relationship("VerificationReview", back_populates="project")
    carbon_credits: Mapped[List["CarbonCredit"]] = relationship("CarbonCredit", back_populates="project")
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="project")


class ProjectUser(Base):
    __tablename__ = "project_users"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_user"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    role: Mapped[ProjectUserRole] = mapped_column(SQLEnum(ProjectUserRole), default=ProjectUserRole.VIEWER, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_utcnow, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="project_memberships")


class IoTDevice(Base):
    __tablename__ = "iot_devices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    device_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[DeviceType] = mapped_column(SQLEnum(DeviceType), nullable=False)
    status: Mapped[DeviceStatus] = mapped_column(SQLEnum(DeviceStatus), default=DeviceStatus.ACTIVE, nullable=False)
    last_ping: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="devices")
    measurements: Mapped[List["Measurement"]] = relationship("Measurement", back_populates="device")


class Measurement(Base):
    __tablename__ = "measurements"
    __table_args__ = (
        Index("idx_project_timestamp", "project_id", "timestamp"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    device_id: Mapped[str] = mapped_column(String(36), ForeignKey("iot_devices.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    measurement_type: Mapped[MeasurementType] = mapped_column(SQLEnum(MeasurementType), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_utcnow, nullable=False)
    metadata_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)

    device: Mapped["IoTDevice"] = relationship("IoTDevice", back_populates="measurements")
    project: Mapped["Project"] = relationship("Project", back_populates="measurements")


class MLReport(Base):
    __tablename__ = "ml_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    source_images: Mapped[Any] = mapped_column(JSON, nullable=False)
    vegetation_cover_pct: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_biomass: Mapped[float] = mapped_column(Float, nullable=False)
    anomaly_flags: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_utcnow, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="ml_reports")
    reviews: Mapped[List["VerificationReview"]] = relationship("VerificationReview", back_populates="ml_report")


class VerificationReview(Base):
    __tablename__ = "verification_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    verifier_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    status: Mapped[VerificationStatus] = mapped_column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ml_report_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("ml_reports.id"), nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_utcnow, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="reviews")
    verifier: Mapped["User"] = relationship("User", back_populates="reviews")
    ml_report: Mapped[Optional["MLReport"]] = relationship("MLReport", back_populates="reviews")


class CarbonCredit(Base):
    __tablename__ = "carbon_credits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    onchain_credit_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    vintage: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[CreditStatus] = mapped_column(SQLEnum(CreditStatus), default=CreditStatus.ISSUED, nullable=False)
    blockchain_tx_hash: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    owner_wallet_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    minted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    retired_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    retired_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    certification_body: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    certification_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=default_utcnow, onupdate=default_utcnow, nullable=False
    )

    project: Mapped["Project"] = relationship("Project", back_populates="carbon_credits")
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="credit")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    type: Mapped[TransactionType] = mapped_column(SQLEnum(TransactionType), nullable=False)
    from_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    to_user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id"), nullable=True)
    credit_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("carbon_credits.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_credit: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(20), default="ETH", nullable=False)
    tx_hash: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    block_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[TransactionStatus] = mapped_column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    metadata_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_utcnow, nullable=False)

    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="transactions")
    credit: Mapped[Optional["CarbonCredit"]] = relationship("CarbonCredit", back_populates="transactions")
