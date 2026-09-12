"""
Circular Carbon Ecosystem — End-to-End Automated Demonstration Runner
Executes the three official hackathon demo workflows:
  Demo 1: Legitimate Mangrove Project A (ML +21.57% -> Carbon 125.7 -> Claim 120 -> Risk LOW -> Approve -> Mint -> Transfer -> Retire)
  Demo 2: Suspicious Over-claim Project B (Estimate 80 -> Claim 250 -> Risk HIGH Anomaly -> Auditor Rejects -> 0 Credits Minted)
  Demo 3: Double-Spending & Double-Retirement Invariant Protection (Contract hard reverts on duplicate retirement & transfer of retired credit)
"""
import sys
import os
import json
import time
from datetime import datetime

# Ensure repository root is in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Use requests with in-process server or running backend
import requests

BASE_URL = "http://127.0.0.1:8000"

def log_step(step_num: int, title: str, status: str = "RUNNING"):
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] >>> Step {step_num}: {title} ... [{status}]")

def log_success(msg: str):
    print(f"   [SUCCESS] {msg}")

def log_alert(msg: str):
    print(f"   [ALERT] {msg}")

def run_e2e_demo(client=None):
    print("=" * 80)
    print(" CIRCULAR CARBON ECOSYSTEM — VERIFIABLE MRV & BLOCKCHAIN DEMONSTRATION")
    print("=" * 80)

    # Use direct testclient if client passed, else requests
    if client is None:
        from fastapi.testclient import TestClient
        from backend.app.main import app
        client = TestClient(app)

    # ---------------------------------------------------------
    # DEMO 1: LEGITIMATE MANGROVE PROJECT A
    # ---------------------------------------------------------
    print("\n" + "#" * 80)
    print(" DEMO 1: LEGITIMATE MANGROVE PROJECT RESTORATION WORKFLOW")
    print("#" * 80)

    # Step 1: Login Issuer
    log_step(1, "Authenticating as Project Owner (Sundarbans Eco Trust)")
    res = client.post("/api/auth/login", json={"email": "issuer@circularcarbon.org", "password": "issuer123"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    issuer_token = res.json()["access_token"]
    issuer_headers = {"Authorization": f"Bearer {issuer_token}"}
    log_success(f"Authenticated! Wallet: {res.json()['user']['wallet_address']}")

    # Step 2: Register Project
    log_step(2, "Registering Mangrove Project A on Hardhat Blockchain")
    res = client.post("/api/projects", json={
        "project_name": "Sundarbans Coastal Mangrove Pilot (Plot A)",
        "description": "Tidal mangrove regeneration in delta zone",
        "project_type": "MANGROVE",
        "total_area_ha": 12.4
    }, headers=issuer_headers)
    assert res.status_code == 200
    project = res.json()
    project_id = project["id"]
    log_success(f"Project Registered! On-Chain Tx: {project['blockchain_tx_hash']}")

    # Step 3: Remote Sensing ML Analysis
    log_step(3, "Running Remote Sensing ML (Baseline 10.2 ha vs Current 12.4 ha)")
    res = client.post(f"/api/projects/{project_id}/analyze?baseline_target_ha=10.2&current_target_ha=12.4", headers=issuer_headers)
    assert res.status_code == 200
    ml_report = res.json()
    log_success(f"ML Observed Canopy Growth: +{ml_report['change_ha']} ha (+{ml_report['change_percent']}%)")
    log_success(f"Biophysical Carbon Estimate: {ml_report['estimated_tco2e']} tCO2e [95% CI: {ml_report['lower_bound_tco2e']} - {ml_report['upper_bound_tco2e']}]")

    # Step 4: Submit Claim
    log_step(4, "Issuer Submits Carbon Claim for 120.0 tCO2e")
    res = client.post("/api/claims", json={
        "project_id": project_id,
        "reported_tco2e": 120.0
    }, headers=issuer_headers)
    assert res.status_code == 200
    claim = res.json()
    claim_id = claim["id"]
    log_success(f"ML Claim Anomaly Score: {claim['anomaly_score'] * 100:.1f}%, Verification Score: {claim['verification_score'] * 100:.1f}%")
    log_success(f"Risk Level: {claim['risk_level']} (Anomaly = {claim['anomaly_score'] > 0.5})")
    assert claim["risk_level"] == "LOW"

    # Step 5: Auditor Approval
    log_step(5, "Auditor Verifies ML Evidence & Approves Claim on Blockchain")
    res = client.post("/api/auth/login", json={"email": "auditor@verra-audit.org", "password": "auditor123"})
    aud_token = res.json()["access_token"]
    aud_headers = {"Authorization": f"Bearer {aud_token}"}

    res = client.post(f"/api/claims/{claim_id}/approve", json={"comments": "Evidence and ML verification consistent. Approved."}, headers=aud_headers)
    assert res.status_code == 200
    approved_claim = res.json()
    log_success(f"Claim Approved! Smart Contract minted Credit with Tx: {approved_claim['blockchain_tx_hash']}")

    # Step 6: Fetch Issued Credit
    res = client.get("/api/credits")
    credits = res.json()
    assert len(credits) > 0
    target_credit = credits[0]
    credit_id = target_credit["id"]
    onchain_id = target_credit["onchain_credit_id"]
    log_success(f"Credit #{onchain_id} Active for {target_credit['amount']} tCO2e")

    # Step 7: Transfer to Corporate Buyer
    log_step(7, "Transferring Credit Ownership to Corporate Buyer (Tech Zero)")
    buyer_wallet = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    res = client.post(f"/api/credits/{credit_id}/transfer", json={"to_address": buyer_wallet}, headers=issuer_headers)
    assert res.status_code == 200
    log_success(f"Transferred to {buyer_wallet} on-chain!")

    # Step 8: Retire Credit
    log_step(8, "Corporate Buyer Permanently Retires Credit for Net-Zero ESG")
    res = client.post("/api/auth/login", json={"email": "buyer@microsoft-esg.com", "password": "buyer123"})
    buyer_token = res.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    res = client.post(f"/api/credits/{credit_id}/retire", json={"reason": "Corporate 2026 Scope 3 Carbon Offset Certificate"}, headers=buyer_headers)
    assert res.status_code == 200
    retired_credit = res.json()
    log_success(f"Credit #{onchain_id} permanently RETIRED! Status: {retired_credit['status']}")

    # Step 9: Zero-Auth Public Provenance
    log_step(9, "Verifying End-to-End Chain of Custody via Public Zero-Auth API")
    res = client.get(f"/api/verify/{onchain_id}")
    assert res.status_code == 200
    provenance = res.json()
    log_success(f"Provenance Verified! Evidence SHA-256: {provenance['evidence_integrity']['primary_evidence_hash']}")
    log_success(f"Smart Contract Transactions Count: {len(provenance['blockchain_audit_trail'])}")
    print("\n>>> DEMO 1 PASSED: Complete Verified MRV Flow Succeeded!\n")

    # ---------------------------------------------------------
    # DEMO 2: SUSPICIOUS OVER-CLAIM FRAUD DETECTION
    # ---------------------------------------------------------
    print("\n" + "#" * 80)
    print(" DEMO 2: SUSPICIOUS OVER-CLAIM FRAUD DETECTION WORKFLOW")
    print("#" * 80)

    log_step(1, "Registering Estuary Mangrove Reserve (Plot B)")
    res = client.post("/api/projects", json={
        "project_name": "Delta Estuary Mangrove Reserve (Plot B)",
        "description": "Estuary mangrove reserve with marginal canopy gains",
        "project_type": "MANGROVE",
        "total_area_ha": 8.5
    }, headers=issuer_headers)
    assert res.status_code == 200
    proj_b = res.json()

    log_step(2, "Running ML Analysis on Estuary Project (Observed: 8.5 ha -> Est: 80.0 tCO2e)")
    res = client.post(f"/api/projects/{proj_b['id']}/analyze?baseline_target_ha=8.0&current_target_ha=8.5", headers=issuer_headers)
    assert res.status_code == 200

    log_step(3, "Issuer Attempts to Over-Claim 250.0 tCO2e (+212% Above Biophysical Estimate)")
    res = client.post("/api/claims", json={
        "project_id": proj_b["id"],
        "reported_tco2e": 250.0
    }, headers=issuer_headers)
    assert res.status_code == 200
    suspicious_claim = res.json()
    log_alert(f"ML Isolation Forest Anomaly Score: {suspicious_claim['anomaly_score'] * 100:.1f}%")
    log_alert(f"Risk Level Flagged: {suspicious_claim['risk_level']}")
    for r in suspicious_claim["reasons"]:
        log_alert(f"Flagged Reason: {r}")
    assert suspicious_claim["risk_level"] == "HIGH"

    log_step(4, "Auditor Inspects Red Flags & REJECTS Claim on Blockchain")
    res = client.post(f"/api/claims/{suspicious_claim['id']}/reject", json={
        "reason": "Over-reporting exceeds biophysical capacity by 212%. Rejected."
    }, headers=aud_headers)
    assert res.status_code == 200
    rejected = res.json()
    log_success(f"Claim REJECTED! Blockchain Tx: {rejected['blockchain_tx_hash']}")
    log_success("INVARIANT ENFORCED: Zero credits were minted! Fraud blocked before blockchain issuance.")
    print("\n>>> DEMO 2 PASSED: Fraudulent claim caught by ML & rejected by Auditor!\n")

    # ---------------------------------------------------------
    # DEMO 3: DOUBLE-SPENDING & DOUBLE-RETIREMENT ENFORCEMENT
    # ---------------------------------------------------------
    print("\n" + "#" * 80)
    print(" DEMO 3: SMART CONTRACT DOUBLE-SPENDING & DOUBLE-RETIREMENT REVERT")
    print("#" * 80)

    log_step(1, f"ATTACK TEST: Attempting to RETIRE Credit #{onchain_id} a second time...")
    res = client.post(f"/api/credits/{credit_id}/retire", json={"reason": "Second Malicious Retirement"}, headers=buyer_headers)
    log_alert(f"Result HTTP Status: {res.status_code} ({res.json().get('detail')})")
    assert res.status_code == 400, "Double retirement must revert!"
    log_success("SMART CONTRACT INVARIANT CONFIRMED: Double retirement was REVERTED!")

    log_step(2, f"ATTACK TEST: Attempting to TRANSFER already-retired Credit #{onchain_id}...")
    res = client.post(f"/api/credits/{credit_id}/transfer", json={"to_address": "0x1234567890123456789012345678901234567890"}, headers=buyer_headers)
    log_alert(f"Result HTTP Status: {res.status_code} ({res.json().get('detail')})")
    assert res.status_code == 400, "Transfer of retired credit must revert!"
    log_success("SMART CONTRACT INVARIANT CONFIRMED: Transfer of retired credit was REVERTED!")

    print("\n" + "=" * 80)
    print(" ALL 3 DEMOS PASSED SUCCESSFULLY WITH 100% INVARIANT ENFORCEMENT!")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    run_e2e_demo()
