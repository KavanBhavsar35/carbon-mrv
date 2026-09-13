const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  const networkInfo = await hre.ethers.provider.getNetwork();
  const chainId = Number(networkInfo.chainId);

  console.log(`Starting deployment on network: ${networkName} (Chain ID: ${chainId})`);

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  if (!deployer) {
    throw new Error("No deployer account available. Check DEPLOYER_PRIVATE_KEY in .env");
  }
  console.log("Deploying with deployer account:", deployer.address);

  // 1. Deploy CarbonCreditRegistry
  const CarbonCreditRegistry = await hre.ethers.getContractFactory("CarbonCreditRegistry");
  const registry = await CarbonCreditRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("CarbonCreditRegistry deployed to:", registryAddress);

  // 2. Deploy ProductionCarbonCredit1155
  const Token1155 = await hre.ethers.getContractFactory("ProductionCarbonCredit1155");
  const token = await Token1155.deploy("ipfs://carbon-mrv-metadata/{id}.json");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("ProductionCarbonCredit1155 deployed to:", tokenAddress);

  // 3. Deploy CarbonBufferPool
  const BufferPool = await hre.ethers.getContractFactory("CarbonBufferPool");
  const bufferPool = await BufferPool.deploy();
  await bufferPool.waitForDeployment();
  const bufferPoolAddress = await bufferPool.getAddress();
  console.log("CarbonBufferPool deployed to:", bufferPoolAddress);

  // 4. Deploy AuditorGovernance
  const AuditorGovernance = await hre.ethers.getContractFactory("AuditorGovernance");
  const governance = await AuditorGovernance.deploy(registryAddress);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("AuditorGovernance deployed to:", governanceAddress);

  // 5. Connect Contracts and Setup Roles
  console.log("\nConfiguring cross-contract roles...");
  
  // Governance needs Token and BufferPool
  let tx = await governance.setContracts(tokenAddress, bufferPoolAddress);
  await tx.wait();
  
  // BufferPool needs Token
  tx = await bufferPool.setTokenContract(tokenAddress);
  await tx.wait();

  // Token needs Governance as MINTER and BufferPool as BURNER
  const MINTER_ROLE = await token.MINTER_ROLE();
  const BURNER_ROLE = await token.BURNER_ROLE();
  
  tx = await token.grantRole(MINTER_ROLE, governanceAddress);
  await tx.wait();
  
  tx = await token.grantRole(BURNER_ROLE, bufferPoolAddress);
  await tx.wait();

  // Setup Registry and Governance Auditors
  const ISSUER_ROLE = await registry.ISSUER_ROLE();
  const AUDITOR_ROLE = await governance.AUDITOR_ROLE();
  const BUYER_ROLE = await registry.BUYER_ROLE(); // Legacy, but kept for completeness
  
  // Add deployer as default oracle for demo
  const ORACLE_ROLE = await bufferPool.ORACLE_ROLE();
  tx = await bufferPool.grantRole(ORACLE_ROLE, deployer.address);
  await tx.wait();

  if (networkName === "sepolia") {
    console.log("\nConfiguring Sepolia specific roles...");
    
    // Assign Issuer to Registry
    if (process.env.SEPOLIA_ISSUER_ADDRESS && hre.ethers.isAddress(process.env.SEPOLIA_ISSUER_ADDRESS)) {
      tx = await registry.grantRole(ISSUER_ROLE, process.env.SEPOLIA_ISSUER_ADDRESS);
      await tx.wait();
      console.log("Granted ISSUER_ROLE on Registry to:", process.env.SEPOLIA_ISSUER_ADDRESS);
    }
    
    // Assign 3 Auditors to Governance
    const auditors = [
      process.env.SEPOLIA_AUDITOR_1,
      process.env.SEPOLIA_AUDITOR_2,
      process.env.SEPOLIA_AUDITOR_3
    ];
    
    let addedAuditors = 0;
    for (const aud of auditors) {
      if (aud && hre.ethers.isAddress(aud)) {
        tx = await governance.addAuditor(aud);
        await tx.wait();
        console.log("Granted AUDITOR_ROLE on Governance to:", aud);
        addedAuditors++;
      }
    }
    
    if (addedAuditors === 0) {
      console.log("No SEPOLIA_AUDITOR_* provided. Adding deployer as bootstrap auditor.");
      tx = await governance.addAuditor(deployer.address);
      await tx.wait();
    }
    
    if (process.env.SEPOLIA_BUYER_ADDRESS && hre.ethers.isAddress(process.env.SEPOLIA_BUYER_ADDRESS)) {
      tx = await registry.grantRole(BUYER_ROLE, process.env.SEPOLIA_BUYER_ADDRESS);
      await tx.wait();
      console.log("Granted BUYER_ROLE on Registry to:", process.env.SEPOLIA_BUYER_ADDRESS);
    }
    
  } else {
    console.log("\nConfiguring Localhost/Hardhat specific roles...");
    const [, issuer, auditor1, auditor2, auditor3, buyer] = signers;
    
    if (issuer) {
      tx = await registry.grantRole(ISSUER_ROLE, issuer.address);
      await tx.wait();
      console.log("Granted ISSUER_ROLE to:", issuer.address);
    }
    if (auditor1) {
      tx = await governance.addAuditor(auditor1.address);
      await tx.wait();
      console.log("Granted AUDITOR_ROLE to:", auditor1.address);
    }
    if (auditor2) {
      tx = await governance.addAuditor(auditor2.address);
      await tx.wait();
      console.log("Granted AUDITOR_ROLE to:", auditor2.address);
    }
    if (auditor3) {
      tx = await governance.addAuditor(auditor3.address);
      await tx.wait();
      console.log("Granted AUDITOR_ROLE to:", auditor3.address);
    }
    if (buyer) {
      tx = await registry.grantRole(BUYER_ROLE, buyer.address);
      await tx.wait();
      console.log("Granted BUYER_ROLE to:", buyer.address);
    }
  }

  console.log("\nExporting Artifacts...");
  const docsDir = path.join(__dirname, "..", "..", "docs");
  const sharedDir = path.join(__dirname, "..", "..", "shared");

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  if (!fs.existsSync(sharedDir)) fs.mkdirSync(sharedDir, { recursive: true });

  // ABIs
  const registryArtifact = await hre.artifacts.readArtifact("CarbonCreditRegistry");
  const tokenArtifact = await hre.artifacts.readArtifact("ProductionCarbonCredit1155");
  
  fs.writeFileSync(path.join(docsDir, "contract-abi.json"), JSON.stringify(registryArtifact.abi, null, 2));
  fs.writeFileSync(path.join(sharedDir, "contract-abi.json"), JSON.stringify(registryArtifact.abi, null, 2));
  fs.writeFileSync(path.join(sharedDir, "token-abi.json"), JSON.stringify(tokenArtifact.abi, null, 2));
  
  fs.writeFileSync(path.join(docsDir, "deployed-address.txt"), registryAddress);

  // Backwards compatible address export
  fs.writeFileSync(path.join(sharedDir, "contract-address.json"), JSON.stringify({
    address: registryAddress,
    network: networkName,
    chainId: chainId
  }, null, 2));

  // New Comprehensive Deployment Manifest
  const manifest = {
    network: networkName,
    chainId: chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      CarbonCreditRegistry: {
        address: registryAddress,
        description: "MRV claim & evidence anchoring registry"
      },
      AuditorGovernance: {
        address: governanceAddress,
        description: "2-of-3 independent auditor approval quorum"
      },
      ProductionCarbonCredit1155: {
        address: tokenAddress,
        description: "ERC-1155 carbon credits (1 unit = 0.001 tCO2e)"
      },
      CarbonBufferPool: {
        address: bufferPoolAddress,
        description: "15% non-permanence risk reserve pool"
      }
    },
    parameters: {
      scaleFactor: 1000,
      unitDefinition: "1 unit = 0.001 tCO2e = 1 kg CO2e",
      bufferReservePercent: 15,
      governanceThreshold: 2,
      governanceTotalAuditors: 3
    }
  };

  fs.writeFileSync(path.join(sharedDir, "deployment.json"), JSON.stringify(manifest, null, 2));

  console.log("Artifacts exported to docs/ and shared/");
  console.log("\nDeployment Complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
