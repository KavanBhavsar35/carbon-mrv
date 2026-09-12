# Circular Carbon Ecosystem — System Architecture

## 1. Executive Summary
The Circular Carbon Ecosystem is a verifiable MRV (Measurement, Reporting, and Verification) platform for nature-based carbon credits (focusing on coastal blue carbon / mangrove restoration). It bridges Earth Observation (remote sensing), biophysical carbon modeling, machine-learning anomaly detection, human auditor governance, and cryptographic blockchain enforcement to eliminate greenwashing, fraud, and double-counting.

## 2. Core Separation of Responsibilities

| Subsystem | Core Question / Role | Invariant Enforced |
|---|---|---|
| **Remote-Sensing ML** | "What biophysical vegetation and canopy changes are observed from imagery?" | Objective area ($\text{ha}$) and density without magic credit formulas. |
| **Carbon Accounting Engine** | "How does observed biomass translate into carbon dioxide equivalent ($\text{tCO}_2\text{e}$)?" | Configurable, transparent IPCC Tier-2 parameters with 95% confidence intervals. |
| **Claim Anomaly Detection** | "Does the project owner's reported claim deviate suspiciously from ML estimates?" | Isolation Forest + heuristic risk scoring (`LOW`, `MEDIUM`, `HIGH`). |
| **Human Auditor Workflow** | "Should this carbon claim be verified and approved for issuance?" | Human-in-the-loop sovereign gate; ML is decision support, not an automated certifier. |
| **Smart Contract Registry** | "Can credits be duplicated, minted without approval, double-spent, or re-retired?" | Cryptographic state machine preventing double-spending and unverified minting. |

## 3. High-Level Architecture Flow

```text
  Satellite / Drone Imagery
             │
             ▼
  [Off-Chain Evidence Vault] ─── Computes SHA-256 Hash ───► Anchored to Blockchain
             │
             ▼
  [ML Remote-Sensing Pipeline]
             │ (Vegetation Masks, Area ha, Temporal Change %)
             ▼
  [Carbon Estimation Engine]
             │ (Biomass, Carbon Fraction, Stoichiometry, Confidence Bounds)
             ▼
  [Claim Anomaly Detector] ◄─── Project Owner Claim (Reported tCO2e)
             │ (Verification Score, Anomaly Score, Risk Level)
             ▼
  [Auditor Dashboard] (Human Verification Review)
             │ (Approve / Reject)
             ▼
  [Smart Contract Registry] (Ethereum / Hardhat)
             │
     ┌───────┴───────────────┬────────────────────────┐
     ▼                       ▼                        ▼
Credit Issuance       Credit Transfer          Permanent Retirement
 (Unique ID)         (Tracked Ownership)       (One-Way, Burn State)
```

## 4. Component Boundaries
- **`blockchain/`**: Hardhat project with `CarbonCreditRegistry.sol`. Exposes pure on-chain state machine and role-based permissions.
- **`ml/`**: Preprocessing, segmentation inference, carbon estimation models, and Isolation Forest claim anomaly detection.
- **`services/ml_service/`**: Microservice exposing clean REST endpoints (`/ml/analyze-project`, `/ml/estimate-carbon`, `/ml/verify-claim`).
- **`backend/`**: FastAPI backend with SQLite storage, evidence hashing, JWT auth, and blockchain transaction coordination.
- **`frontend/`**: Vite + React single-page application with role-based navigation (Issuer, Auditor, Buyer, Regulator).
