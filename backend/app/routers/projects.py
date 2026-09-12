import json
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Project, ProjectEvidence, MLReport, BlockchainTransaction, User
from backend.app.schemas.schemas import ProjectCreate, ProjectResponse, EvidenceResponse, MLReportResponse
from backend.app.services.auth_service import get_current_user
from backend.app.services.ml_client import ml_client
from backend.app.services.blockchain_client import blockchain_service
from ml.preprocessing.image_loader import compute_sha256_bytes

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = Project(
        owner_id=current_user.id,
        project_name=project_in.project_name,
        description=project_in.description,
        project_type=project_in.project_type,
        state=project_in.state,
        district=project_in.district,
        coordinates_lat=project_in.coordinates_lat or 21.85,
        coordinates_lng=project_in.coordinates_lng or 88.90,
        total_area_ha=project_in.total_area_ha or 0.0,
        status="ACTIVE"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Record on blockchain
    onchain_res = blockchain_service.register_project(
        project_id=project.id,
        project_type_idx=0,
        evidence_hash="0x" + ("0" * 64)
    )
    project.onchain_project_id = project.id
    project.blockchain_tx_hash = onchain_res["tx_hash"]

    tx_log = BlockchainTransaction(
        tx_hash=onchain_res["tx_hash"],
        block_number=onchain_res["block_number"],
        contract_address=onchain_res["contract_address"],
        event_name="ProjectRegistered",
        payload_json=json.dumps({"project_id": project.id, "owner": current_user.email})
    )
    db.add(tx_log)
    db.commit()
    db.refresh(project)

    return ProjectResponse.model_validate(project)

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [ProjectResponse.model_validate(p) for p in projects]

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse.model_validate(project)

@router.post("/{project_id}/evidence", response_model=EvidenceResponse)
async def upload_evidence(
    project_id: str,
    file_type: str = Form("BASELINE_IMAGE"), # BASELINE_IMAGE or CURRENT_IMAGE
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    content = await file.read()
    sha256_hash = compute_sha256_bytes(content)

    upload_dir = os.path.join("uploads", project_id)
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as f:
        f.write(content)

    evidence = ProjectEvidence(
        project_id=project.id,
        file_name=file.filename,
        file_type=file_type,
        file_path=file_path,
        sha256_hash=sha256_hash,
        file_size_bytes=len(content)
    )
    db.add(evidence)

    # Set as primary hash if baseline
    if not project.primary_evidence_hash or file_type == "BASELINE_IMAGE":
        project.primary_evidence_hash = sha256_hash

    db.commit()
    db.refresh(evidence)
    return EvidenceResponse.model_validate(evidence)

@router.get("/{project_id}/evidence", response_model=List[EvidenceResponse])
def get_evidence_list(project_id: str, db: Session = Depends(get_db)):
    evidences = db.query(ProjectEvidence).filter(ProjectEvidence.project_id == project_id).all()
    return [EvidenceResponse.model_validate(e) for e in evidences]

@router.post("/{project_id}/analyze", response_model=MLReportResponse)
async def trigger_analysis(
    project_id: str,
    baseline_target_ha: Optional[float] = None,
    current_target_ha: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch uploaded evidences or use project demo parameters
    evidences = db.query(ProjectEvidence).filter(ProjectEvidence.project_id == project_id).all()
    base_img = evidences[0].file_path if evidences else "synthetic_baseline"
    curr_img = evidences[1].file_path if len(evidences) > 1 else "synthetic_current"

    # Step 1: Remote Sensing Analysis
    analysis_res = await ml_client.analyze_project(
        project_id=project.id,
        baseline_image=base_img,
        current_image=curr_img,
        project_type=project.project_type,
        baseline_target_ha=baseline_target_ha,
        current_target_ha=current_target_ha
    )

    # Step 2: Carbon Estimation
    carbon_res = await ml_client.estimate_carbon(
        project_id=project.id,
        area_hectares=analysis_res["current_area_ha"],
        project_type=project.project_type,
        methodology="CONFIGURABLE_MANGROVE_METHOD"
    )

    # Update project state
    project.baseline_area_ha = analysis_res["baseline_area_ha"]
    project.current_area_ha = analysis_res["current_area_ha"]
    project.total_area_ha = analysis_res["current_area_ha"]
    project.area_change_pct = analysis_res["change_percent"]

    ml_report = MLReport(
        project_id=project.id,
        baseline_area_ha=analysis_res["baseline_area_ha"],
        current_area_ha=analysis_res["current_area_ha"],
        change_ha=analysis_res["change_ha"],
        change_percent=analysis_res["change_percent"],
        confidence=analysis_res["confidence"],
        estimated_tco2e=carbon_res["estimated_tco2e"],
        lower_bound_tco2e=carbon_res["lower_bound_tco2e"],
        upper_bound_tco2e=carbon_res["upper_bound_tco2e"],
        methodology=carbon_res["methodology"],
        details_json=json.dumps(analysis_res)
    )
    db.add(ml_report)
    db.commit()
    db.refresh(ml_report)

    return MLReportResponse.model_validate(ml_report)
