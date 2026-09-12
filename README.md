# Circular Carbon Ecosystem
### Verifiable Carbon Credit & Offset Tracking System (MRV 2.0)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue.svg)](https://soliditylang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow.svg)](https://hardhat.org/)

---

## 1. Overview & Core Philosophy

The **Circular Carbon Ecosystem** is an end-to-end, scientifically honest, verifiable Measurement, Reporting, and Verification (MRV) platform for nature-based carbon credits (focusing on coastal mangrove restoration and extensible to forestry, wetlands, and regenerative agriculture).

### The Scientific & Governance Invariant:
> **Remote-sensing ML produces biophysical observations (area, density, and temporal changes) and decision-support risk ratings. Biophysical formulas compute carbon estimates with uncertainty bounds. Human auditors retain sovereign approval authority. The blockchain enforces lifecycle immutability, prevents double-spending, and guarantees one-way retirement.**

```text
Satellite / Drone / Project Evidence
              ↓
       ML Remote Sensing
              ↓
Vegetation / Mangrove Analysis
              ↓
Area + Temporal Change Detection
              ↓
     Carbon Estimation (IPCC Tier-2)
              ↓
     Carbon Claim Submitted
              ↓
      ML Claim Verification
      / Anomaly Detection (Isolation Forest)
              ↓
       Human Auditor Review
              ↓
     Blockchain Approval
              ↓
      Credit Issuance (Unique ID)
              ↓
    Credit Transfer / Sale
              ↓
        Credit Retirement (Permanent Burn)
              ↓
   Permanent Cryptographic Audit Trail
```

---

## 2. Solved Problems

1. **Difficult Verification**: Project evidence and satellite imagery are hashed off-chain with SHA-256; only the deterministic hash is anchored on Ethereum/Hardhat to ensure proof of integrity without bloated on-chain storage.
2. **Fraud & Over-Reporting**: Unsupervised **Isolation Forest** paired with biophysical domain heuristics cross-examines the reported $\text{tCO}_2\text{e}$ against observed canopy changes and flags inflated claims with human-readable risk explanations.
3. **Double-Counting & Double-Selling**: Smart contract invariants guarantee single-claim issuance, non-fungible ownership tracking, and strictly one-way retirement. A retired credit cannot be transferred or retired a second time.

---

## 3. System Architecture

```text
                    FRONTEND (Vite / React SPA)
              Role Dashboards: Issuer | Auditor | Buyer | Explorer
                                │
                                ▼
                        FASTAPI BACKEND
                   SQLite + Evidence Hasher
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
   ML SERVICE                                   BLOCKCHAIN SERVICE
   FastAPI (Port 8001)                          Hardhat / Solidity (Port 8545)
   - Remote Sensing (NDVI/VARI)                 - CarbonCreditRegistry.sol
   - IPCC Tier-2 Carbon Estimator               - Invariant Enforcement
   - Isolation Forest Anomaly Detection         - On-Chain Event Logger
```

---

## 4. Quick Start Guide

### Prerequisites
- Python 3.11+ (or `uv`)
- Node.js v20+ & npm

### Step 1: Install Dependencies
```bash
# Python dependencies
uv pip install -r requirements.txt

# Blockchain dependencies
cd blockchain
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Run Tests

```bash
# 1. Test Smart Contracts (11 Hardhat Invariant Tests)
cd blockchain
npx hardhat test
cd ..

# 2. Test ML Pipeline
.venv\Scripts\python -m pytest ml/tests/ -v

# 3. Test ML FastAPI Microservice
.venv\Scripts\python -m pytest services/ml_service/tests/ -v

# 4. Test Backend Integration
.venv\Scripts\python -m pytest backend/tests/ -v
```

### Step 3: Run Automated End-to-End Demo Suite
```bash
.venv\Scripts\python scripts/demo_runner.py
```
This executes all 3 critical demo flows:
1. **Demo 1 — Legitimate Mangrove Project A**: Area $+21.57\%$, Carbon estimate $125.7\,\text{tCO}_2\text{e}$, Claim $120.0\,\text{tCO}_2\text{e}$, ML Risk LOW ($93\%$), Auditor approves, credit issued, transferred, and permanently retired.
2. **Demo 2 — Suspicious Claim B**: Area $+6.25\%$, Carbon estimate $80.0\,\text{tCO}_2\text{e}$, Claim $250.0\,\text{tCO}_2\text{e}$ ($+212\%$), Isolation Forest flags HIGH RISK anomaly with reasons, Auditor rejects, zero credits minted.
3. **Demo 3 — Double-Spending Prevention**: Demonstrates cryptographic contract revert when attempting to re-retire or transfer an already-retired credit.

### Step 4: Run Applications Locally

```bash
# Terminal 1: Hardhat Node
cd blockchain
npx hardhat node

# Terminal 2: ML Microservice
.venv\Scripts\python services/ml_service/main.py

# Terminal 3: Backend Server
.venv\Scripts\python backend/app/main.py

# Terminal 4: Frontend Web App
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 5. What is Real vs Prototype

| Component | Status | Details |
|---|---|---|
| **Solidity Smart Contract** | **Real / Production-Grade** | Compiles with `solc 0.8.24`, full OpenZeppelin AccessControl & ReentrancyGuard, 11 passing invariant tests. |
| **Double-Spending Prevention** | **Real / Hard Revert** | Smart contract reverts `CreditAlreadyRetired` and `CannotTransferRetiredCredit`. |
| **Evidence SHA-256 Hashing** | **Real** | Off-chain deterministic cryptographic SHA-256 hashing. |
| **Claim Anomaly Detection** | **Real / Fitted ML** | Scikit-learn Isolation Forest model trained on multivariate carbon claim distributions. |
| **Carbon Accounting Engine** | **Real / Calibrated** | IPCC Tier-2 allometric biophysical formula with 95% confidence bounds. |
| **Remote Sensing Vision** | **Baseline Spectral CV** | Spectral vegetation canopy extraction (VARI/NDVI) with ground sampling distance hectare scaling, ready for deep-learning checkpoint attachment. |
| **Blockchain Network** | **Local Testnet** | Hardhat node (Chain ID 31337), seamless deployment to Sepolia/Polygon testnet with `.env` update. |

---

## 6. Project Directory Map

```text
carbon-mrv/
│
├── blockchain/
│   ├── contracts/CarbonCreditRegistry.sol
│   ├── scripts/deploy.js
│   ├── test/CarbonCreditRegistry.test.js
│   ├── hardhat.config.js
│   └── package.json
│
├── ml/
│   ├── preprocessing/ (image_loader.py, spectral_indices.py)
│   ├── models/ (segmentation.py)
│   ├── inference/ (change_detection.py)
│   ├── carbon_estimator/ (methodology.py, parameters.py, uncertainty.py, estimator.py)
│   ├── anomaly_detection/ (detector.py)
│   ├── data/ (demo_generator.py)
│   └── tests/ (test_ml_pipeline.py)
│
├── services/
│   └── ml_service/
│       ├── main.py
│       ├── routes/ (analysis.py, carbon.py, verification.py)
│       ├── schemas/ (api_models.py)
│       ├── services/ (ml_engine.py)
│       └── tests/ (test_api.py)
│
├── backend/
│   ├── app/
│   │   ├── config.py, database.py, main.py
│   │   ├── models/ (models.py)
│   │   ├── schemas/ (schemas.py)
│   │   ├── services/ (auth_service.py, ml_client.py, blockchain_client.py)
│   │   └── routers/ (auth.py, projects.py, claims.py, auditor.py, credits.py, dashboards.py, verify.py)
│   └── tests/ (test_backend.py)
│
├── frontend/
│   ├── src/
│   │   ├── components/ (Navbar, DemoController, IssuerDashboard, AuditorDashboard, BuyerDashboard, RegulatorDashboard, VerificationModal)
│   │   ├── App.jsx, main.jsx, index.css
│   ├── index.html, vite.config.js, package.json
│
├── shared/
│   ├── schemas/ (models.py)
│   ├── contract-abi.json
│   └── contract-address.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ML_PIPELINE.md
│   ├── BLOCKCHAIN.md
│   ├── BACKEND_API_SPEC.md
│   └── DEMO_FLOW.md
│
├── scripts/
│   └── demo_runner.py
│
├── requirements.txt
├── .env.example
└── README.md
```

---

## 7. License
MIT License. Built for the Circular Carbon Ecosystem Hackathon.
