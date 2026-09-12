from typing import Dict, Any, Union
import numpy as np
from ml.preprocessing.image_loader import load_image_as_numpy
from ml.models.segmentation import MangroveSegmentationModel

class TemporalChangeDetector:
    """
    Detects land cover and mangrove canopy changes between baseline (T0) and current (T1) observation.
    """
    def __init__(self, model: MangroveSegmentationModel = None):
        self.model = model or MangroveSegmentationModel()

    def analyze_change(
        self,
        baseline_image: Union[str, bytes, np.ndarray],
        current_image: Union[str, bytes, np.ndarray],
        pixel_resolution_m: float = 1.0,
        baseline_target_ha: float = None,
        current_target_ha: float = None
    ) -> Dict[str, Any]:
        # Load baseline image
        if isinstance(baseline_image, np.ndarray):
            base_np = baseline_image
            base_hash = "in-memory-array"
        else:
            base_np, base_hash = load_image_as_numpy(baseline_image)

        # Load current image
        if isinstance(current_image, np.ndarray):
            curr_np = current_image
            curr_hash = "in-memory-array"
        else:
            curr_np, curr_hash = load_image_as_numpy(current_image)

        # Segment both images
        base_analysis = self.model.analyze_image(
            base_np,
            pixel_resolution_m=pixel_resolution_m,
            forced_area_ha=baseline_target_ha
        )
        curr_analysis = self.model.analyze_image(
            curr_np,
            pixel_resolution_m=pixel_resolution_m,
            forced_area_ha=current_target_ha
        )

        base_ha = base_analysis["vegetation_area_ha"]
        curr_ha = curr_analysis["vegetation_area_ha"]

        change_ha = round(curr_ha - base_ha, 4)
        if base_ha > 0:
            change_percent = round((change_ha / base_ha) * 100.0, 2)
        else:
            change_percent = 0.0

        # Overall confidence is harmonic mean of both segmentation confidences
        c1 = base_analysis["confidence"]
        c2 = curr_analysis["confidence"]
        overall_confidence = round(2 * (c1 * c2) / (c1 + c2), 3)

        trend = "EXPANSION" if change_ha > 0.05 else ("DEGRADATION" if change_ha < -0.05 else "STABLE")

        return {
            "baseline_area_ha": base_ha,
            "current_area_ha": curr_ha,
            "change_ha": change_ha,
            "change_percent": change_percent,
            "baseline_vegetation_pct": base_analysis["vegetation_percentage"],
            "current_vegetation_pct": curr_analysis["vegetation_percentage"],
            "confidence": overall_confidence,
            "trend": trend,
            "evidence_hashes": {
                "baseline_sha256": base_hash,
                "current_sha256": curr_hash
            }
        }
