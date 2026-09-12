from typing import Dict, Any
from ml.inference.change_detection import TemporalChangeDetector
from ml.carbon_estimator.estimator import CarbonEstimator
from ml.anomaly_detection.detector import ClaimAnomalyDetector
from shared.schemas.models import ProjectType

class MLEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLEngine, cls).__new__(cls)
            cls._instance.change_detector = TemporalChangeDetector()
            cls._instance.carbon_estimator = CarbonEstimator()
            cls._instance.anomaly_detector = ClaimAnomalyDetector()
            cls._instance.is_initialized = True
        return cls._instance

    def analyze_project(
        self,
        project_id: str,
        baseline_image: str,
        current_image: str,
        project_type: ProjectType = ProjectType.MANGROVE,
        pixel_resolution_m: float = 1.0,
        baseline_target_ha: float = None,
        current_target_ha: float = None
    ) -> Dict[str, Any]:
        result = self.change_detector.analyze_change(
            baseline_image=baseline_image,
            current_image=current_image,
            pixel_resolution_m=pixel_resolution_m,
            baseline_target_ha=baseline_target_ha,
            current_target_ha=current_target_ha
        )
        result["project_id"] = project_id
        return result

    def estimate_carbon(
        self,
        project_id: str,
        area_hectares: float,
        project_type: ProjectType = ProjectType.MANGROVE,
        methodology: str = "CONFIGURABLE_MANGROVE_METHOD",
        custom_params: Dict[str, float] = None
    ) -> Dict[str, Any]:
        result = self.carbon_estimator.estimate_carbon(
            area_hectares=area_hectares,
            project_type=project_type,
            methodology_name=methodology,
            custom_params=custom_params
        )
        result["project_id"] = project_id
        return result

    def verify_claim(
        self,
        project_id: str,
        reported_tco2e: float,
        estimated_tco2e: float,
        project_area_hectares: float,
        vegetation_change_pct: float = 0.0
    ) -> Dict[str, Any]:
        return self.anomaly_detector.verify_claim(
            project_id=project_id,
            reported_tco2e=reported_tco2e,
            estimated_tco2e=estimated_tco2e,
            project_area_hectares=project_area_hectares,
            vegetation_change_pct=vegetation_change_pct
        )

ml_engine = MLEngine()
