import logging
import httpx
from typing import Dict, Any
from backend.app.config import settings
from services.ml_service.services.ml_engine import ml_engine
from shared.schemas.models import ProjectType

logger = logging.getLogger(__name__)

class MLServiceClient:
    """
    Client connecting backend to ML Service via HTTP, with fallback to local ML engine
    if the external microservice is offline.
    """
    def __init__(self):
        self.base_url = settings.ML_SERVICE_URL

    async def analyze_project(
        self,
        project_id: str,
        baseline_image: str,
        current_image: str,
        project_type: ProjectType = ProjectType.MANGROVE,
        baseline_target_ha: float = None,
        current_target_ha: float = None
    ) -> Dict[str, Any]:
        payload = {
            "project_id": project_id,
            "baseline_image": baseline_image,
            "current_image": current_image,
            "project_type": project_type.value,
            "baseline_target_ha": baseline_target_ha,
            "current_target_ha": current_target_ha
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(f"{self.base_url}/ml/analyze-project", json=payload)
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.info(f"External ML service not responding, executing in-process engine: {e}")

        return ml_engine.analyze_project(
            project_id=project_id,
            baseline_image=baseline_image,
            current_image=current_image,
            project_type=project_type,
            baseline_target_ha=baseline_target_ha,
            current_target_ha=current_target_ha
        )

    async def estimate_carbon(
        self,
        project_id: str,
        area_hectares: float,
        project_type: ProjectType = ProjectType.MANGROVE,
        methodology: str = "CONFIGURABLE_MANGROVE_METHOD",
        custom_params: Dict[str, float] = None
    ) -> Dict[str, Any]:
        payload = {
            "project_id": project_id,
            "area_hectares": area_hectares,
            "project_type": project_type.value,
            "methodology": methodology,
            "parameters": custom_params
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(f"{self.base_url}/ml/estimate-carbon", json=payload)
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.info(f"External ML service not responding, executing in-process engine: {e}")

        return ml_engine.estimate_carbon(
            project_id=project_id,
            area_hectares=area_hectares,
            project_type=project_type,
            methodology=methodology,
            custom_params=custom_params
        )

    async def verify_claim(
        self,
        project_id: str,
        reported_tco2e: float,
        estimated_tco2e: float,
        project_area_hectares: float,
        vegetation_change_pct: float = 0.0
    ) -> Dict[str, Any]:
        payload = {
            "project_id": project_id,
            "reported_tco2e": reported_tco2e,
            "estimated_tco2e": estimated_tco2e,
            "project_area_hectares": project_area_hectares,
            "vegetation_change_pct": vegetation_change_pct
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(f"{self.base_url}/ml/verify-claim", json=payload)
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.info(f"External ML service not responding, executing in-process engine: {e}")

        return ml_engine.verify_claim(
            project_id=project_id,
            reported_tco2e=reported_tco2e,
            estimated_tco2e=estimated_tco2e,
            project_area_hectares=project_area_hectares,
            vegetation_change_pct=vegetation_change_pct
        )

ml_client = MLServiceClient()
