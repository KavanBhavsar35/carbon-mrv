import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from backend.app.database import Base
from shared.schemas.models import ProjectType, ClaimStatus, CreditStatus, UserRole, RiskLevel

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.ISSUER, nullable=False)
    wallet_address = Column(String(66), nullable=True)
    organization = Column(String(255), nullable=True)
    country = Column(String(100), default="India")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="owner")
    claims = relationship("Claim", back_populates="issuer", foreign_keys="Claim.issuer_id")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    project_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    project_type = Column(SQLEnum(ProjectType), default=ProjectType.MANGROVE, nullable=False)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    coordinates_lat = Column(Float, nullable=True)
    coordinates_lng = Column(Float, nullable=True)
    total_area_ha = Column(Float, default=0.0)
    baseline_area_ha = Column(Float, default=0.0)
    current_area_ha = Column(Float, default=0.0)
    area_change_pct = Column(Float, default=0.0)
    status = Column(String(50), default="PENDING")
    primary_evidence_hash = Column(String(66), nullable=True)
    onchain_project_id = Column(String(66), nullable=True)
    blockchain_tx_hash = Column(String(66), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    evidence_items = relationship("ProjectEvidence", back_populates="project", cascade="all, delete-orphan")
    ml_reports = relationship("MLReport", back_populates="project", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="project", cascade="all, delete-orphan")

class ProjectEvidence(Base):
    __tablename__ = "project_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), default="BASELINE_IMAGE") # BASELINE_IMAGE, CURRENT_IMAGE, SURVEY_REPORT
    file_path = Column(String(500), nullable=False)
    sha256_hash = Column(String(66), nullable=False, index=True)
    file_size_bytes = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="evidence_items")

class MLReport(Base):
    __tablename__ = "ml_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    baseline_area_ha = Column(Float, nullable=False)
    current_area_ha = Column(Float, nullable=False)
    change_ha = Column(Float, nullable=False)
    change_percent = Column(Float, nullable=False)
    confidence = Column(Float, default=0.85)
    estimated_tco2e = Column(Float, nullable=False)
    lower_bound_tco2e = Column(Float, nullable=False)
    upper_bound_tco2e = Column(Float, nullable=False)
    methodology = Column(String(100), default="CONFIGURABLE_MANGROVE_METHOD")
    model_version = Column(String(50), default="v1.0")
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="ml_reports")

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    issuer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reported_tco2e = Column(Float, nullable=False)
    ml_estimated_tco2e = Column(Float, default=0.0)
    verification_score = Column(Float, default=0.0) # 0.0 to 1.0
    anomaly_score = Column(Float, default=0.0)      # 0.0 to 1.0
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH
    reasons_json = Column(Text, default="[]")
    evidence_hash = Column(String(66), nullable=False)
    status = Column(SQLEnum(ClaimStatus), default=ClaimStatus.SUBMITTED, nullable=False)
    auditor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    auditor_comments = Column(Text, nullable=True)
    onchain_claim_id = Column(String(66), nullable=True)
    blockchain_tx_hash = Column(String(66), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    audited_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="claims")
    issuer = relationship("User", back_populates="claims", foreign_keys=[issuer_id])
    credits = relationship("CarbonCredit", back_populates="claim")

class CarbonCredit(Base):
    __tablename__ = "carbon_credits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    onchain_credit_id = Column(Integer, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    current_owner = Column(String(66), nullable=False)
    status = Column(SQLEnum(CreditStatus), default=CreditStatus.ACTIVE, nullable=False)
    vintage_year = Column(Integer, default=2026)
    minted_at = Column(DateTime, default=datetime.utcnow)
    retired_at = Column(DateTime, nullable=True)
    retired_reason = Column(Text, nullable=True)
    retired_by = Column(String(66), nullable=True)
    mint_tx_hash = Column(String(66), nullable=True)
    retire_tx_hash = Column(String(66), nullable=True)

    claim = relationship("Claim", back_populates="credits")

class BlockchainTransaction(Base):
    __tablename__ = "blockchain_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tx_hash = Column(String(66), unique=True, index=True, nullable=False)
    block_number = Column(Integer, default=0)
    from_address = Column(String(66), nullable=True)
    to_address = Column(String(66), nullable=True)
    contract_address = Column(String(66), nullable=True)
    event_name = Column(String(100), nullable=False)
    payload_json = Column(Text, nullable=True)
    status = Column(String(20), default="CONFIRMED")
    timestamp = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action = Column(String(100), nullable=False)
    actor_id = Column(String(36), nullable=True)
    actor_role = Column(String(50), nullable=True)
    target_id = Column(String(36), nullable=True)
    target_type = Column(String(50), nullable=True)
    details_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
