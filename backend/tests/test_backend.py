import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_auth_login():
    res = client.post("/api/auth/login", json={
        "email": "issuer@circularcarbon.org",
        "password": "issuer123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" == "access_token"
    assert data["user"]["role"] == "ISSUER"

def test_full_backend_mrv_cycle():
    # 1. Login as Issuer
    login_res = client.post("/api/auth/login", json={
        "email": "issuer@circularcarbon.org",
        "password": "issuer123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register Project
    proj_res = client.post("/api/projects", json={
        "project_name": "Sundarbans Coastal Mangrove Pilot",
        "description": "Mangrove restoration in coastal West Bengal",
        "project_type": "MANGROVE",
        "total_area_ha": 12.4
    }, headers=headers)
    assert proj_res.status_code == 200
    project_id = proj_res.json()["id"]

    # 3. Trigger Remote Sensing ML Analysis
    analysis_res = client.post(
        f"/api/projects/{project_id}/analyze?baseline_target_ha=10.2&current_target_ha=12.4",
        headers=headers
    )
    assert analysis_res.status_code == 200
    analysis_data = analysis_res.json()
    assert analysis_data["baseline_area_ha"] == 10.2
    assert analysis_data["current_area_ha"] == 12.4
    assert analysis_data["estimated_tco2e"] > 50.0

    # 4. Submit Claim (120 tCO2e)
    claim_res = client.post("/api/claims", json={
        "project_id": project_id,
        "reported_tco2e": 120.0
    }, headers=headers)
    assert claim_res.status_code == 200
    claim_data = claim_res.json()
    claim_id = claim_data["id"]
    assert claim_data["risk_level"] == "LOW"
    assert claim_data["verification_score"] > 0.80

    # 5. Login as Auditor & Approve
    auditor_login = client.post("/api/auth/login", json={
        "email": "auditor@verra-audit.org",
        "password": "auditor123"
    })
    auditor_token = auditor_login.json()["access_token"]
    auditor_headers = {"Authorization": f"Bearer {auditor_token}"}

    approve_res = client.post(
        f"/api/claims/{claim_id}/approve",
        json={"comments": "Evidence verified, ML confidence confirmed."},
        headers=auditor_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "ISSUED"

    # 6. Fetch Issued Credit
    credits_res = client.get("/api/credits")
    assert credits_res.status_code == 200
    credits_list = credits_res.json()
    assert len(credits_list) > 0
    credit = credits_list[0]
    credit_id = credit["id"]
    onchain_id = credit["onchain_credit_id"]

    # 7. Transfer Credit to Buyer
    buyer_wallet = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    transfer_res = client.post(f"/api/credits/{credit_id}/transfer", json={
        "to_address": buyer_wallet
    }, headers=headers)
    assert transfer_res.status_code == 200
    assert transfer_res.json()["current_owner"] == buyer_wallet

    # 8. Retire Credit
    buyer_login = client.post("/api/auth/login", json={
        "email": "buyer@microsoft-esg.com",
        "password": "buyer123"
    })
    buyer_token = buyer_login.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    retire_res = client.post(f"/api/credits/{credit_id}/retire", json={
        "reason": "Corporate 2026 Scope 3 Carbon Neutrality"
    }, headers=buyer_headers)
    assert retire_res.status_code == 200
    assert retire_res.json()["status"] == "RETIRED"

    # 9. Invariant: Double retirement MUST FAIL
    double_retire = client.post(f"/api/credits/{credit_id}/retire", json={
        "reason": "Second invalid retirement"
    }, headers=buyer_headers)
    assert double_retire.status_code == 400

    # 10. Invariant: Transfer of retired credit MUST FAIL
    invalid_transfer = client.post(f"/api/credits/{credit_id}/transfer", json={
        "to_address": "0x1234567890123456789012345678901234567890"
    }, headers=buyer_headers)
    assert invalid_transfer.status_code == 400

    # 11. Public Verification Endpoint
    verify_res = client.get(f"/api/verify/{onchain_id}")
    assert verify_res.status_code == 200
    verif = verify_res.json()
    assert verif["verified"] is True
    assert verif["summary"]["retired"] is True
    assert verif["evidence_integrity"]["anchored_on_chain"] is True
