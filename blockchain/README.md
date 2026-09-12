# Circular Carbon Blockchain Service

The smart contract layer uses Hardhat and Solidity `0.8.24` to enforce the complete carbon credit lifecycle with role-based access control, cryptographic evidence integrity, and strict double-counting prevention.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npx hardhat test
```
All 11 invariant tests must pass:
- Project registration and evidence hash anchoring
- Claim submission and ML analysis recording
- Auditor approval & rejection
- Issuer anti-self-approval revert
- Credit issuance with unique ID
- Invariant: Duplicate issuance revert
- Credit transfer
- One-way credit retirement
- Invariant: Double retirement revert
- Invariant: Transfer of retired credit revert

### 3. Run Local Node
```bash
npx hardhat node
```
This spins up a local Ethereum node at `http://127.0.0.1:8545` with chain ID `31337`.

### 4. Deploy Contract
In another terminal:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
This deploys `CarbonCreditRegistry.sol`, grants demo roles to accounts, and auto-exports the ABI and address to `docs/contract-abi.json` and `shared/contract-address.json`.
