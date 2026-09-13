// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProductionCarbonCredit1155
 * @dev ERC-1155 token representing verified carbon credits.
 * 1 token unit = 0.001 tCO2e = 1 kg CO2e.
 */
contract ProductionCarbonCredit1155 is ERC1155, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    struct RetirementRecord {
        bytes32 retirementId;
        uint256 tokenId;
        address retiredBy;
        address beneficiary;
        uint256 amountUnits;
        uint256 timestamp;
        bytes32 evidenceHash;
        string reason;
    }

    // Mapping from retirementId to RetirementRecord
    mapping(bytes32 => RetirementRecord) public retirements;
    
    // Mapping from tokenId to total supply
    mapping(uint256 => uint256) public totalSupply;

    // Nonce for retirement ID generation per user
    mapping(address => uint256) public retirementNonces;

    event RetirementRecorded(
        bytes32 indexed retirementId,
        uint256 indexed tokenId,
        address indexed retiredBy,
        address beneficiary,
        uint256 amountUnits,
        string reason
    );

    constructor(string memory uri_) ERC1155(uri_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Called by AuditorGovernance to mint circulating and reserve units.
     */
    function mintCirculatingAndReserve(
        address recipient,
        address bufferPool,
        uint256 tokenId,
        uint256 circulatingUnits,
        uint256 reserveUnits
    ) external onlyRole(MINTER_ROLE) {
        if (circulatingUnits > 0) {
            _mint(recipient, tokenId, circulatingUnits, "");
            totalSupply[tokenId] += circulatingUnits;
        }
        if (reserveUnits > 0) {
            _mint(bufferPool, tokenId, reserveUnits, "");
            totalSupply[tokenId] += reserveUnits;
        }
    }

    /**
     * @dev Called by CarbonBufferPool to burn reserve units for reversal events.
     */
    function burnBufferReserve(uint256 tokenId, uint256 amountUnits) external onlyRole(BURNER_ROLE) {
        _burn(msg.sender, tokenId, amountUnits);
        totalSupply[tokenId] -= amountUnits;
    }

    /**
     * @dev Retire tokens by permanently burning them.
     */
    function retire(
        uint256 tokenId,
        uint256 amountUnits,
        address beneficiary,
        string calldata reason,
        bytes32 evidenceHash
    ) external nonReentrant returns (bytes32) {
        require(amountUnits > 0, "Amount must be > 0");
        require(balanceOf(msg.sender, tokenId) >= amountUnits, "Insufficient balance");

        // Burn the tokens
        _burn(msg.sender, tokenId, amountUnits);
        totalSupply[tokenId] -= amountUnits;

        // Generate unique retirement ID
        uint256 nonce = retirementNonces[msg.sender]++;
        bytes32 retirementId = keccak256(
            abi.encodePacked(tokenId, msg.sender, amountUnits, block.timestamp, nonce)
        );

        retirements[retirementId] = RetirementRecord({
            retirementId: retirementId,
            tokenId: tokenId,
            retiredBy: msg.sender,
            beneficiary: beneficiary,
            amountUnits: amountUnits,
            timestamp: block.timestamp,
            evidenceHash: evidenceHash,
            reason: reason
        });

        emit RetirementRecorded(
            retirementId,
            tokenId,
            msg.sender,
            beneficiary,
            amountUnits,
            reason
        );

        return retirementId;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
