import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import Claim, Project, MLReport, BlockchainTransaction, User
from backend.app.schemas.schemas import ClaimCreate, ClaimResponse
from backend.app.services.auth_service import get_current_user
from backend.app.services.ml_client import ml_client
from backend.app.services.blockchain_client import blockchain_service
from shared.schemas.models import ClaimStatus

router = APIRouter(prefix="/claims", tags=["Claims"])

@router.post("", response_model=ClaimResponse)
async def submit_claim(
    claim_in: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == claim_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch latest ML Report for project
    ml_report = db.query(MLReport).filter(MLReport.project_id == project.id).order_by(MLReport.created_at.desc()).first()
    estimated_tco2e = ml_report.estimated_tco2e if ml_report else (project.total_area_ha * 10.13)
    project_area = project.total_area_ha if project.total_area_ha > 0 else 10.0
    veg_change = project.area_change_pct

    # Run ML Anomaly Detection
    verif_res = await ml_client.verify_claim(
        project_id=project.id,
        reported_tco2e=claim_in.reported_tco2e,
        estimated_tco2e=estimated_tco2e,
        project_area_hectares=project_area,
        vegetation_change_pct=veg_change
    )

    evidence_hash = project.primary_evidence_hash or "0x" + ("e" * 64)

    claim = Claim(
        project_id=project.id,
        issuer_id=current_user.id,
        reported_tco2e=claim_in.reported_tco2e,
        ml_estimated_tco2e=estimated_tco2e,
        verification_score=verif_res["verification_score"],
        anomaly_score=verif_res["anomaly_score"],
        risk_level=verif_res["risk_level"],
        reasons_json=json.dumps(verif_res["reasons"]),
        evidence_hash=evidence_hash,
        status=ClaimStatus.ANALYZED
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    # Submit to Blockchain
    onchain_res = blockchain_service.submit_claim(
        claim_id=claim.id,
        project_id=project.id,
        reported_co2e=claim.reported_tco2e,
        evidence_hash=evidence_hash
    )
    claim.onchain_claim_id = claim.id
    claim.blockchain_tx_hash = onchain_res["tx_hash"]

    # Record ML verification event on blockchain
    ml_onchain = blockchain_service.record_ml_verification(
        claim_id=claim.id,
        ml_co2e=estimated_tco2e,
        verification_score=verif_res["verification_score"],
        anomaly_score=verif_res["anomaly_score"],
        risk_level=verif_res["risk_level"]
    )

    tx_log = BlockchainTransaction(
        tx_hash=onchain_res["tx_hash"],
        block_number=onchain_res["block_number"],
        contract_address=onchain_res["contract_address"],
        event_name="ClaimSubmitted",
        payload_json=json.dumps({"claim_id": claim.id, "reported_tco2e": claim.reported_tco2e})
    )
    db.add(tx_log)
    db.commit()
    db.refresh(claim)

    response_data = ClaimResponse.model_validate(claim)
    response_data.reasons = json.loads(claim.reasons_json or "[]")
    return response_data

@router.get("", response_model=List[ClaimResponse])
def list_claims(db: Session = Depends(get_db)):
    claims = db.query(Claim).order_by(Claim.submitted_at.desc()).all()
    results = []
    for c in claims:
        item = ClaimResponse.model_validate(c)
        item.reasons = json.loads(c.reasons_json or "[]")
        results.append(item)
    return results

@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    res = ClaimResponse.model_validate(claim)
    res.reasons = json.loads(claim.reasons_json or "[]")
    return res

@router.post("/{claim_id}/analyze", response_model=ClaimResponse)
async def analyze_claim(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    project = claim.project
    verif_res = await ml_client.verify_claim(
        project_id=project.id,
        reported_tco2e=claim.reported_tco2e,
        estimated_tco2e=claim.ml_estimated_tco2e,
        project_area_hectares=project.total_area_ha,
        vegetation_change_pct=project.area_change_pct
    )

    claim.verification_score = verif_res["verification_score"]
    claim.anomaly_score = verif_res["anomaly_score"]
    claim.risk_level = verif_res["risk_level"]
    claim.reasons_json = json.dumps(verif_res["reasons"])
    db.commit()
    db.refresh(claim)

    res = ClaimResponse.model_validate(claim)
    res.reasons = verif_res["reasons"]
    return res
