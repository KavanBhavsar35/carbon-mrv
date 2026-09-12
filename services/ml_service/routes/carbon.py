from fastapi import APIRouter, HTTPException
from services.ml_service.schemas.api_models import EstimateCarbonRequest, EstimateCarbonResponse
from services.ml_service.services.ml_engine import ml_engine

router = APIRouter(tags=["Carbon Estimation"])

@router.post("/estimate-carbon", response_model=EstimateCarbonResponse)
async def estimate_carbon(request: EstimateCarbonRequest):
    """
    Computes scientific carbon estimation using configurable IPCC Tier-2 methodology parameters.
    """
    try:
        result = ml_engine.estimate_carbon(
            project_id=request.project_id,
            area_hectares=request.area_hectares,
            project_type=request.project_type,
            methodology=request.methodology,
            custom_params=request.parameters
        )
        return EstimateCarbonResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Carbon estimation failed: {str(e)}")
