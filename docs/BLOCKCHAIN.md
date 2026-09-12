# Blockchain Smart Contract Architecture (`CarbonCreditRegistry.sol`)

## 1. Overview
The `CarbonCreditRegistry` contract enforces strict immutability, role-based authorization, single-issuance, and one-way retirement for carbon credits.

## 2. Roles
- **DEFAULT_ADMIN_ROLE**: Deploys the contract, grants and revokes roles.
- **ISSUER_ROLE**: Registers restoration projects, uploads off-chain evidence hashes, and submits carbon claims. Cannot approve their own claims.
- **AUDITOR_ROLE**: Reviews off-chain ML verification scores and biophysical evidence, records ML verification results on-chain, and executes formal `approveClaim()` or `rejectClaim()`.
- **BUYER_ROLE**: Holds issued credits, receives credit transfers, and executes final `retireCredit()`.
- **REGULATOR_ROLE**: Audits on-chain transaction history, project registry, evidence hashes, and event logs.

## 3. Data Structures
```solidity
enum ProjectType { MANGROVE, FOREST, AGRICULTURE, WETLAND, OTHER }
enum ClaimStatus { SUBMITTED, ANALYZED, APPROVED, REJECTED, ISSUED }
enum CreditStatus { ACTIVE, RETIRED }

struct Project {
    bytes32 projectId;
    address owner;
    ProjectType projectType;
    string metadataURI;
    bytes32 evidenceHash; // SHA-256 of primary remote sensing evidence
    bool isActive;
    uint256 createdAt;
}

struct Claim {
    bytes32 claimId;
    bytes32 projectId;
    address issuer;
    uint256 reportedCO2e;    // scaled by 1e4 (e.g., 120.0000 = 1200000)
    uint256 mlEstimatedCO2e; // scaled by 1e4
    uint256 verificationScore; // 0 to 10000 (0.00% to 100.00%)
    uint256 anomalyScore;      // 0 to 10000
    string riskLevel;          // "LOW", "MEDIUM", "HIGH"
    bytes32 evidenceHash;
    ClaimStatus status;
    uint256 submittedAt;
    uint256 auditedAt;
    address auditor;
}

struct Credit {
    uint256 creditId;
    bytes32 claimId;
    bytes32 projectId;
    address currentOwner;
    uint256 amount;            // tCO2e (scaled 1e4)
    CreditStatus status;
    uint256 issuedAt;
    uint256 retiredAt;
    string retirementReason;
    address retiredBy;
}
```

## 4. Key Invariants & Double-Counting Safeguards
1. **Single Issuance**: A claim can only be issued once (`status == ClaimStatus.APPROVED`). When `issueCredits()` succeeds, the claim status changes to `ClaimStatus.ISSUED`. Calling it again reverts with `ClaimNotApprovedOrAlreadyIssued`.
2. **Double-Retirement Prevention**: When `retireCredit()` is invoked, the credit status changes to `CreditStatus.RETIRED`. Any subsequent call to `retireCredit()` on the same `creditId` reverts with `CreditAlreadyRetired`.
3. **Transfer of Retired Credit Prevention**: Calling `transferCredit()` on a credit with `CreditStatus.RETIRED` reverts with `CannotTransferRetiredCredit`.
4. **Anti-Self-Approval**: An issuer cannot approve their own claim; `approveClaim()` requires `msg.sender != claim.issuer`.
5. **Role Gating**: Only authorized accounts can perform state transitions.
