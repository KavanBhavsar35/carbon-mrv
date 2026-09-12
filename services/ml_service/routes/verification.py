from fastapi import APIRouter, HTTPException
from services.ml_service.schemas.api_models import VerifyClaimRequest, VerifyClaimResponse
from services.ml_service.services.ml_engine import ml_engine

router = APIRouter(tags=["Claim Anomaly Detection"])

@router.post("/verify-claim", response_model=VerifyClaimResponse)
async def verify_claim(request: VerifyClaimRequest):
    """
    Evaluates submitted carbon claim against ML estimation and domain distributions
    using an Isolation Forest and rule heuristics.
    """
    try:
        result = ml_engine.verify_claim(
            project_id=request.project_id,
            reported_tco2e=request.reported_tco2e,
            estimated_tco2e=request.estimated_tco2e,
            project_area_hectares=request.project_area_hectares,
            vegetation_change_pct=request.vegetation_change_pct or 0.0
        )
        return VerifyClaimResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Claim verification failed: {str(e)}")
