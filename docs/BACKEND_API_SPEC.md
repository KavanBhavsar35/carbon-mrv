# Backend REST API Specification

All endpoints return JSON responses and are served by the FastAPI Backend (`http://127.0.0.1:8000`).

## 1. Projects
- `POST /api/projects`: Register a new nature-based carbon project.
- `GET /api/projects`: List all registered projects.
- `GET /api/projects/{id}`: Retrieve project detail including evidence, ML runs, and credits.
- `POST /api/projects/{id}/evidence`: Upload imagery/documents, calculate and store SHA-256 hash off-chain.
- `GET /api/projects/{id}/evidence`: List all evidence items and cryptographic hashes.
- `POST /api/projects/{id}/analyze`: Trigger remote-sensing ML analysis for project evidence.

## 2. Claims & Anomaly Detection
- `POST /api/claims`: Submit a carbon sequestration claim for an analyzed project.
- `GET /api/claims`: List all claims.
- `GET /api/claims/{id}`: Detailed claim breakdown with ML verification score, anomaly score, and risk level.
- `POST /api/claims/{id}/analyze`: Run/re-run ML anomaly detection on the claim.
- `GET /api/auditor/claims`: Auditor queue filtered by pending reviews and risk ranking.
- `POST /api/claims/{id}/approve`: Auditor approves claim and broadcasts on-chain transaction.
- `POST /api/claims/{id}/reject`: Auditor rejects claim with reasons.

## 3. Carbon Credits & Lifecycle
- `GET /api/credits`: List all carbon credits (active and retired).
- `GET /api/credits/{id}`: Credit details, provenance chain, and ownership history.
- `POST /api/credits/{id}/transfer`: Transfer active credit to another wallet address.
- `POST /api/credits/{id}/retire`: Permanently retire credit with reason; issues offset certificate.
- `GET /api/credits/{id}/history`: Full audit trail of transfers, approvals, and retirements.

## 4. Dashboards & Public Verification
- `GET /api/dashboard/issuer`: Metrics for project owners (projects, pending claims, credits).
- `GET /api/dashboard/auditor`: Metrics for verifiers (pending reviews, high-risk flags).
- `GET /api/dashboard/buyer`: Marketplace statistics and corporate offset holdings.
- `GET /api/dashboard/regulator`: Global ecosystem registry metrics and blockchain audit logs.
- `GET /api/verify/{id_or_hash}`: Public zero-auth endpoint verifying credit or claim provenance.
