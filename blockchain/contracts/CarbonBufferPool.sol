// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IProductionCarbonCredit1155 {
    function burnBufferReserve(uint256 tokenId, uint256 amountUnits) external;
}

/**
 * @title CarbonBufferPool
 * @dev Manages the 15% non-permanence risk reserve pool.
 */
contract CarbonBufferPool is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant BUFFER_ROLE = keccak256("BUFFER_ROLE");

    IProductionCarbonCredit1155 public tokenContract;

    // Mapping from tokenId to reserve balance
    mapping(uint256 => uint256) public reserveBalance;
    
    // Mapping to prevent duplicate reversal claims
    mapping(bytes32 => bool) public executedReversals;

    event ReserveDeposited(uint256 indexed tokenId, uint256 amountUnits);
    event ReversalBurned(
        uint256 indexed tokenId,
        uint256 lossUnits,
        bytes32 indexed incidentId,
        bytes32 evidenceHash
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setTokenContract(address _tokenContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        tokenContract = IProductionCarbonCredit1155(_tokenContract);
    }

    /**
     * @dev Called by ProductionCarbonCredit1155 (via ERC1155Receiver or directly) to record deposit.
     * We don't implement ERC1155Receiver here as minting directly increases balance, but we
     * track our own internal ledger for extra safety. 
     */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        // Only accept tokens from the authorized token contract
        require(msg.sender == address(tokenContract), "Only authorized token");
        
        reserveBalance[id] += value;
        emit ReserveDeposited(id, value);
        
        return this.onERC1155Received.selector;
    }
    
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4) {
        require(msg.sender == address(tokenContract), "Only authorized token");
        
        for (uint256 i = 0; i < ids.length; i++) {
            reserveBalance[ids[i]] += values[i];
            emit ReserveDeposited(ids[i], values[i]);
        }
        
        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @dev Called by authorized oracle to burn reserve units due to reversal.
     */
    function reportReversal(
        uint256 tokenId,
        uint256 lossUnits,
        bytes32 incidentId,
        bytes32 evidenceHash
    ) external onlyRole(ORACLE_ROLE) nonReentrant {
        require(!executedReversals[incidentId], "Incident already processed");
        require(lossUnits > 0, "Loss must be > 0");
        require(reserveBalance[tokenId] >= lossUnits, "Exceeds reserve balance");

        executedReversals[incidentId] = true;
        reserveBalance[tokenId] -= lossUnits;

        tokenContract.burnBufferReserve(tokenId, lossUnits);

        emit ReversalBurned(tokenId, lossUnits, incidentId, evidenceHash);
    }
}
