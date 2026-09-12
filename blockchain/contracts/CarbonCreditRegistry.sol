// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CarbonCreditRegistry
 * @dev Verifiable Carbon Credit & Offset Tracking Smart Contract
 * Enforces role-based permissions, cryptographic evidence anchoring (SHA-256),
 * single-issuance per approved claim, and one-way permanent credit retirement.
 */
contract CarbonCreditRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    enum ProjectType {
        MANGROVE,
        FOREST,
        AGRICULTURE,
        WETLAND,
        OTHER
    }

    enum ClaimStatus {
        SUBMITTED,
        ANALYZED,
        PENDING_AUDIT,
        APPROVED,
        REJECTED,
        ISSUED
    }

    enum CreditStatus {
        ACTIVE,
        RETIRED
    }

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
        uint256 reportedCO2e;    // Scaled by 1e4 (e.g. 120.0000 tCO2e = 1200000)
        uint256 mlEstimatedCO2e; // Scaled by 1e4
        uint256 verificationScore; // Basis points 0 - 10000 (0.00% - 100.00%)
        uint256 anomalyScore;      // Basis points 0 - 10000
        string riskLevel;          // "LOW", "MEDIUM", "HIGH"
        bytes32 evidenceHash;
        ClaimStatus status;
        uint256 submittedAt;
        uint256 auditedAt;
        address auditor;
        string rejectReason;
    }

    struct Credit {
        uint256 creditId;
        bytes32 claimId;
        bytes32 projectId;
        address currentOwner;
        uint256 amount; // Scaled by 1e4
        CreditStatus status;
        uint256 issuedAt;
        uint256 retiredAt;
        string retiredReason;
        address retiredBy;
    }

    struct OwnershipRecord {
        address from;
        address to;
        uint256 timestamp;
        string action; // "MINT", "TRANSFER", "RETIRE"
    }

    // Storage mappings
    mapping(bytes32 => Project) private _projects;
    mapping(bytes32 => bool) private _projectExists;
    bytes32[] private _allProjectIds;

    mapping(bytes32 => Claim) private _claims;
    mapping(bytes32 => bool) private _claimExists;
    bytes32[] private _allClaimIds;

    mapping(uint256 => Credit) private _credits;
    mapping(uint256 => bool) private _creditExists;
    mapping(bytes32 => uint256) public claimToCreditId; // 1-to-1 claim to credit issuance
    uint256 private _nextCreditId = 1001;

    mapping(uint256 => OwnershipRecord[]) private _creditHistory;

    // Events
    event ProjectRegistered(
        bytes32 indexed projectId,
        address indexed owner,
        ProjectType projectType,
        bytes32 evidenceHash,
        string metadataURI
    );

    event ClaimSubmitted(
        bytes32 indexed claimId,
        bytes32 indexed projectId,
        address indexed issuer,
        uint256 reportedCO2e,
        bytes32 evidenceHash
    );

    event ClaimAnalyzed(
        bytes32 indexed claimId,
        uint256 mlEstimatedCO2e,
        uint256 verificationScore,
        uint256 anomalyScore,
        string riskLevel
    );

    event ClaimApproved(bytes32 indexed claimId, address indexed auditor);
    event ClaimRejected(bytes32 indexed claimId, address indexed auditor, string reason);

    event CreditIssued(
        uint256 indexed creditId,
        bytes32 indexed claimId,
        bytes32 indexed projectId,
        address owner,
        uint256 amount
    );

    event CreditTransferred(
        uint256 indexed creditId,
        address indexed from,
        address indexed to
    );

    event CreditRetired(
        uint256 indexed creditId,
        address indexed retiredBy,
        string reason
    );

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ISSUER_ROLE, initialAdmin);
        _grantRole(AUDITOR_ROLE, initialAdmin);
        _grantRole(BUYER_ROLE, initialAdmin);
        _grantRole(REGULATOR_ROLE, initialAdmin);
    }

    // ==================== PROJECT MANAGEMENT ====================

    function registerProject(
        bytes32 projectId,
        ProjectType projectType,
        string calldata metadataURI,
        bytes32 evidenceHash
    ) external onlyRole(ISSUER_ROLE) {
        require(!_projectExists[projectId], "Project already registered");
        require(evidenceHash != bytes32(0), "Evidence hash required");

        _projects[projectId] = Project({
            projectId: projectId,
            owner: msg.sender,
            projectType: projectType,
            metadataURI: metadataURI,
            evidenceHash: evidenceHash,
            isActive: true,
            createdAt: block.timestamp
        });
        _projectExists[projectId] = true;
        _allProjectIds.push(projectId);

        emit ProjectRegistered(projectId, msg.sender, projectType, evidenceHash, metadataURI);
    }

    // ==================== CLAIM WORKFLOW ====================

    function submitClaim(
        bytes32 claimId,
        bytes32 projectId,
        uint256 reportedCO2e,
        bytes32 evidenceHash
    ) external onlyRole(ISSUER_ROLE) {
        require(!_claimExists[claimId], "Claim ID already exists");
        require(_projectExists[projectId], "Project does not exist");
        require(_projects[projectId].isActive, "Project is not active");
        require(reportedCO2e > 0, "Reported CO2e must be positive");
        require(evidenceHash != bytes32(0), "Evidence hash required");

        _claims[claimId] = Claim({
            claimId: claimId,
            projectId: projectId,
            issuer: msg.sender,
            reportedCO2e: reportedCO2e,
            mlEstimatedCO2e: 0,
            verificationScore: 0,
            anomalyScore: 0,
            riskLevel: "UNANALYZED",
            evidenceHash: evidenceHash,
            status: ClaimStatus.SUBMITTED,
            submittedAt: block.timestamp,
            auditedAt: 0,
            auditor: address(0),
            rejectReason: ""
        });
        _claimExists[claimId] = true;
        _allClaimIds.push(claimId);

        emit ClaimSubmitted(claimId, projectId, msg.sender, reportedCO2e, evidenceHash);
    }

    function recordMLVerification(
        bytes32 claimId,
        uint256 mlEstimatedCO2e,
        uint256 verificationScore,
        uint256 anomalyScore,
        string calldata riskLevel
    ) external {
        require(
            hasRole(AUDITOR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller not authorized to record ML results"
        );
        require(_claimExists[claimId], "Claim does not exist");
        Claim storage claim = _claims[claimId];
        require(
            claim.status == ClaimStatus.SUBMITTED || claim.status == ClaimStatus.ANALYZED,
            "Claim status must be SUBMITTED or ANALYZED"
        );

        claim.mlEstimatedCO2e = mlEstimatedCO2e;
        claim.verificationScore = verificationScore;
        claim.anomalyScore = anomalyScore;
        claim.riskLevel = riskLevel;
        claim.status = ClaimStatus.ANALYZED;

        emit ClaimAnalyzed(claimId, mlEstimatedCO2e, verificationScore, anomalyScore, riskLevel);
    }

    function approveClaim(bytes32 claimId) external onlyRole(AUDITOR_ROLE) {
        require(_claimExists[claimId], "Claim does not exist");
        Claim storage claim = _claims[claimId];
        require(
            claim.status == ClaimStatus.ANALYZED || claim.status == ClaimStatus.PENDING_AUDIT,
            "Claim is not ready for audit approval"
        );
        require(msg.sender != claim.issuer, "Issuer cannot approve own claim");

        claim.status = ClaimStatus.APPROVED;
        claim.auditor = msg.sender;
        claim.auditedAt = block.timestamp;

        emit ClaimApproved(claimId, msg.sender);
    }

    function rejectClaim(bytes32 claimId, string calldata reason) external onlyRole(AUDITOR_ROLE) {
        require(_claimExists[claimId], "Claim does not exist");
        Claim storage claim = _claims[claimId];
        require(
            claim.status == ClaimStatus.SUBMITTED ||
            claim.status == ClaimStatus.ANALYZED ||
            claim.status == ClaimStatus.PENDING_AUDIT,
            "Claim cannot be rejected in current state"
        );
        require(msg.sender != claim.issuer, "Issuer cannot reject own claim");

        claim.status = ClaimStatus.REJECTED;
        claim.auditor = msg.sender;
        claim.auditedAt = block.timestamp;
        claim.rejectReason = reason;

        emit ClaimRejected(claimId, msg.sender, reason);
    }

    // ==================== CREDIT LIFECYCLE ====================

    function issueCredits(bytes32 claimId) external nonReentrant returns (uint256) {
        require(
            hasRole(AUDITOR_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller not authorized to issue credits"
        );
        require(_claimExists[claimId], "Claim does not exist");
        Claim storage claim = _claims[claimId];
        require(claim.status == ClaimStatus.APPROVED, "Claim is not approved or already issued");
        require(claimToCreditId[claimId] == 0, "Credit already issued for this claim");

        uint256 creditId = _nextCreditId++;
        uint256 creditAmount = claim.reportedCO2e;

        _credits[creditId] = Credit({
            creditId: creditId,
            claimId: claimId,
            projectId: claim.projectId,
            currentOwner: claim.issuer,
            amount: creditAmount,
            status: CreditStatus.ACTIVE,
            issuedAt: block.timestamp,
            retiredAt: 0,
            retiredReason: "",
            retiredBy: address(0)
        });

        _creditExists[creditId] = true;
        claimToCreditId[claimId] = creditId;
        claim.status = ClaimStatus.ISSUED;

        _creditHistory[creditId].push(OwnershipRecord({
            from: address(0),
            to: claim.issuer,
            timestamp: block.timestamp,
            action: "MINT"
        }));

        emit CreditIssued(creditId, claimId, claim.projectId, claim.issuer, creditAmount);
        return creditId;
    }

    function transferCredit(uint256 creditId, address to) external nonReentrant {
        require(_creditExists[creditId], "Credit does not exist");
        Credit storage credit = _credits[creditId];
        require(credit.currentOwner == msg.sender, "Caller does not own credit");
        require(credit.status != CreditStatus.RETIRED, "Cannot transfer retired credit");
        require(to != address(0), "Invalid recipient address");
        require(to != msg.sender, "Cannot transfer to self");

        address previousOwner = credit.currentOwner;
        credit.currentOwner = to;

        _creditHistory[creditId].push(OwnershipRecord({
            from: previousOwner,
            to: to,
            timestamp: block.timestamp,
            action: "TRANSFER"
        }));

        emit CreditTransferred(creditId, previousOwner, to);
    }

    function retireCredit(uint256 creditId, string calldata reason) external nonReentrant {
        require(_creditExists[creditId], "Credit does not exist");
        Credit storage credit = _credits[creditId];
        require(credit.currentOwner == msg.sender, "Caller does not own credit");
        require(credit.status != CreditStatus.RETIRED, "Credit already retired");
        require(bytes(reason).length > 0, "Retirement reason required");

        credit.status = CreditStatus.RETIRED;
        credit.retiredAt = block.timestamp;
        credit.retiredReason = reason;
        credit.retiredBy = msg.sender;

        _creditHistory[creditId].push(OwnershipRecord({
            from: msg.sender,
            to: address(0),
            timestamp: block.timestamp,
            action: "RETIRE"
        }));

        emit CreditRetired(creditId, msg.sender, reason);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getProject(bytes32 projectId) external view returns (Project memory) {
        require(_projectExists[projectId], "Project does not exist");
        return _projects[projectId];
    }

    function getClaim(bytes32 claimId) external view returns (Claim memory) {
        require(_claimExists[claimId], "Claim does not exist");
        return _claims[claimId];
    }

    function getCredit(uint256 creditId) external view returns (Credit memory) {
        require(_creditExists[creditId], "Credit does not exist");
        return _credits[creditId];
    }

    function getCreditHistory(uint256 creditId) external view returns (OwnershipRecord[] memory) {
        require(_creditExists[creditId], "Credit does not exist");
        return _creditHistory[creditId];
    }

    function getAllProjectIds() external view returns (bytes32[] memory) {
        return _allProjectIds;
    }

    function getAllClaimIds() external view returns (bytes32[] memory) {
        return _allClaimIds;
    }
}
