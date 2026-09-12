# Phase 2: Full Multi-Role Production Flow Architecture & Specification

**Document:** `docs/phase2.md`  
**Target:** Market-Ready, Judge-Grade Multi-Role Blue Carbon MRV Workflow  
**Roles:** Generator, Approver, Buyer, Admin  
**Stack:** Next.js 16 (React 19, Tailwind v4, Shadcn), Prisma ORM + SQLite (`dev.db`), FastAPI ML Microservice (PyTorch U-Net & Isolation Forest), Ethereum EVM Smart Contracts (Hardhat / OpenZeppelin ERC-based Registry)

---

## 1. System Vision & End-to-End Role Architecture

The system provides a complete, role-governed ecosystem for high-integrity blue carbon credits. The entire lifecycle is strictly divided across 4 distinct user roles:

```
+----------------------------------------------------------------------------------------------------+
|                                      ROLE 1: GENERATOR                                             |
|  - Signs in / Selects GENERATOR role                                                               |
|  - Fills Land Registration: Mangrove Area (ha), Location (Coords/State/District), Claimed Credits  |
|  - Submits Parcel -> Saved in Database -> Status: PENDING_REVIEW -> Visible to Approver & Admin     |
+--------------------------------------------------+-------------------------------------------------+
                                                   |
                                                   v
+----------------------------------------------------------------------------------------------------+
|                                      ROLE 2: APPROVER                                              |
|  - Signs in as APPROVER -> Navigates to Review Queue -> Opens Pending Parcel                       |
|  - Uploads Drone Multispectral / RGB Imagery of the parcel                                         |
|  - ML Model runs: Mangrove Canopy Cover %, Biomass Density, ML Carbon Baseline                     |
|  - Anomaly Flag: Compares Claimed vs AI Actual -> Risk Flag (LOW/HIGH, Delta %)                    |
|  - Approver Decision: APPROVE (triggers on-chain minting) or REJECT (marks parcel rejected)        |
+--------------------------------------------------+-------------------------------------------------+
                                                   | (If Approved: Smart Contract Mints Credit)
                                                   v
+----------------------------------------------------------------------------------------------------+
|                                      ROLE 3: BUYER                                                 |
|  - Signs in as BUYER -> Browses Marketplace of On-Chain Issued Carbon Credits                      |
|  - Purchases Credits via Smart Contract (Tx logged on EVM & Prisma)                                |
|  - Retires Credits for Corporate Scope 1 & 2 ESG Net-Zero Target                                   |
|  - Downloads / Views Cryptographic Public ESG Retirement Certificate                               |
+--------------------------------------------------+-------------------------------------------------+
                                                   |
                                                   v
+----------------------------------------------------------------------------------------------------+
|                                      ROLE 4: ADMIN                                                 |
|  - Signs in as ADMIN -> Complete oversight & access to all system functions                        |
|  - Manages Users (Role assignment, status), Parcels, Credits, Blockchain Transactions, & ML Audits |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Role Specifications & Workflows

### Role 1: Generator (Coastal Community / NGO / Landholder)
1. **Authentication & Role Selection:**
   - User signs up / logs in via Clerk authentication or Quick Role Switcher.
   - Profile initialized with `role: "GENERATOR"`.
2. **Land Parcel Registration Form (`/dashboard/generator/parcels/new`):**
   - **Parcel Identification:** Name of mangrove conservation site (e.g., *Sundarbans Mangrove Conservation Block 4*).
   - **Ecosystem Type:** Mangrove (Rhizophora mucronata / Avicennia marina), Seagrass, or Salt Marsh.
   - **Location Metadata:** State, District, Village, and GPS Geofence coordinates (lat/long polygons or map picker).
   - **Area Calculation:** Total area in hectares ($ha$).
   - **Claimed Carbon Volume:** Amount of carbon credits generator claims to generate ($tCO_2e$).
   - **Supporting Permits:** Upload of tenure/legal conservation clearance.
3. **Database Submission:**
   - Server action writes record to `LandParcel` in `dev.db` with `status: "PENDING_REVIEW"`.
   - Generates an active `ReviewRequest` record.
   - Status is immediately updated in real time and becomes visible in the Approver and Admin queues.

---

### Role 2: Approver / Auditor (Independent Verification Body)
1. **Queue Inspection (`/dashboard/review/queue`):**
   - Approver sees all pending parcel applications submitted by generators.
   - Selects a parcel to open the detailed audit console (`/dashboard/review/[id]`).
2. **Drone Evidence Upload & AI ML Execution:**
   - Approver inspects the coordinates and uploads high-resolution drone UAV orthomosaic imagery of the designated plot.
   - Clicks **"Run AI ML Verification"**, sending image data to the FastAPI ML service (`http://localhost:8000/predict/drone`).
3. **AI Inference & Automated Comparison:**
   - **Mangrove Canopy Segmentation:** PyTorch `MangroveUNet` calculates the exact canopy cover percentage (`vegetationCoverPct`).
   - **Biomass Allometric Model:** Computes biomass density in tons per hectare (`estimatedBiomass`).
   - **Estimated Carbon Volume:** Calculates the real, verified carbon sequestration potential:
     $$\text{Verified Credits} = \text{Area (ha)} \times \text{Canopy Cover} \times \text{Allometric Coefficient}$$
   - **Sylvera-Grade Quality Rating:** Computes additionality benchmark (`AAA`, `AA`, `A`).
   - **Permanence Buffer Pool:** Automatically deducts a 15% insurance buffer pool (`bufferPoolCredits`).
   - **Delta & Anomaly Check:** Calculates discrepancy between generator claim and AI actual:
     $$\Delta\% = \frac{\text{Claimed Credits} - \text{Verified Credits}}{\text{Verified Credits}} \times 100$$
     - If $\Delta\% \le 15\%$: Flagged as `LOW RISK` (Green badge).
     - If $\Delta\% > 25\%$: Isolation Forest flags `HIGH RISK: Over-Reporting Claim` (Red badge).
4. **Audit Decision:**
   - **Reject:** Approver enters comments (e.g. *Biomass exceeds biological capacity by 140%*) -> Parcel marked `REJECTED`.
   - **Approve:** Approver accepts verified amount -> Triggers smart contract transaction on `CarbonCreditRegistry.sol`.
   - Emits `CreditIssued` event on-chain, storing token ID, vintage year, and SHA-256 evidence hash.
   - Creates `CarbonCredit` record in database with `status: "ISSUED"`.

---

### Role 3: Buyer (Corporate ESG / Offsetting Buyer)
1. **Marketplace Discovery (`/dashboard/buyer/marketplace`):**
   - Buyer discovers verified, on-chain minted blue carbon credits.
   - Displays key ESG metrics for each credit:
     - Project & Ecosystem (e.g. *Sundarbans Coastal Mangrove*)
     - Vintage year
     - Sylvera Additionality Rating (`AAA`)
     - AI Canopy Coverage & Biomass Density
     - Unit price ($/tCO2e) and available volume.
2. **Tokenized Credit Purchase:**
   - Buyer clicks **"Purchase Credits"**, connecting their Web3 wallet (or utilizing custodial wallet).
   - Smart contract registers custody transfer from Generator to Buyer (`transferCredit`).
   - `Transaction` table logs record (`type: "PURCHASE"`, `status: "COMPLETED"`).
   - `CarbonCredit.status` updates to `"SOLD"`, with `ownerWalletAddress` set to Buyer.
3. **Holdings & Retirement (`/dashboard/buyer/holdings`):**
   - Buyer sees purchased credits in their corporate portfolio.
   - Clicks **"Retire for Net-Zero Compliance"**:
     - Enters corporate retirement purpose (e.g. *FY2026 Scope 1 & 2 ESG Carbon Neutrality*).
     - Smart contract executes `retireCredit()`, permanently burning/locking the token to prevent double-counting.
   - `CarbonCredit.status` permanently marked `"RETIRED"`, with `retiredAt` timestamp.
4. **Verifiable Retirement Certificate:**
   - Generates a permanent public link to `/verify/[tokenId]`.
   - Downloadable certificate displays on-chain Tx hash, retire reason, SHA-256 evidence, and QR code for auditor validation.

---

### Role 4: Admin (Platform Administrator & Super-Auditor)
1. **Comprehensive Dashboard Oversight (`/dashboard/admin/`):**
   - Admin has unrestricted read and write privileges across all entities.
2. **User Management (`/dashboard/admin/users`):**
   - View, activate/deactivate, and switch roles between `GENERATOR`, `APPROVER`, `BUYER`, and `ADMIN`.
3. **All Land Parcels (`/dashboard/admin/parcels`):**
   - Filter parcels by status (`PENDING_REVIEW`, `APPROVED`, `REJECTED`).
   - Override approval decisions or assign parcels to specific approvers.
4. **All Credits & Marketplace Inventory (`/dashboard/admin/credits`):**
   - Monitor total credits issued, sold, held in permanence buffer, and retired.
5. **Blockchain Audit Log (`/dashboard/admin/transactions`):**
   - Live stream of all on-chain transactions (`MINT`, `PURCHASE`, `RETIRE`) with block numbers and gas metrics.
6. **Analytics (`/dashboard/admin/analytics`):**
   - Aggregated sequestered carbon ($tCO_2e$), total mangrove hectares restored, and financial turnover.

---

## 3. Database Schema & State Transitions

```
[LandParcel]
  - id: cuid
  - generatorId: FK (GeneratorProfile)
  - parcelName: String
  - ecosystemType: MANGROVE | SEAGRASS | SALT_MARSH
  - geofence: JSON coordinates
  - totalAreaHa: Float
  - claimedCredits: Float
  - status: DRAFT -> PENDING_REVIEW -> APPROVED / REJECTED
      |
      | 1:N
      v
[CarbonEstimate]
  - id: cuid
  - parcelId: FK
  - source: DRONE | SATELLITE
  - sourceImages: JSON
  - estimatedCredits: Float (from PyTorch UNet)
  - vegetationCoverPct: Float
  - estimatedBiomass: Float
  - confidence: Float
  - deltaPct: Float
  - decision: AUTO_APPROVED | PENDING_REVIEW | AUTO_REJECTED
      |
      | 1:N
      v
[ReviewRequest]
  - id: cuid
  - parcelId: FK
  - estimateId: FK
  - status: PENDING -> APPROVED / REJECTED
  - comments: String?
  - reviewedAt: DateTime?
      |
      | (On Approval)
      v
[CarbonCredit]
  - id: cuid
  - onchainCreditId: String (unique)
  - parcelId: FK
  - amount: Float
  - vintage: Int
  - status: ISSUED -> SOLD -> RETIRED
  - blockchainTxHash: String
  - ownerWalletAddress: String
  - retiredAt: DateTime?
  - retiredReason: String?
      |
      | 1:N
      v
[Transaction]
  - id: cuid
  - type: MINT | PURCHASE | RETIRE
  - creditId: FK
  - parcelId: FK
  - amount: Float
  - txHash: String
  - status: COMPLETED
```

---

## 4. Implementation Deliverables & Execution Plan

| File / Component | Planned Action | Description |
| :--- | :--- | :--- |
| `src/app/dashboard/generator/parcels/page.tsx` | **Implement** | Generator's parcel listing table displaying status, claimed credits, and review updates |
| `src/app/dashboard/generator/parcels/new/page.tsx` | **Implement** | Land registration form (Mangrove area, location, claimed carbon, permits) |
| `src/app/dashboard/review/queue/page.tsx` | **Implement** | Approver review queue showing all pending submissions |
| `src/app/dashboard/review/[id]/page.tsx` | **Implement** | Audit console with drone image upload, PyTorch U-Net inference, delta anomaly check, and Approve/Reject buttons |
| `src/app/dashboard/buyer/marketplace/page.tsx` | **Implement** | Marketplace for buyers to view approved credits and purchase them |
| `src/app/dashboard/buyer/holdings/page.tsx` | **Implement** | Buyer holdings with one-click corporate retirement and certificate generator |
| `src/app/dashboard/admin/**` | **Implement** | Admin console across Users, Parcels, Credits, Transactions, and Analytics |
| `src/components/layout/role-switcher.tsx` | **Implement** | Fast 1-click header role switcher so judges can seamlessly experience all 4 roles in real-time |

---

## 5. Judge Presentation & Demonstration Script

1. **Sign in as Generator:** Register a new mangrove restoration plot (*e.g., Sundarbans Coastal Sector B, 15 ha, 140 tCO2e claim*). Submit and show parcel entering `PENDING_REVIEW`.
2. **Switch to Approver:** Approver opens review queue, selects the parcel, uploads drone imagery, and clicks **Run AI MRV**. Show the PyTorch model extracting canopy cover (31.4%), biomass ($5.2\text{ t/ha}$), and verified credits ($14.2\text{ tCO}_2\text{e}$). Review anomaly risk flag and approve.
3. **Show On-Chain Minting:** Hardhat mints tokenized credit `#104`, recording transaction on Ethereum EVM.
4. **Switch to Buyer:** Buyer opens Marketplace, selects the credit, completes purchase, and retires it with reason: *"Corporate Net-Zero 2026 Target"*.
5. **Open Public Certificate:** Show `/verify/[id]` with tamper-proof SHA-256 evidence, on-chain hash, and retirement certificate.
6. **Switch to Admin:** Show global overview, user management, and transaction ledger.
