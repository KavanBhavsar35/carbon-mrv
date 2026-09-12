import pytest
from fastapi.testclient import TestClient
from services.ml_service.main import app
from shared.schemas.models import ProjectType

client = TestClient(app)

def test_health():
    response = client.get("/ml/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"] is True

def test_analyze_project_endpoint():
    payload = {
        "project_id": "PROJECT-001",
        "baseline_image": "base64dummydata1",
        "current_image": "base64dummydata2",
        "project_type": "MANGROVE",
        "baseline_target_ha": 10.2,
        "current_target_ha": 12.4
    }
    response = client.post("/ml/analyze-project", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "PROJECT-001"
    assert data["baseline_area_ha"] == 10.2
    assert data["current_area_ha"] == 12.4
    assert data["change_ha"] == 2.2
    assert round(data["change_percent"], 1) == 21.6

def test_estimate_carbon_endpoint():
    payload = {
        "project_id": "PROJECT-001",
        "area_hectares": 12.4,
        "project_type": "MANGROVE",
        "methodology": "CONFIGURABLE_MANGROVE_METHOD"
    }
    response = client.post("/ml/estimate-carbon", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "PROJECT-001"
    assert data["estimated_tco2e"] > 50.0
    assert data["lower_bound_tco2e"] < data["estimated_tco2e"]
    assert data["upper_bound_tco2e"] > data["estimated_tco2e"]

def test_verify_claim_endpoint_legitimate():
    payload = {
        "project_id": "PROJECT-001",
        "reported_tco2e": 120.0,
        "estimated_tco2e": 125.7,
        "project_area_hectares": 12.4,
        "vegetation_change_pct": 21.57
    }
    response = client.post("/ml/verify-claim", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "LOW"
    assert data["is_anomaly"] is False
    assert data["verification_score"] >= 0.85

def test_verify_claim_endpoint_suspicious():
    payload = {
        "project_id": "PROJECT-002",
        "reported_tco2e": 250.0,
        "estimated_tco2e": 80.0,
        "project_area_hectares": 8.5,
        "vegetation_change_pct": 6.25
    }
    response = client.post("/ml/verify-claim", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "HIGH"
    assert data["is_anomaly"] is True
    assert len(data["reasons"]) > 0
