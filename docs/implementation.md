# Carbon MRV — Implementation Plan v3 (docs/implementation.md)
Circular Carbon Ecosystem — Generator / Approver-Admin / Buyer marketplace

**Repo:** `carbon-mrv`
**Frontend + backend base:** [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) (Next.js 15 + shadcn/ui + **Clerk**, kept as-is)
**Team:** Kavan — Frontend + all app backend via **Next.js API routes / Server Actions** · **Vatsal** — Blockchain (mostly done) + **ML microservice (FastAPI, ML-only)**

---

### Status Legend
- `[x]` **DONE** — implemented and working
- `[~]` **PARTIAL** — meaningful implementation exists but functionality is incomplete
- `[ ]` **TODO** — not implemented
- `[!]` **NEEDS REVIEW** — appears implemented but has architectural/functional inconsistencies that need manual verification

---

## 0. Role model `[x]`

```
ADMIN      — full CRUD, user management, superset of Approver, analytics
APPROVER   — reviews borderline/flagged parcel & extension requests, uploads drone evidence & triggers ML estimates
GENERATOR  — registers land (map draw + land details), claims credits, extends area
BUYER      — company or individual, purchases + retires credits
```

- [x] Role lives in **Clerk `publicMetadata.role`** (set at onboarding via role-picker step, or Clerk webhook) and is mirrored into `User.role` table for joins/queries.
- [x] Admin role assignment script (`scripts/set-admin-native.js`).
- [x] Route protection: Clerk middleware (`clerkMiddleware` in `src/proxy.ts` / middleware) + `requireRole()` / `getCurrentUserRole()` server helpers in `src/lib/auth.ts`.
- [x] Dynamic role-based navigation filtering (`src/config/nav-config.ts`, `src/hooks/use-nav.ts`).

---

## 1. Core decision logic (updated)

On every claim (initial registration **or** extension/growth update):

1. `[x]` Generator submits parcel with **claimed credits** and geofence polygon (map draw + land details only; no image upload).
2. `[x]` **Approver / Reviewer** uploads drone image evidence for the parcel submission and triggers the ML estimate.
3. `[x]` Server action calls the FastAPI ML service (drone estimate on registration evidence, satellite estimate on extension) → **estimated credits**. *(ML service exists, server action pending)*
4. `[~]` `delta = |claimed - estimated| / claimed`
   - `delta <= AUTO_APPROVE_THRESHOLD` → **auto-approved**, credits queued for on-chain issuance
   - `AUTO_APPROVE_THRESHOLD < delta <= AUTO_REJECT_THRESHOLD` → **PENDING_REVIEW**, lands in Approver/Admin queue
   - `delta > AUTO_REJECT_THRESHOLD` → **auto-rejected**, generator can file a **re-request** (fresh review row, history preserved)

Thresholds as env/config constants, not hardcoded — tune live during the hackathon.

---

## 2. Data models (final) — Prisma + SQLite `[x]`

All tables below live in `prisma/schema.prisma`, backed by SQLite (`dev.db`), with Prisma Client generated and database synced:

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

## 3. Screens

- `[x]` **Public**: landing/stats, login, signup (role picker / onboarding)
- `[ ]` **Public Verify**: `/verify/[creditIdOrTxHash]`
- `[x]` **Common**: role-aware dashboard shell, header, sidebar, profile
- **Generator**:
  - `[x]` Onboarding & registration wizard (`/dashboard/onboarding`, `/dashboard/generator/onboarding`)
  - `[x]` Register land (`/dashboard/generator/parcels/new` with map draw + land details)
  - `[ ]` My parcels list & parcel detail (`/dashboard/generator/parcels`, `/dashboard/generator/parcels/[id]`)
  - `[ ]` Update / extend area (`/dashboard/generator/parcels/[id]/extend`)
- **Buyer**:
  - `[x]` Onboarding & registration wizard (`/dashboard/onboarding`, `/dashboard/buyer/onboarding`)
  - `[ ]` Marketplace / browse credits (`/dashboard/buyer/marketplace`)
  - `[ ]` Purchase flow (Web3 wallet connect + transaction confirmation)
  - `[ ]` Holdings / retire credits (`/dashboard/buyer/holdings`)
  - `[ ]` Order history (`/dashboard/buyer/orders`)
- **Approver**:
  - `[x]` Review queue (`/dashboard/review/queue`)
  - `[x]` Review detail (drone/evidence upload + ML trigger + decision resolve) (`/dashboard/review/[id]`)
- **Admin**:
  - `[ ]` Admin CRUD data tables (Users, Parcels, Credits, Transactions) (`/dashboard/admin/*`)
  - `[ ]` Analytics dashboard (`/dashboard/admin/analytics`)

---

## 4. Backend split

### 4a. Next.js Server Actions / Route Handlers (owner: Kavan)

| Area | Implementation | Status | Notes |
|---|---|---|---|
| Auth | Clerk (built-in) + `clerkMiddleware` | `[x]` | Role mirrored to `User.role` via Clerk webhook & onboarding actions |
| Webhook | `/api/webhooks/clerk` route handler | `[x]` | Svix-verified user sync into DB |
| Generator profile | Server actions `getRegistrationStatusAction()`, `registerGeneratorAction()` | `[x]` | TanStack Form + Zod validated, Prisma upsert, Clerk metadata sync |
| Buyer profile | Server actions `getRegistrationStatusAction()`, `registerBuyerAction()` | `[x]` | TanStack Form + Zod validated, Prisma upsert, Clerk metadata sync |
| Parcel create | server action `createParcel()` | `[x]` | Writes `LandParcel` DRAFT, computes `totalAreaHa` server-side from geofence |
| Parcel estimate trigger | server action `runEstimate(parcelId \| extensionId, evidenceImages)` | `[x]` | Triggered by Approver after supplying drone evidence; calls ML `/predict/drone` |
| Re-request | server action `reRequestReview()` | `[ ]` | Only from `REJECTED`, re-triggers `runEstimate` |
| Extension | server action `createExtension()` | `[ ]` | Extension polygon claim |
| Review queue | server actions `listReviewQueue()` / `resolveReview()` / `uploadEvidenceAndEstimate()` | `[x]` | Role-gated to APPROVER/ADMIN |
| Credits read | server components fetching directly via Prisma | `[ ]` | Public parcel/credit pages |
| Credits sync from chain | route handler `POST /api/carbon-credits/sync` | `[ ]` | Chain listener posts here after on-chain mint/retire |
| Purchase flow | server action `createPurchaseRequest()`, `confirmPurchase()` | `[ ]` | Wallet tx confirmed client-side, writes `Transaction` + updates `CarbonCredit.status` |
| Admin CRUD | server actions per entity, data-table wired to Prisma | `[ ]` | Reuse template scaffolding |
| Public verify | server component, direct Prisma read | `[ ]` | No route handler needed |

### 4b. FastAPI ML microservice (owner: Vatsal) `[~]`

Exposes prediction endpoints. No database, ML inference only.
- `[x]` `POST /predict/drone` `{ images: string[], ecosystemType } -> { estimatedCredits, vegetationCoverPct, estimatedBiomass, confidence, modelVersion }` (`services/ml_service/routes/predict.py`)
- `[x]` `POST /predict/satellite` `{ images: string[], parcelId, priorEstimate } -> same shape` (`services/ml_service/routes/predict.py`)
- `[x]` Drone & Satellite ML models / preprocessing pipelines in `ml/`
- `[x]` Next.js ML client bridge (`src/lib/ml-client.ts`)
- `[ ]` End-to-end integration test with Next.js Approver evidence upload

---

## 5. next-shadcn-dashboard-starter — what to keep vs. strip (revised)

**Keep:**
- `[x]` Clerk auth end-to-end (middleware, sign-in/up pages, `useUser`/`auth()` helpers)
- `[x]` App shell, sidebar, theme, breadcrumbs
- `[x]` Form infrastructure (TanStack Form + Zod + `@/lib/form.ts` + modular field components)
- `[x]` Data-table primitives (TanStack Table)
- `[ ]` Chart components (Recharts) for admin analytics

**Add (not in starter by default):**
- `[x]` Prisma + SQLite: `schema.prisma` from §2, client generated, `dev.db` synced
- `[x]` Clerk webhook route handler (`/api/webhooks/clerk`) to mirror `User.role` into DB
- `[x]` `requireRole()` / `getCurrentUserRole()` helpers for server-action-level authorization
- `[x]` Modular Onboarding wizard (`/dashboard/onboarding`, `src/features/onboarding`)
- `[ ]` Map component (Leaflet/MapLibre polygon draw)

---

## 6. Phase plan (parallel tracks)

| Phase | Kavan (Next.js: FE + all app backend) | Vatsal (Blockchain + ML) | Status |
|---|---|---|---|
| **0 — Setup** (Day 0–1) | Fork starter, keep Clerk, add role picker to signup + webhook to mirror role into DB, Prisma schema + migrate, role-aware sidebar | Confirm contract on local Hardhat (mostly done); finalize `/predict/drone` + `/predict/satellite` I/O | `[x]` |
| **1 — Generator core** (Day 1–3) | `[x]` `GeneratorProfile` server actions & onboarding UI<br/>`[ ]` `LandParcel` server actions, map draw + land details component (register mode), parcel list/detail | `[x]` Drone model wired to `/predict/drone`, output matches `CarbonEstimate` shape | `[~]` |
| **2 — Decision engine + review** (Day 3–5) | `[ ]` Approver review queue UI with drone/evidence upload & `runEstimate()` trigger, threshold logic, `ReviewRequest` + re-request flow, extension flow | `[x]` Satellite model wired to `/predict/satellite` | `[~]` |
| **3 — Buyer + issuance** (Day 5–7) | `[x]` `BuyerProfile` server actions & onboarding UI<br/>`[ ]` Purchase flow, wallet connect, `CarbonCredit`/`Transaction` writes, `/api/carbon-credits/sync` route handler | `[x]` `CarbonCreditRegistry.sol` contract & deploy script<br/>`[ ]` Chain event listener (`listen.ts`) → posts to sync route | `[~]` |
| **4 — Admin + public trust layer + polish** (Day 7–8) | `[ ]` Admin CRUD tables, analytics dashboard, public `/verify/[id]` page | `[ ]` Final on-chain demo script rehearsed: register → estimate → approve → issue → buy → retire → verify | `[ ]` |

---

## 7. Explicit scope cuts (unchanged + auth note)
- Real IoT hardware / sensor time-series — cut
- Multi-user collaboration per parcel — one generator per parcel
- Public testnet/mainnet — local Hardhat node only
- Full CV training pipeline — pretrained/hosted models behind FastAPI
- Marketplace order-matching — flat list + direct purchase
- Custom auth/JWT — cut in favor of Clerk (this revision's main change)
- Forgot-password — Clerk gives you this for free, no extra work needed

## 8. Definition of done
Generator registers parcel with geofence + land details → Approver uploads drone image evidence → ML triggers estimate → auto-approved or Approver clears it → credit issued on-chain → chain listener syncs to `/api/carbon-credits/sync` → buyer purchases with ETH → buyer retires → public `/verify/[id]` shows full history including which decision path it took. Extension path (satellite growth claim) run once, live, as the second demo beat.