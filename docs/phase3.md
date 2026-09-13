# Phase 3: Production Ethereum Sepolia Integration

## Architecture

We have migrated to a production-grade multi-contract architecture to support real ERC-1155 tokens, M-of-N governance, and a non-permanence reserve pool.

1. **CarbonCreditRegistry.sol**: 
   Preserved to handle project registration, MRV claim submission, ML automated verification scoring, and claim status management.
   
2. **AuditorGovernance.sol**:
   Introduces M-of-N quorum (default 2-of-3) for manual auditor approvals. Anti-self-approval invariants strictly prohibit issuers from voting on their own claims.
   
3. **ProductionCarbonCredit1155.sol**:
   ERC-1155 token mapping each project/vintage to a unique token ID. Handles fractional/partial retirement, minting circulating vs reserve units, and generates unique retirement records. Note that 1 Token Unit = 0.001 tCO2e (1 kg CO2e) for integer scaling.

4. **CarbonBufferPool.sol**:
   Holds a 15% non-permanence reserve pool that can be burned by authorized oracles in the event of carbon reversal incidents (e.g. forest fires).

## Deployment

### Prerequisites
Populate your `.env` file with real private keys and RPC endpoints:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
DEPLOYER_PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...

SEPOLIA_ISSUER_ADDRESS=0x...
SEPOLIA_AUDITOR_1=0x...
SEPOLIA_AUDITOR_2=0x...
SEPOLIA_AUDITOR_3=0x...
```

### Commands

**Local Testnet (Hardhat)**
```bash
pnpm run deploy:local
```

**Ethereum Sepolia Testnet**
```bash
pnpm run deploy:sepolia
```

This will automatically output the deployment manifest to `shared/deployment.json`, capturing all contract addresses, ABIs, and network parameters.

## Integration

The frontend now reads from `shared/deployment.json` in addition to the legacy `contract-address.json`. Next steps are updating the `carbon-mrv` frontend application to consume the new `deployment.json` and interact with the `ProductionCarbonCredit1155` standard.
