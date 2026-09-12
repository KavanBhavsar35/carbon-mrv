# Carbon MRV — Implementation Plan v3 (docs/implementation.md)
Circular Carbon Ecosystem — Generator / Approver-Admin / Buyer marketplace

**Repo:** `carbon-mrv`  
**Frontend + backend base:** [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) (Next.js 16 + Tailwind v4 + shadcn/ui + **Clerk**)  
**Team:** Kavan — Frontend + all app backend via **Next.js API routes / Server Actions** · **Vatsal** — Blockchain + **ML microservice (FastAPI, PyTorch U-Net & Isolation Forest)**

---

### Status Legend
- `[x]` **DONE** — Implemented, verified, and fully operational
- `[~]` **PARTIAL** — Meaningful implementation exists; secondary features or edge-case polish remaining
- `[ ]` **TODO** — Not implemented
- `[!]` **NEEDS REVIEW** — Implemented but has architectural/functional inconsistencies that need manual verification

---

## 0. Role model `[x]`

```
ADMIN      — full CRUD, user management, superset of Approver, analytics & transaction ledger
APPROVER   — reviews borderline/flagged parcel & extension requests, uploads drone evidence & triggers ML estimates
GENERATOR  — registers land (map draw + land details), claims credits, extends area
BUYER      — company or individual, purchases + retires credits for ESG compliance
```

- [x] Role lives in **Clerk `publicMetadata.role`** (set at onboarding via role-picker step, or Clerk webhook) and is mirrored into `User.role` table for joins/queries.
- [x] Admin role assignment script (`scripts/set-admin-native.js`).
- [x] Route protection: Clerk middleware (`clerkMiddleware` in `src/proxy.ts` / middleware) + `requireRole()` / `getCurrentUserRole()` server helpers in `src/lib/auth.ts`.
- [x] Dynamic role-based navigation filtering (`src/config/nav-config.ts`, `src/hooks/use-nav.ts`) — new users without a role see only unprotected items.
- [x] Role Switcher removed from header. Component file retained but not rendered.

---

## 1. Core decision logic `[x]`

On every claim (initial registration **or** extension/growth update):

1. `[x]` Generator submits parcel with **claimed credits** and geofence polygon (map draw + land details).
2. `[x]` **Approver / Reviewer** uploads drone image evidence for the parcel submission and triggers the ML estimate.
3. `[x]` Server action calls the FastAPI ML service (`/predict/drone` on UAV evidence, `/predict/satellite` on extension) → **estimated credits & Sylvera rating**.
4. `[x]` `delta = |claimed - estimated| / claimed` threshold decision logic:
   - `delta <= AUTO_APPROVE_THRESHOLD` (15%) → **auto-approved**, credits queued for on-chain issuance (Low Risk)
   - `AUTO_APPROVE_THRESHOLD < delta <= AUTO_REJECT_THRESHOLD` (25%) → **PENDING_REVIEW**, lands in Approver/Admin queue
   - `delta > AUTO_REJECT_THRESHOLD` (25%) → **auto-rejected** (High Risk), generator can file a **re-request**

Thresholds configured via env/config constants, tuned for live pitch demonstrations.

---

## 2. Data models (final) — Prisma + SQLite `[x]`

All tables below live in `prisma/schema.prisma`, backed by SQLite (`dev.db`), with Prisma Client generated and database synced & seeded:

| Model | Field | Type | Status | Notes |
|---|---|---|---|---|
| **User** | id, clerkId, email, name, phone, role, walletAddress, isActive, createdAt, updatedAt | cuid pk, strings, booleans, timestamps | `[x]` | Mirrors Clerk user, source of truth for queries |
| **GeneratorProfile** | id, userId FK, entityType, organizationName, contactPerson, contactPhone, state, district, village, registrationNumber, hasLegalPermits, hasSurveyReport, hasEnvironmentalClearance, locked | cuid pk, strings, booleans | `[x]` | 1:1 with User, gates edit form after lock |
| **BuyerProfile** | id, userId FK, buyerType, companyName, industry, annualEmissionsTco2e, wantedCredits | cuid pk, strings, floats | `[x]` | 1:1 with User |
| **LandParcel** | id, generatorId FK, parcelName, ecosystemType, geofence, totalAreaHa, claimedCredits, contractAddress, tokenId, status, totalCreditsIssued, createdAt, updatedAt | cuid pk, strings, floats, timestamps | `[x]` | Geofence stored as JSON string for SQLite |
| **ParcelExtension** | id, parcelId FK, additionalGeofence, claimedCredits, status, createdAt, updatedAt | cuid pk, strings, floats, timestamps | `[x]` | Growth/extension claims |
| **CarbonEstimate** | id, parcelId FK, extensionId FK?, source, sourceImages, estimatedCredits, vegetationCoverPct, estimatedBiomass, confidence, modelVersion, deltaPct, decision, createdAt | cuid pk, strings, floats, timestamps | `[x]` | Source images uploaded by Approver |
| **ReviewRequest** | id, parcelId FK, extensionId FK?, estimateId FK, isRerequest, flaggedReason, status, reviewedById FK?, comments, reviewedAt, createdAt | cuid pk, strings, booleans, timestamps | `[x]` | Approver/Admin queue entity |
| **CarbonCredit** | id, parcelId FK, onchainCreditId, amount, vintage, status, blockchainTxHash, ownerWalletAddress, mintedAt, retiredAt, retiredReason | cuid pk, strings, floats, ints, timestamps | `[x]` | Minted/Issued credit records |
| **PurchaseRequest** | id, buyerId FK, requestedAmount, maxPricePerCredit, status, createdAt, updatedAt | cuid pk, strings, floats, timestamps | `[x]` | Buyer purchase intent |
| **Transaction** | id, type, fromUserId, toUserId, parcelId, creditId, amount, pricePerCredit, totalPrice, currency, txHash, blockNumber, status, createdAt | cuid pk, strings, floats, timestamps | `[x]` | On-chain & platform transaction log |

---

## 3. Screens & Presentation Interfaces

- `[x]` **Public Landing**: landing/stats, login, signup — hero CTA links to `/auth/sign-up` and `/auth/sign-in`. No demo links.
- `[x]` **Public Zero-Auth ESG Verification**: `/verify/[id]` (Query by credit ID, on-chain Token ID, or Tx Hash with SHA-256 evidence integrity check)
- `[x]` **Common**: role-aware dashboard shell, header, sidebar, profile. Role Switcher removed.
- **Generator**:
  - `[x]` Onboarding & registration wizard (`/dashboard/onboarding`, `/dashboard/generator/onboarding`)
  - `[x]` Register land (`/dashboard/generator/parcels/new` with map draw + land details)
  - `[x]` My parcels list (`/dashboard/generator/parcels`)
  - `[x]` Parcel detail (`/dashboard/generator/parcels/[id]`)
  - `[x]` Extend area placeholder (`/dashboard/generator/parcels/[id]/extend`) — rich future-feature page with planned features
- **Buyer**:
  - `[x]` Onboarding & registration wizard (`/dashboard/onboarding`, `/dashboard/buyer/onboarding`) — auto-redirects to role dashboard after 4s
  - `[x]` Marketplace / browse credits (`/dashboard/buyer/marketplace`) — redesigned with shadcn, real Prisma server actions
  - `[x]` Purchase flow — calls `purchaseCreditAction()` server action, creates Transaction record
  - `[x]` Holdings & ESG Retirement (`/dashboard/buyer/holdings`) — redesigned with shadcn, real Prisma server actions
  - `[x]` Order history (`/dashboard/buyer/orders`) — real data table from Transaction records
- **Approver**:
  - `[x]` Review queue (`/dashboard/review/queue`)
  - `[x]` Review detail console (`/dashboard/review/[id]` with drone/evidence upload, PyTorch ML trigger, delta anomaly check & approve/reject resolve)
- **Admin**:
  - `[x]` Admin Land Parcels Table (`/dashboard/admin/parcels`)
  - `[x]` Admin Credits & Buffer Pool Inventory (`/dashboard/admin/credits`) — migrated to `getAllCreditsAction()` Prisma server action
  - `[x]` Admin Blockchain Transactions Ledger (`/dashboard/admin/transactions`) — migrated to `getAllTransactionsAction()` Prisma server action
  - `[x]` User Management (`/dashboard/admin/users`) — real data table from Prisma User records
  - `[x]` Analytics Dashboard (`/dashboard/admin/analytics`) — live platform stats with credit pipeline bar chart

---

## 4. Backend split & System Integration

### 4a. Next.js Server Actions / Route Handlers (owner: Kavan) `[x]`

| Area | Implementation | Status | Notes |
|---|---|---|---|
| Auth | Clerk (built-in) + `clerkMiddleware` | `[x]` | Role mirrored to `User.role` via Clerk webhook & onboarding actions |
| Webhook | `/api/webhooks/clerk` route handler | `[x]` | Svix-verified user sync into DB |
| Generator profile | Server actions `getRegistrationStatusAction()`, `registerGeneratorAction()` | `[x]` | TanStack Form + Zod validated, Prisma upsert, Clerk metadata sync |
| Buyer profile | Server actions `getRegistrationStatusAction()`, `registerBuyerAction()` | `[x]` | TanStack Form + Zod validated, Prisma upsert, Clerk metadata sync |
| Parcel create | Server action `createParcel()`, API route `/api/parcels` | `[x]` | Writes `LandParcel` PENDING_REVIEW, computes `totalAreaHa` server-side |
| Parcel estimate trigger | Server action `uploadEvidenceAndEstimate()`, `runEstimate()` | `[x]` | Triggered by Approver after supplying drone evidence; calls FastAPI `/predict/drone` |
| Demo API pipeline | ~~API route `POST /api/demo`~~ | **`[x]` REMOVED** | Marketplace/holdings/admin pages now use Prisma server actions directly |
| Re-request | Server action `reRequestReview()` | `[~]` | Re-triggers review from `REJECTED` |
| Extension | Server action `createExtension()` | `[~]` | Extension polygon claim |
| Review queue | Server actions `getReviewQueueAction()`, `getReviewDetailAction()`, `resolveReview()` | `[x]` | Role-gated to APPROVER/ADMIN |
| Credits read | Server actions `getAvailableCreditsAction()`, `getAllCreditsAction()`, `getMyHoldingsAction()` | `[x]` | Prisma-backed, no /api/demo dependency |
| Purchase & Retire | `purchaseCreditAction()`, `retireCreditAction()`, `getMyTransactionsAction()` | `[x]` | Updates CarbonCredit.status, records Transaction log |
| Admin data | `getAllUsersAction()`, `getAllTransactionsAction()`, `getAdminAnalyticsAction()` | `[x]` | Real Prisma queries, role-gated |
| Public verify | Server component `src/app/verify/[id]/page.tsx` | `[x]` | Zero-auth direct Prisma read for public certificates |

### 4b. FastAPI ML Microservice (owner: Vatsal) `[x]`

Exposes prediction endpoints. PyTorch U-Net models & Isolation Forest anomaly detector.
- `[x]` `POST /predict/drone`: PyTorch `MangroveUNet` (`services/ml_service/routes/predict.py`), returns canopy cover %, biomass ($t/ha$), Sylvera rating (`AAA`), 15% permanence buffer deduction (`bufferPoolCredits`), net tradable credits.
- `[x]` `POST /predict/satellite`: Bi-temporal `SatelliteRecoveryUNet` + `ClaimAnomalyDetector` (Isolation Forest) for historical delta evaluation and risk scoring (`LOW`, `MEDIUM`, `HIGH`).
- `[x]` Drone & Satellite ML models / preprocessing pipelines in `ml/`.
- `[x]` Next.js ML client bridge (`src/lib/ml-client.ts`).
- `[x]` End-to-end integration test suite (`services/ml_service/tests/test_predict.py`, `verify_drone_carbon_model.py`).

### 4c. Blockchain & Event Sync Bridge (owner: Vatsal) `[x]`

Ethereum EVM Smart Contracts & On-Chain Listener:
- `[x]` `CarbonCreditRegistry.sol` contract & deployment scripts (`scripts/deploy.js`). Passed 11/11 Hardhat unit tests.
- `[x]` Ethers.js chain event listener daemon (`blockchain/scripts/listen.ts`): Monitors `CreditIssued` and `CreditRetired` contract events and posts directly to Next.js `/api/carbon-credits/sync`.

### 4d. Judge Presentation & Showcase Tools

- ~~`/demo` interactive console~~ — **REMOVED**. Role-specific dashboards with real data now serve as the live demonstration.
- `[x]` 5-Second CLI Pitch Script (`scripts/judge_demo.py`): Command-line automated test & presentation script.
- ~~Header Quick Role Switcher~~ — **REMOVED** from header. Roles are now set via onboarding and Clerk metadata.
- `[x]` Public Cryptographic Certificate (`/verify/[id]`): Tamper-proof ESG verification page with SHA-256 evidence integrity hash.

---

## 5. Starter framework alignment

**Keep:**
- `[x]` Clerk auth end-to-end (middleware, sign-in/up pages, `useUser`/`auth()` helpers)
- `[x]` App shell, sidebar, theme, breadcrumbs
- `[x]` Form infrastructure (TanStack Form + Zod + `@/lib/form.ts` + modular field components)
- `[x]` Data-table primitives (TanStack Table)
- `[~]` Chart components (Recharts) for admin analytics

**Added to Starter:**
- `[x]` Prisma + SQLite: `schema.prisma`, client generated, `dev.db` synced & seeded
- `[x]` Clerk webhook route handler (`/api/webhooks/clerk`) to mirror `User.role` into DB
- `[x]` `requireRole()` / `getCurrentUserRole()` helpers for server-action-level authorization
- `[x]` Modular Onboarding wizard (`/dashboard/onboarding`, `src/features/onboarding`)
- `[x]` Interactive Map integration for geofence selection / preview

---

## 6. Phase plan (status update)

| Phase | Kavan (Next.js: FE + all app backend) | Vatsal (Blockchain + ML) | Status |
|---|---|---|---|
| **0 — Setup** | Fork starter, keep Clerk, role picker, webhook, Prisma schema + migrate, role-aware sidebar | Hardhat smart contracts, `/predict/drone` + `/predict/satellite` I/O | `[x]` **DONE** |
| **1 — Generator core** | `GeneratorProfile` server actions, `LandParcel` actions, land registration wizard, parcel list & details | Drone PyTorch model wired to `/predict/drone`, output matches `CarbonEstimate` shape | `[x]` **DONE** |
| **2 — Decision engine + review** | Approver review queue UI with drone/evidence upload, ML trigger, threshold logic, delta anomaly check | Satellite model wired to `/predict/satellite` with Isolation Forest anomaly risk scoring | `[x]` **DONE** |
| **3 — Buyer + issuance** | `BuyerProfile` actions, Marketplace credit discovery, purchase flow, corporate ESG holdings & retirement certificate, `/api/carbon-credits/sync` | `CarbonCreditRegistry.sol` contract & deploy script, Ethers.js chain event listener (`listen.ts`) | `[x]` **DONE** |
| **4 — Admin + public trust layer + polish** | Admin CRUD tables (`/dashboard/admin/parcels`, `/credits`, `/transactions`, `/users`, `/analytics`), public `/verify/[id]` ESG certificate, role-aware dashboard | Final on-chain demo script (`scripts/judge_demo.py`) rehearsed: register → estimate → approve → issue → buy → retire → verify | `[x]` **DONE** |

---

## 7. Explicit scope cuts
- Real IoT hardware / sensor time-series — cut
- Multi-user collaboration per parcel — one generator per parcel
- Public testnet/mainnet — local Hardhat node only
- Full CV training pipeline — pretrained/hosted models behind FastAPI
- Marketplace order-matching — flat list + direct purchase
- Custom auth/JWT — cut in favor of Clerk
- Forgot-password — Clerk provides out-of-the-box

## 8. Definition of done `[x]`
Generator registers parcel with geofence + land details → Approver uploads drone image evidence → ML triggers estimate → auto-approved or Approver clears it → credit issued on-chain → chain listener syncs to `/api/carbon-credits/sync` → buyer purchases with ETH/USD → buyer retires → public `/verify/[id]` shows full history including which decision path it took. All steps demonstrable via UI (role-specific dashboard screens & public verify), CLI (`judge_demo.py`), or individual dashboard screens.