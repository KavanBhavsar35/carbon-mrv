import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=================================================================");
  console.log("   STARTING BLOCKCHAIN EVENT LISTENER -> NEXT.JS SYNC BRIDGE");
  console.log("=================================================================");

  const sharedDir = path.join(__dirname, "..", "..", "shared");
  const addressFilePath = path.join(sharedDir, "contract-address.json");
  const abiFilePath = path.join(sharedDir, "contract-abi.json");

  if (!fs.existsSync(addressFilePath) || !fs.existsSync(abiFilePath)) {
    console.error("[ERROR] Contract artifacts not found. Please run deploy script first.");
    process.exit(1);
  }

  const { address } = JSON.parse(fs.readFileSync(addressFilePath, "utf8"));
  const abi = JSON.parse(fs.readFileSync(abiFilePath, "utf8"));

  console.log(`[*] Connecting to CarbonCreditRegistry at: ${address}`);
  const [signer] = await ethers.getSigners();
  const registry = new ethers.Contract(address, abi, signer);

  const NEXTJS_SYNC_URL = process.env.NEXTJS_SYNC_URL || "http://localhost:3000/api/carbon-credits/sync";
  console.log(`[*] Event Webhook Target: ${NEXTJS_SYNC_URL}`);

  // Listen to CreditIssued
  registry.on("CreditIssued", async (creditId, claimId, recipient, amount, event) => {
    console.log(`\n[EVENT: CreditIssued] Credit #${creditId} issued to ${recipient} for ${amount} tCO2e`);
    try {
      const payload = {
        event: "CreditIssued",
        creditId: creditId.toString(),
        claimId: claimId.toString(),
        ownerWallet: recipient,
        amount: Number(amount),
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

  // Listen to CreditRetired
  registry.on("CreditRetired", async (creditId, owner, reason, event) => {
    console.log(`\n[EVENT: CreditRetired] Credit #${creditId} retired by ${owner}. Reason: ${reason}`);
    try {
      const payload = {
        event: "CreditRetired",
        creditId: creditId.toString(),
        ownerWallet: owner,
        reason: reason,
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

  console.log("[*] Standing listener active. Awaiting on-chain smart contract transactions...\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
