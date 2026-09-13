// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Minimal interface to read from CarbonCreditRegistry
interface ICarbonCreditRegistry {
    struct Claim {
        bytes32 claimId;
        bytes32 projectId;
        address issuer;
        uint256 reportedCO2e;
        uint256 mlEstimatedCO2e;
        uint256 verificationScore;
        uint256 anomalyScore;
        string riskLevel;
        bytes32 evidenceHash;
        uint8 status;
        uint256 submittedAt;
        uint256 auditedAt;
        address auditor;
        string rejectReason;
    }
    struct Project {
        bytes32 projectId;
        address owner;
        uint8 projectType;
        string metadataURI;
        bytes32 evidenceHash;
        bool isActive;
        uint256 createdAt;
    }
    function getClaim(bytes32 claimId) external view returns (Claim memory);
    function getProject(bytes32 projectId) external view returns (Project memory);
}

interface IProductionCarbonCredit1155 {
    function mintCirculatingAndReserve(
        address recipient,
        address bufferPool,
        uint256 tokenId,
        uint256 circulatingUnits,
        uint256 reserveUnits
    ) external;
}

/**
 * @title AuditorGovernance
 * @dev M-of-N governance for carbon credit issuance.
 */
contract AuditorGovernance is AccessControl, ReentrancyGuard {
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    enum ProposalStatus { PENDING, APPROVED, REJECTED, EXECUTED }

    struct Proposal {
        uint256 id;
        bytes32 claimId;
        bytes32 projectId;
        address recipient;
        uint256 tokenUnits; // Total units to mint (1 unit = 0.001 tCO2e)
        uint256 vintage;
        uint256 approvals;
        uint256 rejections;
        ProposalStatus status;
        uint256 threshold; // M
        uint256 totalAuditorsSnapshot; // N
    }

    ICarbonCreditRegistry public registry;
    IProductionCarbonCredit1155 public tokenContract;
    address public bufferPool;

    uint256 public defaultThreshold = 2;
    uint256 public activeAuditorCount = 0;
    
    uint256 private _nextProposalId = 1;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, bytes32 indexed claimId, uint256 tokenUnits);
    event Voted(uint256 indexed proposalId, address indexed auditor, bool support);
    event ProposalExecuted(uint256 indexed proposalId, bytes32 indexed claimId);
    event ProposalRejected(uint256 indexed proposalId, bytes32 indexed claimId);

    constructor(address _registry) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        registry = ICarbonCreditRegistry(_registry);
    }

    function setContracts(address _token, address _bufferPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        tokenContract = IProductionCarbonCredit1155(_token);
        bufferPool = _bufferPool;
    }

    function addAuditor(address auditor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!hasRole(AUDITOR_ROLE, auditor), "Already auditor");
        _grantRole(AUDITOR_ROLE, auditor);
        activeAuditorCount++;
    }

    function removeAuditor(address auditor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(hasRole(AUDITOR_ROLE, auditor), "Not an auditor");
        revokeRole(AUDITOR_ROLE, auditor);
        activeAuditorCount--;
    }

    function setThreshold(uint256 _threshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_threshold > 0, "Threshold must be > 0");
        defaultThreshold = _threshold;
    }

    function proposeIssuance(
        bytes32 claimId,
        bytes32 projectId,
        address recipient,
        uint256 tokenUnits,
        uint256 vintage
    ) external returns (uint256) {
        require(tokenUnits > 0, "Units must be > 0");
        
        ICarbonCreditRegistry.Claim memory claim = registry.getClaim(claimId);
        require(claim.projectId == projectId, "Project ID mismatch");
        require(claim.status == 1 || claim.status == 0, "Claim not in valid state for new proposal"); // SUBMITTED or ANALYZED

        uint256 pid = _nextProposalId++;
        proposals[pid] = Proposal({
            id: pid,
            claimId: claimId,
            projectId: projectId,
            recipient: recipient,
            tokenUnits: tokenUnits,
            vintage: vintage,
            approvals: 0,
            rejections: 0,
            status: ProposalStatus.PENDING,
            threshold: defaultThreshold,
            totalAuditorsSnapshot: activeAuditorCount > defaultThreshold ? activeAuditorCount : defaultThreshold
        });

        emit ProposalCreated(pid, claimId, tokenUnits);
        return pid;
    }

    function vote(uint256 proposalId, bool support) external nonReentrant {
        require(hasRole(AUDITOR_ROLE, msg.sender), "Must have AUDITOR_ROLE");
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.PENDING, "Proposal not pending");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        // Anti-self-approval check
        ICarbonCreditRegistry.Claim memory claim = registry.getClaim(p.claimId);
        ICarbonCreditRegistry.Project memory project = registry.getProject(p.projectId);
        require(msg.sender != claim.issuer, "Issuer cannot vote on own claim");
        require(msg.sender != project.owner, "Project owner cannot vote on own claim");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            p.approvals++;
        } else {
            p.rejections++;
        }

        emit Voted(proposalId, msg.sender, support);

        // Check rejection threshold
        uint256 rejectionThreshold = p.totalAuditorsSnapshot > p.threshold 
            ? (p.totalAuditorsSnapshot - p.threshold) 
            : 0;
            
        if (p.rejections > rejectionThreshold) {
            p.status = ProposalStatus.REJECTED;
            emit ProposalRejected(proposalId, p.claimId);
        } else if (p.approvals >= p.threshold) {
            _executeProposal(proposalId);
        }
    }

    function _executeProposal(uint256 proposalId) internal {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.PENDING, "Not pending");
        require(p.approvals >= p.threshold, "Threshold not met");

        p.status = ProposalStatus.EXECUTED;

        // Calculate tokenId: (vintage << 64) | uint64(uint256(projectId))
        uint256 tokenId = (p.vintage << 64) | uint64(uint256(p.projectId));

        // 15% reserve buffer accounting
        uint256 reserveUnits = (p.tokenUnits * 15) / 100;
        uint256 circulatingUnits = p.tokenUnits - reserveUnits;

        require(address(tokenContract) != address(0), "Token contract not set");
        require(bufferPool != address(0), "Buffer pool not set");

        tokenContract.mintCirculatingAndReserve(
            p.recipient,
            bufferPool,
            tokenId,
            circulatingUnits,
            reserveUnits
        );

        emit ProposalExecuted(proposalId, p.claimId);
    }
}
