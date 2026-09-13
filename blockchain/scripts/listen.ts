import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=================================================================");
  console.log("   STARTING BLOCKCHAIN EVENT LISTENER -> NEXT.JS SYNC BRIDGE");
  console.log("=================================================================");

  const sharedDir = path.join(__dirname, "..", "..", "shared");
  const deploymentPath = path.join(sharedDir, "deployment.json");
  
  let registryAddress, tokenAddress, governanceAddress;
  let registryAbi, tokenAbi, governanceAbi;

  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    registryAddress = deployment.contracts.CarbonCreditRegistry.address;
    tokenAddress = deployment.contracts.ProductionCarbonCredit1155.address;
    governanceAddress = deployment.contracts.AuditorGovernance.address;
    
    registryAbi = JSON.parse(fs.readFileSync(path.join(sharedDir, "contract-abi.json"), "utf8"));
    tokenAbi = JSON.parse(fs.readFileSync(path.join(sharedDir, "token-abi.json"), "utf8"));
    
    // We can fetch governance ABI if we exported it. Since we didn't export governance-abi.json explicitly,
    // wait, we can compile and get it from artifacts directly in this Hardhat environment!
  } else {
    console.error("[ERROR] deployment.json not found.");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  
  const GovernanceFactory = await ethers.getContractFactory("AuditorGovernance");
  const governance = GovernanceFactory.attach(governanceAddress);
  
  const TokenFactory = await ethers.getContractFactory("ProductionCarbonCredit1155");
  const token = TokenFactory.attach(tokenAddress);

  const NEXTJS_SYNC_URL = process.env.NEXTJS_SYNC_URL || "http://localhost:3000/api/carbon-credits/sync";
  console.log(`[*] Event Webhook Target: ${NEXTJS_SYNC_URL}`);

  governance.on("ProposalExecuted", async (proposalId: any, claimId: any, event: any) => {
    console.log(`\n[EVENT: ProposalExecuted] Proposal #${proposalId} for Claim ${claimId}`);
    try {
      const proposal = await governance.proposals(proposalId);
      
      const projectIdBigInt = ethers.toBigInt(proposal.projectId);
      const lower64Bits = projectIdBigInt & ethers.toBigInt("0xFFFFFFFFFFFFFFFF");
      const tokenId = (ethers.toBigInt(proposal.vintage) << ethers.toBigInt(64)) | lower64Bits;
      
      const payload = {
        event: "CreditIssued", // Maintain compatibility with frontend
        creditId: tokenId.toString(),
        claimId: claimId.toString(),
        ownerWallet: proposal.recipient,
        amount: Number(proposal.tokenUnits),
        vintage: Number(proposal.vintage),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      };

      const res = await fetch(NEXTJS_SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      console.log(`[SYNC RESULT] HTTP Status: ${res.status}`);
    } catch (err) {
      console.error("[SYNC ERROR]:", err);
    }
  });

  token.on("RetirementRecorded", async (retirementId: any, tokenId: any, retiredBy: any, beneficiary: any, amountUnits: any, reason: any, event: any) => {
    console.log(`\n[EVENT: RetirementRecorded] Token #${tokenId} retired by ${retiredBy}`);
    try {
      const payload = {
        event: "CreditRetired",
        creditId: tokenId.toString(), // Mapping tokenId to creditId for frontend simplicity
        ownerWallet: retiredBy,
        reason: reason,
        amount: Number(amountUnits),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      };

      const res = await fetch(NEXTJS_SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      console.log(`[SYNC RESULT] HTTP Status: ${res.status}`);
    } catch (err) {
      console.error("[SYNC ERROR]:", err);
    }
  });

  console.log("[*] Standing listener active on Governance & Token. Awaiting transactions...\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
