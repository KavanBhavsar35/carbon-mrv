# Carbon MRV — Implementation Plan v3 (docs/implementation.md)
Circular Carbon Ecosystem — Generator / Approver-Admin / Buyer marketplace

**Repo:** `carbon-mrv`
**Frontend + backend base:** [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) (Next.js 15 + shadcn/ui + **Clerk**, kept as-is)
**Team:** Kavan — Frontend + all app backend via **Next.js API routes / Server Actions** · **Vatsal** — Blockchain (mostly done) + **ML microservice (FastAPI, ML-only)**

Change from v2: no custom JWT layer, no FastAPI app backend. Clerk stays (you already know it, starter ships with it — use its potential instead of ripping it out). FastAPI is scoped down to *only* the ML predict service; everything else — profiles, parcels, review queue, credits, transactions, purchases — is Next.js server actions / route handlers hitting the DB directly. Blockchain contract (unchanged) and ML output contract (unchanged) from v1/v2 still apply.

---

## 0. Role model

```
ADMIN      — full CRUD, user management, superset of Approver, analytics
APPROVER   — reviews borderline/flagged parcel & extension requests only
GENERATOR  — registers land, claims credits, extends area
BUYER      — company or individual, purchases + retires credits
```

Role lives in **Clerk `publicMetadata.role`** (set at signup via a role-picker step, or a Clerk `afterSignUp` webhook) and is mirrored into your own `users` table for joins/queries. `ADMIN`/`APPROVER` are set manually in the Clerk dashboard or via an admin-only server action — never self-service at signup.

Route protection: Clerk middleware (`clerkMiddleware` in `middleware.ts`, already scaffolded by the starter) + a small `requireRole()` helper wrapping server actions/route handlers, reading `sessionClaims.metadata.role`.

---

## 1. Core decision logic (unchanged)

On every claim (initial registration **or** extension/growth update):

1. Generator submits **claimed credits**.
2. Server action calls the FastAPI ML service (drone estimate on registration, satellite estimate on extension) → **estimated credits**.
3. `delta = |claimed - estimated| / claimed`
   - `delta <= AUTO_APPROVE_THRESHOLD` → **auto-approved**, credits queued for on-chain issuance
   - `AUTO_APPROVE_THRESHOLD < delta <= AUTO_REJECT_THRESHOLD` → **PENDING_REVIEW**, lands in Approver/Admin queue
   - `delta > AUTO_REJECT_THRESHOLD` → **auto-rejected**, generator can file a **re-request** (fresh review row, history preserved)

Thresholds as env/config constants, not hardcoded — tune live during the hackathon.

---

## 2. Data models (final) — Prisma + SQLite (swap to Postgres later if you outgrow it; SQLite is fine for a hackathon demo and keeps setup to zero)

Why Prisma: it's the fastest-to-wire ORM for Next.js server actions, has a clean migration story, and the starter's TS-first stack expects this shape. All tables below live in one `schema.prisma`, one DB — the ML/FastAPI service never touches this DB directly, it only receives images and returns JSON (see §4).

| Model | Field | Type | Notes |
|---|---|---|---|
| **User** | id | cuid pk | |
| | clerkId | String, unique | mirrors Clerk user |
| | email | String, unique | |
| | name | String | |
| | phone | String? | |
| | role | enum `ADMIN, APPROVER, GENERATOR, BUYER` | mirrored from Clerk publicMetadata, source of truth for queries |
| | walletAddress | String?, unique | |
| | isActive | Boolean, default true | |
| | createdAt / updatedAt | DateTime | |
| **GeneratorProfile** | id, userId FK unique | | 1:1 |
| | entityType | enum `INDIVIDUAL, NGO, PANCHAYAT, COMMUNITY, COMPANY` | |
| | organizationName | String? | required if entityType != INDIVIDUAL |
| | contactPerson / contactPhone | String | |
| | state / district / village | String | |
| | registrationNumber | String? | |
| | hasLegalPermits / hasSurveyReport / hasEnvironmentalClearance | Boolean | |
| | locked | Boolean, default false | true after first parcel submitted — gates edit form |
| **BuyerProfile** | id, userId FK unique | | 1:1 |
| | buyerType | enum `INDIVIDUAL, COMPANY` | |
| | companyName / industry | String? | |
| | annualEmissionsTco2e | Float? | |
| | wantedCredits | Float | |
| **LandParcel** | id | cuid pk | |
| | generatorId FK | | |
| | parcelName | String | |
| | ecosystemType | enum `MANGROVE, SEAGRASS, SALT_MARSH, CORAL_REEF, KELP_FOREST` | |
| | geofence | Json | GeoJSON Polygon, drawn via map component |
| | totalAreaHa | Float | computed server-side from geofence, never trust client value |
| | claimedCredits | Float | at registration |
| | contractAddress / tokenId | String? | set once minted |
| | status | enum `DRAFT, PENDING_ESTIMATE, PENDING_REVIEW, APPROVED, REJECTED` | |
| | totalCreditsIssued | Float, default 0 | |
| **ParcelExtension** | id, parcelId FK | | growth/extension claims |
| | additionalGeofence | Json? | null = same-area growth reclaim |
| | claimedCredits | Float | |
| | status | enum `PENDING_ESTIMATE, PENDING_REVIEW, APPROVED, REJECTED` | |
| **CarbonEstimate** | id | cuid pk | one per registration/extension estimate run |
| | parcelId FK, extensionId FK? | | exactly one set |
| | source | enum `DRONE, SATELLITE` | |
| | sourceImages | Json (string[]) | |
| | estimatedCredits | Float | |
| | vegetationCoverPct / estimatedBiomass | Float | from ML output contract |
| | confidence | Float | |
| | modelVersion | String | |
| | deltaPct | Float | computed |
| | decision | enum `AUTO_APPROVED, PENDING_REVIEW, AUTO_REJECTED` | |
| **ReviewRequest** | id | cuid pk | Approver/Admin queue |
| | parcelId FK, extensionId FK? | | |
| | estimateId FK | | |
| | isRerequest | Boolean, default false | |
| | flaggedReason | String? | |
| | status | enum `PENDING, APPROVED, REJECTED` | |
| | reviewedById FK?, comments String?, reviewedAt DateTime? | | |
| **CarbonCredit** | id, parcelId FK | | |
| | onchainCreditId (BigInt/String, unique), amount Float, vintage Int | | |
| | status | enum `ISSUED, SOLD, RETIRED` | |
| | blockchainTxHash unique, ownerWalletAddress | | |
| | mintedAt, retiredAt, retiredReason | | |
| **PurchaseRequest** | id, buyerId FK | | |
| | requestedAmount Float, maxPricePerCredit Float? | | |
| | status | enum `OPEN, MATCHED, FULFILLED, CANCELLED` | |
| **Transaction** | id, type enum `MINT, TRANSFER, PURCHASE, RETIRE`, fromUserId, toUserId, parcelId, creditId, amount, pricePerCredit, totalPrice, currency default `ETH`, txHash unique, blockNumber, status enum `PENDING, PROCESSING, COMPLETED, FAILED`, createdAt | | |

**Still dropped (from v1/v2):** multi-user parcel collaboration, IoT devices/measurements time-series, order-book matching. Same reasoning as before.

---

## 3. Screens — unchanged from v2

Public: landing/stats, login, signup (role picker: Generator/Buyer), public `/verify/[creditIdOrTxHash]`.
Common: role-aware dashboard.
Generator: onboarding, register-land (map draw + drone upload), my parcels, update/extend area.
Buyer: onboarding, marketplace/browse, purchase flow (wallet connect), holdings/retire, order history.
Approver: review queue, review detail (image compare + approve/reject).
Admin: everything Approver has + CRUD tables (users/parcels/credits/transactions) + user management + analytics.

Map component (leaflet+leaflet-draw, or maplibre-gl+draw plugin) stays a standalone reusable component parametrized by mode (`register` | `extend`) — no change.

---

## 4. Backend split

### 4a. Next.js Server Actions / Route Handlers (owner: Kavan) — everything except ML inference

Prefer **server actions** for anything called from a form/mutation inside the app (this is what the starter's form patterns expect); use **route handlers** (`app/api/.../route.ts`) only where you need a stable HTTP endpoint for something *outside* Next.js — the public `/verify` page's data fetch (fine as a server component instead, actually), and Vatsal's chain-event listener callback.

| Area | Implementation | Notes |
|---|---|---|
| Auth | Clerk (built-in) | role stored in `publicMetadata`, mirrored to `User.role` via a Clerk webhook route handler (`/api/webhooks/clerk`) on `user.created`/`user.updated` |
| Generator profile | server action `updateGeneratorProfile()` | rejects locked fields once `locked=true` |
| Buyer profile | server action `updateBuyerProfile()` | |
| Parcel create | server action `createParcel()` | writes `LandParcel` DRAFT, computes `totalAreaHa` server-side from geofence |
| Parcel estimate trigger | server action `runEstimate(parcelId \| extensionId)` | `fetch()`s the FastAPI `/predict` endpoint, applies threshold logic, writes `CarbonEstimate` + updates parcel/extension status + creates `ReviewRequest` if needed |
| Re-request | server action `reRequestReview()` | only from `REJECTED`, re-triggers `runEstimate` |
| Extension | server action `createExtension()` | |
| Review queue | server actions `listReviewQueue()` / `resolveReview()` | role-gated to APPROVER/ADMIN |
| Credits read | server components fetching directly via Prisma | public parcel/credit pages |
| Credits sync from chain | route handler `POST /api/carbon-credits/sync` | Vatsal's `blockchain/scripts/listen.ts` posts here after on-chain event — plain HTTP callback, both sides TS, no cross-language auth glue needed |
| Purchase flow | server action `createPurchaseRequest()`, `confirmPurchase()` | wallet tx confirmed client-side (wagmi/ethers), tx hash passed to `confirmPurchase()` which writes `Transaction` + updates `CarbonCredit.status` |
| Admin CRUD | server actions per entity, or the starter's existing data-table + form pattern wired to Prisma | reuse template scaffolding directly |
| Public verify | server component, direct Prisma read by `creditId` or `txHash` | no route handler needed |

### 4b. FastAPI ML microservice (owner: Vatsal) — unchanged scope, narrower role

Only exposes prediction endpoints. No database, no auth beyond a shared service key if you want to gate it from public internet during the demo.

```
POST /predict/drone      { images: string[], ecosystemType } -> { estimatedCredits, vegetationCoverPct, estimatedBiomass, confidence, modelVersion }
POST /predict/satellite  { images: string[], parcelId, priorEstimate } -> same shape
```

Kavan's `runEstimate()` server action calls whichever endpoint fits, gets JSON back, does the threshold math and DB writes in TS. This is the same I/O contract as v1's `ml_reports` schema, just consumed from TS instead of FastAPI.

---

## 5. next-shadcn-dashboard-starter — what to keep vs. strip (revised)

**Keep everything, including Clerk** — this is the whole point of the switch. No Day-0 auth surgery.

**Keep:**
- Clerk auth end-to-end (middleware, sign-in/up pages, `useUser`/`auth()` helpers)
- App shell, sidebar, theme, breadcrumbs
- `data-table` (tanstack table) → repoint columns at Prisma-backed entities
- Form patterns (react-hook-form + zod) → reuse for profile/parcel/review forms
- Chart components (recharts) → admin analytics
- Server action conventions if the starter already has any example mutations — mirror that pattern for your own

**Add (not in starter by default):**
- Prisma + SQLite: `schema.prisma` from §2, `npx prisma migrate dev`
- Clerk webhook route handler to mirror `User.role` into your DB
- `requireRole()` helper for server-action-level authorization (Clerk handles page auth, but role-gating within a shared layout needs its own check)
- Map component (leaflet/maplibre) — not part of the starter, net-new

**Strip:**
- Kanban board demo — unrelated, delete route + components
- "Product" CRUD demo (faker-backed) — delete once you've copied its data-table pattern for a real entity
- Any demo-only routes outside your screens list

Quick pass over the current repo tree before deleting anything — template internals shift between pulls, verify against what you actually have.

---

## 6. Phase plan (parallel tracks)

| Phase | Kavan (Next.js: FE + all app backend) | Vatsal (Blockchain + ML) |
|---|---|---|
| **0 — Setup** (Day 0–1) | Fork starter, keep Clerk, add role picker to signup + webhook to mirror role into DB, Prisma schema + migrate, role-aware sidebar | Confirm contract on local Hardhat (mostly done); finalize `/predict/drone` + `/predict/satellite` I/O |
| **1 — Generator core** (Day 1–3) | `GeneratorProfile` + `LandParcel` server actions, map draw component (register mode), parcel list/detail | Drone model wired to `/predict/drone`, output matches `CarbonEstimate` shape |
| **2 — Decision engine + review** (Day 3–5) | `runEstimate()` threshold logic, `ReviewRequest` + Approver queue UI, re-request flow, extension flow (map extend mode) | Satellite model wired to `/predict/satellite` |
| **3 — Buyer + issuance** (Day 5–7) | `BuyerProfile`, purchase flow, wallet connect, `CarbonCredit`/`Transaction` writes, `/api/carbon-credits/sync` route handler | Chain event listener (`listen.ts`) → posts to sync route; gas sanity pass |
| **4 — Admin + public trust layer + polish** (Day 7–8) | Admin CRUD tables, analytics dashboard, public `/verify/[id]` page | Final on-chain demo script rehearsed: register → estimate → approve → issue → buy → retire → verify |

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
Generator registers parcel with geofence + drone estimate → auto-approved or Approver clears it → credit issued on-chain → chain listener syncs to `/api/carbon-credits/sync` → buyer purchases with ETH → buyer retires → public `/verify/[id]` shows full history including which decision path it took. Extension path (satellite growth claim) run once, live, as the second demo beat.