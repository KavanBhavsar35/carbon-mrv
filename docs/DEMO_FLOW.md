# End-to-End Demo Flows

## Demo 1: Legitimate Mangrove Restoration Project
1. **Issuer Action**: Register "Sundarbans Coastal Mangrove Restoration (Plot A)".
2. **Evidence Upload**: Upload baseline image (10.2 ha) and current year image (12.4 ha). Off-chain SHA-256 hash computed.
3. **ML Analysis**:
   - Baseline: 10.20 ha
   - Current: 12.40 ha
   - Change: +2.20 ha (+21.57%)
   - Carbon Estimator: 125.7 tCO2e (Bounds: [108.2, 142.4])
4. **Claim Submission**: Issuer reports 120.0 tCO2e.
5. **ML Anomaly Detection**:
   - Risk: `LOW`
   - Verification Score: 91%
   - Anomaly Score: 0.08
   - Anomaly: `False`
6. **Auditor Action**: Auditor inspects side-by-side evidence, verifies SHA-256 match, approves claim on-chain.
7. **Credit Issuance**: Unique on-chain credit ID minted.
8. **Buyer Action**: Buyer purchases credit, verifies custody, and retires it with reason: "Corporate Net-Zero 2026 Offset".
9. **Verification**: Permanent retirement certificate generated; on-chain status updated to `RETIRED`.

---

## Demo 2: Suspicious Over-Reporting Claim
1. **Issuer Action**: Register "Delta Estuary Reforestation Project".
2. **ML Analysis**:
   - Baseline: 8.0 ha
   - Current: 8.5 ha
   - Change: +0.50 ha (+6.25%)
   - Carbon Estimator: 80.0 tCO2e
3. **Claim Submission**: Issuer over-reports 250.0 tCO2e (+212% above ML estimate).
4. **ML Anomaly Detection**:
   - Risk: `HIGH`
   - Verification Score: 22%
   - Anomaly Score: 0.91
   - Anomaly: `True`
   - Reasons: ["Reported carbon significantly exceeds ML estimate", "Claim density inconsistent with biophysical bounds"]
5. **Auditor Action**: Auditor reviews red flags, rejects claim on-chain.
6. **Result**: Zero credits issued; claim marked `REJECTED` in public registry.

---

## Demo 3: Double-Spending & Double-Retirement Protection
1. **Action 1**: Take a valid issued credit from Demo 1.
2. **Action 2**: Buyer transfers to secondary holder.
3. **Action 3**: First retirement executed (`retireCredit()`) -> Succeeds.
4. **Action 4**: Attacker attempts second retirement (`retireCredit()`) on the same credit ID -> Hardhat transaction reverts with `CreditAlreadyRetired`.
5. **Action 5**: Attacker attempts to transfer the retired credit (`transferCredit()`) -> Hardhat transaction reverts with `CannotTransferRetiredCredit`.
6. **Result**: Demonstrates on-chain cryptographic enforcement against double-counting and double-selling.
