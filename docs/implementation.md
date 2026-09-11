# Carbon MRV — Implementation Plan (docs/implementation.md)
Circular Carbon Ecosystem — Verifiable Carbon Credit & Offset Tracking System

**Repo:** `carbon-mrv` (new repo — supersedes the earlier `blue-carbon-mrv` scaffold, same problem statement, old repo https://github.com/KavanBhavsar35/blue-carbon-mrv, use this for old refrence)
**Team:** Kavan — Frontend (Next.js + shadcn/ui) + Backend (FastAPI + JWT) · **Vatsal** — Blockchain (Solidity/Hardhat) + ML

**Stack decision:** backend moves from the old Flask scaffold to **FastAPI** (SQLAlchemy 2.0 + Alembic + Pydantic v2, `python-jose`/`passlib` for JWT + bcrypt). Old Flask models are the field reference, not the code to keep. Also use **uv** for dependency management. (initiated alread in project root)

```
backend/     FastAPI + SQLAlchemy + SQLite + JWT auth        → Kavan
frontend/    Next.js + shadcn/ui                                → Kavan
blockchain/  Hardhat + Solidity registry contract               → Vatsal
ml/          vegetation/anomaly verification model + API        → Vatsal
docs/        this file + API contract + ABI + ML I/O schema
```

---

## 0. Interface contract (agree before Phase 1 — blocks both tracks)

So both people can build in parallel without waiting on each other, freeze these three interfaces on Day 0:

1. **REST API shape** (§2 below) — Kavan owns, Vatsal builds ML against it as a spec, not against real backend
2. **Contract ABI shape** (§3 below) — Vatsal owns, Kavan builds frontend chain calls + backend sync against the ABI once deployed to testnet
3. **ML output JSON schema** (§4 below) — Vatsal owns, backend just needs to store/display it, doesn't need the model itself

Once these are written down, Kavan can build the full backend/frontend against mocked responses while Vatsal builds the contract and model independently.

---

## 1. Data model (FastAPI / SQLite) — owner: Kavan

| Table | Field | Type | Notes |
|---|---|---|---|
| **users** | id | UUID pk | |
| | email | str, unique, indexed | |
| | hashed_password | str | bcrypt via passlib |
| | name | str | |
| | phone | str, nullable | |
| | role | enum: `ADMIN, PROJECT_OWNER, VERIFIER, USER` | |
| | wallet_address | str, nullable, unique | 0x… format, validated |
| | organization | str, nullable | |
| | country | str, nullable | |
| | is_active | bool, default true | |
| | created_at / updated_at | datetime | |
| **projects** | id | UUID pk | |
| | owner_id | FK → users | |
| | organization_name | str | |
| | organization_type | enum: `NGO, PANCHAYAT, COMMUNITY, COMPANY` | |
| | contact_person / email / phone | str | |
| | project_name / description | str / text | |
| | project_type | enum: `MANGROVE, SEAGRASS, SALT_MARSH, CORAL_REEF, KELP_FOREST` | drives credit-calc methodology |
| | state / district / village | str | |
| | coordinates | JSON | geolocation |
| | total_area | float | hectares |
| | estimated_credits_per_year | float | |
| | registration_number | str, nullable | |
| | has_legal_permits / has_survey_report / has_environmental_clearance | bool | gates approval |
| | contract_address / token_id | str, nullable | set once minted |
| | status | enum: `PENDING, APPROVED, ACTIVE, REJECTED, COMPLETED` | |
| | total_credits_generated | float, default 0 | |
| | created_at / updated_at | datetime | |
| **project_users** | id, project_id FK, user_id FK, role (`OWNER,MANAGER,CONTRIBUTOR,VIEWER`), joined_at | | unique(project_id, user_id) |
| **iot_devices** | id, project_id FK, device_id (unique), name, type (`SENSOR,CAMERA,WEATHER_STATION`), status (`ACTIVE,INACTIVE,MAINTENANCE,ERROR`), last_ping, metadata JSON | | |
| **measurements** | id, device_id FK, project_id FK, measurement_type (`TEMPERATURE,PH,SALINITY,TURBIDITY,DISSOLVED_OXYGEN,WATER_LEVEL,BIOMASS`), value float, unit str, timestamp, metadata JSON | | time-series, indexed on (project_id, timestamp) |
| **ml_reports** | id, project_id FK, source_images JSON (urls), vegetation_cover_pct float, estimated_biomass float, anomaly_flags JSON, model_version str, confidence float, created_at | | written by ml/, read by backend + verifier UI |
| **verification_reviews** | id, project_id FK, verifier_id FK, status (`PENDING,APPROVED,REJECTED`), comments text, ml_report_id FK nullable, reviewed_at | | this is the gate before on-chain issuance is allowed |
| **carbon_credits** | id, project_id FK, onchain_credit_id (uint256, unique), amount float, vintage int, status (`ISSUED,SOLD,RETIRED`), blockchain_tx_hash unique, owner_wallet_address, minted_at, retired_at, retired_reason, certification_body/id nullable | | off-chain index of on-chain state, synced from events |
| **transactions** | id, type (`MINT,TRANSFER,PURCHASE,RETIRE`), from_user_id, to_user_id, project_id, credit_id, amount, price_per_credit, total_price, currency default `ETH`, tx_hash unique, block_number, status (`PENDING,PROCESSING,COMPLETED,FAILED`), metadata JSON, created_at | | |

Enums as Python `Enum` classes shared between SQLAlchemy models and Pydantic schemas — single source of truth in `app/models/enums.py`.

---

## 2. Backend API (FastAPI) — owner: Kavan

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | — | create user, return JWT pair |
| POST | `/auth/login` | — | JWT access + refresh |
| POST | `/auth/refresh` | refresh token | rotate access token |
| GET | `/auth/me` | JWT | current user + role |
| GET/PUT | `/users/{id}` | JWT (self/admin) | profile |
| POST | `/projects` | JWT (any) | create project → `PENDING` |
| GET | `/projects` | — (public list) / JWT for filtered | list/search projects |
| GET | `/projects/{id}` | — public | project detail |
| PUT | `/projects/{id}` | JWT (owner) | edit before approval |
| PUT | `/projects/{id}/status` | JWT (VERIFIER) | approve/reject — writes `verification_reviews` |
| GET | `/projects/{id}/measurements` | — | |
| GET | `/projects/{id}/devices` | — | |
| GET | `/projects/{id}/credits` | — | |
| POST | `/iot-devices` | JWT (owner) | register device |
| POST | `/iot-devices/{id}/ping` | device key | heartbeat |
| POST | `/measurements` | device key or JWT | ingest reading |
| GET | `/measurements/analytics` | — | aggregates for dashboard |
| POST | `/ml/verify-project/{id}` | JWT (owner/verifier) | triggers ml/ service, stores `ml_reports` row |
| GET | `/ml/reports/{project_id}` | — | |
| GET | `/carbon-credits` | — | |
| GET | `/carbon-credits/project/{id}` | — | |
| POST | `/carbon-credits/sync` | internal/service key | called after a confirmed on-chain event to upsert the off-chain index — see §3 |
| GET | `/verify/{credit_id_or_tx_hash}` | — public, no auth | the judge-facing "verify a credit" endpoint: full chain of custody |

JWT: access token 15–30 min, refresh 7 days, role claim embedded so route guards don't need a DB hit per request.

---

## 3. Blockchain — owner: Vatsal

Replace the old balance-mapping contract with a registry. This is the part that actually satisfies "prevents double-selling."

**Contract: `CarbonCreditRegistry.sol`**

```solidity
enum Role { None, Issuer, Verifier, Admin }
enum Status { Issued, Sold, Retired }

struct Credit {
    uint256 id;
    bytes32 projectId;      // keccak256 of the off-chain project UUID
    uint16  vintage;
    uint256 amount;
    address issuer;
    address currentOwner;
    Status  status;
    string  retiredReason;
    uint256 issuedAt;
    uint256 retiredAt;
}

mapping(uint256 => Credit) public credits;
mapping(address => Role) public roles;
uint256 public nextCreditId;

event RoleGranted(address indexed account, Role role);
event CreditIssued(uint256 indexed id, bytes32 indexed projectId, address indexed issuer, uint256 amount, uint16 vintage);
event CreditTransferred(uint256 indexed id, address indexed from, address indexed to);
event CreditRetired(uint256 indexed id, address indexed by, string reason);

function grantRole(address account, Role role) external onlyAdmin;
function issueCredit(bytes32 projectId, uint256 amount, uint16 vintage) external onlyIssuer returns (uint256 id);
function transferCredit(uint256 id, address to) external; // require status != Retired
function retireCredit(uint256 id, string calldata reason) external; // require status != Retired, one-way
function getCredit(uint256 id) external view returns (Credit memory);
```

**Key invariant to test explicitly:** `retireCredit` must revert if called twice on the same ID, and `transferCredit` must revert on an already-retired credit. That single test case is the double-counting-prevention proof for the demo/judges.

**Vatsal's deliverables:**
- [ ] Hardhat project, contract above, full test suite (issue/transfer/retire/double-retire-reverts/role-gating)
- [ ] Deploy script → **local Hardhat node** (`http://127.0.0.1:8545`, same as the earlier repo) — no testnet/faucet dependency, fully reproducible for judges from the repo alone
- [ ] Publish ABI + deployed address into `docs/contract-abi.json` + `docs/deployed-address.txt` for Kavan to consume
- [ ] Document the exact `npx hardhat node` + deploy-script sequence in `blockchain/README.md` so Kavan (and judges) can spin it up in one command
- [ ] **Owner: Vatsal** (it's a chain-reading script, lives in `blockchain/scripts/listen.ts`) — polls/subscribes to the local Hardhat node for `CreditIssued`/`CreditTransferred`/`CreditRetired` events and POSTs to Kavan's `/carbon-credits/sync` endpoint. Kavan just needs that endpoint to exist and accept the event payload — doesn't need to touch chain code.

---

## 4. ML — owner: Vatsal

Two scoped features, pick primary now, treat the second as stretch:

**Primary — vegetation cover verification.** Project owner uploads site photos at registration/monitoring intervals. Model estimates vegetation/canopy cover % (mangrove/seagrass presence) as supporting evidence for the verifier — it assists, it does not auto-approve. Simple approach: a pretrained segmentation/classification model (or Roboflow-hosted model if reusing the existing API key) fine-tuned or zero-shot on coastal vegetation imagery.

**Stretch — measurement anomaly detection.** Statistical (z-score/IQR) or lightweight Isolation Forest over `measurements` time-series per device to flag physically implausible readings (e.g. salinity spike with no tide event) before they feed into credit calculations.

**Output contract (`ml_reports` — frozen schema both sides code against):**
```json
{
  "project_id": "uuid",
  "source_images": ["url1", "url2"],
  "vegetation_cover_pct": 0.0,
  "estimated_biomass": 0.0,
  "anomaly_flags": [{"measurement_id": "uuid", "reason": "string"}],
  "model_version": "v1",
  "confidence": 0.0
}
```

**Vatsal's deliverables:**
- [ ] `ml/` service (FastAPI or a plain script Kavan's backend calls) exposing `POST /predict` matching the schema above
- [ ] Sample/labeled dataset or pretrained-model choice documented in `ml/README.md`
- [ ] Backend just needs to `POST` an image set and receive the JSON — no ML code lives in `backend/`

---

## 5. Phase plan (parallel tracks)

| Phase | Kavan (FE + BE) | Vatsal (Blockchain + ML) |
|---|---|---|
| **0 — Setup** (Day 0–1) | FastAPI skeleton, SQLite + Alembic, JWT auth (register/login/refresh/me), shadcn app shell + auth pages | Hardhat project + skeleton contract (roles only), `ml/` repo skeleton + dataset/model choice decided |
| **1 — Core domain** (Day 1–3) | `projects`, `project_users` models + CRUD + registration wizard wired end-to-end; project list/detail pages in shadcn | Full `CarbonCreditRegistry.sol` (issue/transfer/retire/roles) + test suite; deploy to local Hardhat node; ABI published to `docs/` |
| **2 — Data capture + verification** (Day 3–5) | `iot_devices`, `measurements` models + ingestion endpoint; verifier approval UI + `/projects/{id}/status`; dashboard of pending reviews | ML v1 working `/predict`; wire into `/ml/verify-project/{id}` contract (Kavan calls it, Vatsal owns the model behind it); anomaly detection stretch if time |
| **3 — Issuance + marketplace** (Day 5–7) | `carbon_credits`, `transactions` models; `/carbon-credits/sync` endpoint; wallet connect (wagmi/ethers) + buy/retire UI calling the contract directly from frontend | Event listener syncing chain → `/carbon-credits/sync`; gas/cost sanity pass; contract security review (reentrancy, access control) |
| **4 — Public trust layer + polish** (Day 7–8) | Public no-auth `/verify/{id}` page — this is the single best demo screen for judges; encrypt sensitive project fields at rest (legal docs, org contact) | ML report visuals for the verifier UI; final on-chain demo script (issue → sell → retire → verify) rehearsed against the local node for presentation |

---

## 6. Explicit scope cuts
- Real IoT hardware — simulated sensor payloads with realistic mangrove/seagrass ranges
- Public testnet/mainnet deployment — local Hardhat node only (same as the earlier repo); avoids faucet/RPC flakiness during the demo
- Full computer-vision training pipeline — use a pretrained/hosted model, don't train from scratch under time pressure

## 7. Definition of done
Register project (Kavan's FE/BE) → ML report attached (Vatsal) → verifier approves → credit issued on-chain (Vatsal's contract, synced by Kavan's backend) → buyer purchases → buyer retires → public `/verify/{id}` page shows full history. That loop, live, is the whole submission — and it's the point where both tracks meet.