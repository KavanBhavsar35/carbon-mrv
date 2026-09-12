const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, issuer, auditor, buyer] = await hre.ethers.getSigners();
  console.log("Deploying CarbonCreditRegistry with deployer account:", deployer.address);

  const CarbonCreditRegistry = await hre.ethers.getContractFactory("CarbonCreditRegistry");
  const registry = await CarbonCreditRegistry.deploy(deployer.address);
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("CarbonCreditRegistry deployed to:", contractAddress);

  // Grant roles for demo purposes if signers exist
  if (issuer) {
    const ISSUER_ROLE = await registry.ISSUER_ROLE();
    await registry.grantRole(ISSUER_ROLE, issuer.address);
    console.log("Granted ISSUER_ROLE to:", issuer.address);
  }
  if (auditor) {
    const AUDITOR_ROLE = await registry.AUDITOR_ROLE();
    await registry.grantRole(AUDITOR_ROLE, auditor.address);
    console.log("Granted AUDITOR_ROLE to:", auditor.address);
  }
  if (buyer) {
    const BUYER_ROLE = await registry.BUYER_ROLE();
    await registry.grantRole(BUYER_ROLE, buyer.address);
    console.log("Granted BUYER_ROLE to:", buyer.address);
  }

  // Export ABI and address
  const artifact = await hre.artifacts.readArtifact("CarbonCreditRegistry");
  const docsDir = path.join(__dirname, "..", "..", "docs");
  const sharedDir = path.join(__dirname, "..", "..", "shared");

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  if (!fs.existsSync(sharedDir)) fs.mkdirSync(sharedDir, { recursive: true });

  fs.writeFileSync(path.join(docsDir, "contract-abi.json"), JSON.stringify(artifact.abi, null, 2));
  fs.writeFileSync(path.join(docsDir, "deployed-address.txt"), contractAddress);

  // Also save to shared/ for backend and frontend access
  fs.writeFileSync(path.join(sharedDir, "contract-abi.json"), JSON.stringify(artifact.abi, null, 2));
  fs.writeFileSync(path.join(sharedDir, "contract-address.json"), JSON.stringify({
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337
  }, null, 2));

  console.log("Artifacts exported to docs/ and shared/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
