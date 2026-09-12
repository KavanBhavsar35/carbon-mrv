from fastapi import APIRouter, HTTPException
from services.ml_service.schemas.api_models import AnalyzeProjectRequest, AnalyzeProjectResponse
from services.ml_service.services.ml_engine import ml_engine

router = APIRouter(tags=["Remote Sensing"])

@router.post("/analyze-project", response_model=AnalyzeProjectResponse)
async def analyze_project(request: AnalyzeProjectRequest):
    """
    Analyzes baseline vs current remote-sensing imagery to compute vegetation canopy cover,
    hectare area, and temporal change.
    """
    try:
        result = ml_engine.analyze_project(
            project_id=request.project_id,
            baseline_image=request.baseline_image,
            current_image=request.current_image,
            project_type=request.project_type,
            pixel_resolution_m=request.pixel_resolution_m,
            baseline_target_ha=request.baseline_target_ha,
            current_target_ha=request.current_target_ha
        )
        return AnalyzeProjectResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image analysis failed: {str(e)}")
