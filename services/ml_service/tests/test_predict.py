import pytest
from httpx import AsyncClient, ASGITransport
from services.ml_service.main import app

@pytest.mark.asyncio
async def test_predict_drone_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/predict/drone", json={
            "images": [""],
            "ecosystemType": "MANGROVE"
        })
        assert response.status_code == 200
        data = response.json()
        assert "estimatedCredits" in data
        assert data["estimatedCredits"] > 0
        assert "vegetationCoverPct" in data
        assert "estimatedBiomass" in data
        assert "confidence" in data
        assert data["modelVersion"] == "v2.0-unet-drone-uav"
        assert "bufferPoolCredits" in data
        assert "additionalityRating" in data

@pytest.mark.asyncio
async def test_predict_satellite_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/predict/satellite", json={
            "images": ["", ""],
            "parcelId": "parcel-test-1",
            "priorEstimate": 100.0
        })
        assert response.status_code == 200
        data = response.json()
        assert "estimatedCredits" in data
        assert "vegetationCoverPct" in data
        assert "estimatedBiomass" in data
        assert "confidence" in data
        assert data["modelVersion"] == "v2.0-unet-bitemporal-satellite"
        assert "riskLevel" in data
