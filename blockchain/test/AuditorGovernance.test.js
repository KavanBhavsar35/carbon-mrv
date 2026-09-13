const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuditorGovernance", function () {
  let registry, token, bufferPool, governance;
  let admin, issuer, auditor1, auditor2, auditor3, user;
  
  beforeEach(async function () {
    [admin, issuer, auditor1, auditor2, auditor3, user] = await ethers.getSigners();
    
    // Registry
    const Registry = await ethers.getContractFactory("CarbonCreditRegistry");
    registry = await Registry.deploy(admin.address);
    await registry.waitForDeployment();
    
    // Token
    const Token = await ethers.getContractFactory("ProductionCarbonCredit1155");
    token = await Token.deploy("ipfs://metadata/{id}.json");
    await token.waitForDeployment();
    
    // BufferPool
    const BufferPool = await ethers.getContractFactory("CarbonBufferPool");
    bufferPool = await BufferPool.deploy();
    await bufferPool.waitForDeployment();
    
    // Governance
    const Governance = await ethers.getContractFactory("AuditorGovernance");
    governance = await Governance.deploy(await registry.getAddress());
    await governance.waitForDeployment();
    
    await governance.setContracts(await token.getAddress(), await bufferPool.getAddress());
    
    // Connect contracts
    await bufferPool.setTokenContract(await token.getAddress());
    await token.grantRole(await token.MINTER_ROLE(), await governance.getAddress());
    
    // Roles
    await registry.grantRole(await registry.ISSUER_ROLE(), issuer.address);
    await registry.grantRole(await registry.AUDITOR_ROLE(), auditor1.address); // For legacy ML recording
    
    await governance.addAuditor(auditor1.address);
    await governance.addAuditor(auditor2.address);
    await governance.addAuditor(auditor3.address);
  });
  
  it("should enforce 2-of-3 multisig for credit issuance", async function () {
    // 1. Submit claim in registry
    const projectId = ethers.id("project_1");
    await registry.connect(issuer).registerProject(projectId, 0, "ipfs://meta", ethers.id("evidence_1"));
    
    const claimId = ethers.id("claim_1");
    await registry.connect(issuer).submitClaim(claimId, projectId, 10000, ethers.id("evidence_2"));
    
    // Need to record ML verification before proposing
    await registry.connect(auditor1).recordMLVerification(claimId, 10000, 9500, 500, "LOW");
    
    // 2. Propose issuance
    await governance.connect(auditor1).proposeIssuance(claimId, projectId, user.address, 10000, 2024);
    
    // 3. Vote 1
    await governance.connect(auditor1).vote(1, true);
    
    // 4. Vote 2
    await governance.connect(auditor2).vote(1, true);
    
    // Should be executed
    const proposal = await governance.proposals(1);
    expect(proposal.status).to.equal(3); // EXECUTED
    
    // 5. Check Token Balances
    const projectIdBigInt = ethers.toBigInt(projectId);
    const lower64Bits = projectIdBigInt & ethers.toBigInt("0xFFFFFFFFFFFFFFFF");
    const tokenId = (ethers.toBigInt(2024) << ethers.toBigInt(64)) | lower64Bits;
    
    const circulating = await token.balanceOf(user.address, tokenId);
    const reserve = await token.balanceOf(await bufferPool.getAddress(), tokenId);
    
    expect(circulating).to.equal(8500);
    expect(reserve).to.equal(1500);
  });
  
  it("should prevent issuer from voting on their own claim", async function () {
    // If issuer is also an auditor
    await governance.addAuditor(issuer.address);
    
    const projectId = ethers.id("project_2");
    await registry.connect(issuer).registerProject(projectId, 0, "ipfs://meta", ethers.id("evidence_1"));
    const claimId = ethers.id("claim_2");
    await registry.connect(issuer).submitClaim(claimId, projectId, 10000, ethers.id("evidence_2"));
    
    await governance.connect(auditor1).proposeIssuance(claimId, projectId, user.address, 10000, 2024);
    
    await expect(governance.connect(issuer).vote(1, true))
      .to.be.revertedWith("Issuer cannot vote on own claim");
  });
});
