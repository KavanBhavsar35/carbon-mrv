import pytest
import os
import numpy as np
from shared.schemas.models import ProjectType, RiskLevel
from ml.preprocessing.image_loader import load_image_as_numpy, compute_sha256_bytes
from ml.models.segmentation import MangroveSegmentationModel
from ml.inference.change_detection import TemporalChangeDetector
from ml.carbon_estimator.estimator import CarbonEstimator
from ml.anomaly_detection.detector import ClaimAnomalyDetector

def test_evidence_hashing():
    data = b"mangrove_drone_test_sample"
    h1 = compute_sha256_bytes(data)
    h2 = compute_sha256_bytes(data)
    assert h1 == h2
    assert len(h1) == 64

def test_mangrove_segmentation():
    model = MangroveSegmentationModel()
    # Create synthetic RGB test array
    test_img = np.zeros((100, 100, 3), dtype=np.float32)
    # Give green vegetation signature to top half
    test_img[:50, :, 1] = 0.8
    test_img[:50, :, 0] = 0.2
    test_img[:50, :, 2] = 0.2
    # Bottom half is mud/water
    test_img[50:, :, 0] = 0.3
    test_img[50:, :, 1] = 0.3
    test_img[50:, :, 2] = 0.5

    result = model.analyze_image(test_img, pixel_resolution_m=1.0)
    assert result["vegetation_percentage"] > 40.0
    assert result["vegetation_area_ha"] > 0.0
    assert result["confidence"] > 0.70

def test_temporal_change_detection():
    detector = TemporalChangeDetector()
    # Baseline: 10.2 ha, Current: 12.4 ha
    result = detector.analyze_change(
        baseline_image="test_base",
        current_image="test_curr",
        baseline_target_ha=10.2,
        current_target_ha=12.4
    )
    assert result["baseline_area_ha"] == 10.2
    assert result["current_area_ha"] == 12.4
    assert result["change_ha"] == 2.2
    assert round(result["change_percent"], 1) == 21.6
    assert result["trend"] == "EXPANSION"

def test_carbon_estimator():
    estimator = CarbonEstimator()
    # Mangrove estimate for 12.4 ha
    est = estimator.estimate_carbon(
        area_hectares=12.4,
        project_type=ProjectType.MANGROVE,
        methodology_name="CONFIGURABLE_MANGROVE_METHOD"
    )
    assert est["estimated_tco2e"] > 50.0
    assert est["lower_bound_tco2e"] < est["estimated_tco2e"]
    assert est["upper_bound_tco2e"] > est["estimated_tco2e"]
    assert est["confidence"] >= 0.80

def test_anomaly_detector_legitimate_claim():
    detector = ClaimAnomalyDetector()
    # Reported 120 vs Estimated 125.7 (very close, legitimate)
    res = detector.verify_claim(
        project_id="PROJECT-001",
        reported_tco2e=120.0,
        estimated_tco2e=125.7,
        project_area_hectares=12.4,
        vegetation_change_pct=21.57
    )
    assert res["risk_level"] == RiskLevel.LOW.value
    assert res["is_anomaly"] is False
    assert res["verification_score"] > 0.75

def test_anomaly_detector_suspicious_overclaim():
    detector = ClaimAnomalyDetector()
    # Reported 250 vs Estimated 80 (over 300% of estimate, suspicious fraud)
    res = detector.verify_claim(
        project_id="PROJECT-002",
        reported_tco2e=250.0,
        estimated_tco2e=80.0,
        project_area_hectares=8.5,
        vegetation_change_pct=6.25
    )
    assert res["risk_level"] == RiskLevel.HIGH.value
    assert res["is_anomaly"] is True
    assert len(res["reasons"]) > 0
    assert res["verification_score"] < 0.40
