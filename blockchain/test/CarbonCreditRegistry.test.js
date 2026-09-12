const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonCreditRegistry", function () {
  let registry;
  let admin, issuer, auditor, buyer, maliciousUser;

  const projectId = ethers.encodeBytes32String("PROJECT-001");
  const claimId = ethers.encodeBytes32String("CLAIM-001");
  const claimIdRejected = ethers.encodeBytes32String("CLAIM-REJECT");
  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("mangrove_satellite_2026.tif"));
  const reportedCO2e = 1200000; // 120.0000 tCO2e (scaled by 1e4)
  const mlEstimatedCO2e = 1257000; // 125.7000 tCO2e
  const verificationScore = 9100; // 91.00%
  const anomalyScore = 800; // 8.00%

  beforeEach(async function () {
    [admin, issuer, auditor, buyer, maliciousUser] = await ethers.getSigners();

    const CarbonCreditRegistry = await ethers.getContractFactory("CarbonCreditRegistry");
    registry = await CarbonCreditRegistry.deploy(admin.address);
    await registry.waitForDeployment();

    // Grant respective roles
    const ISSUER_ROLE = await registry.ISSUER_ROLE();
    const AUDITOR_ROLE = await registry.AUDITOR_ROLE();
    const BUYER_ROLE = await registry.BUYER_ROLE();

    await registry.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
    await registry.connect(admin).grantRole(AUDITOR_ROLE, auditor.address);
    await registry.connect(admin).grantRole(BUYER_ROLE, buyer.address);
  });

  describe("Role and Project Setup", function () {
    it("should allow ISSUER to register a project with evidence hash", async function () {
      await expect(
        registry.connect(issuer).registerProject(
          projectId,
          0, // MANGROVE
          "ipfs://metadata-project-001",
          evidenceHash
        )
      )
        .to.emit(registry, "ProjectRegistered")
        .withArgs(projectId, issuer.address, 0, evidenceHash, "ipfs://metadata-project-001");

      const project = await registry.getProject(projectId);
      expect(project.owner).to.equal(issuer.address);
      expect(project.evidenceHash).to.equal(evidenceHash);
      expect(project.isActive).to.be.true;
    });

    it("should revert if non-issuer attempts to register project", async function () {
      await expect(
        registry.connect(maliciousUser).registerProject(
          projectId,
          0,
          "ipfs://fail",
          evidenceHash
        )
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Claim Lifecycle & Anti-Self-Approval", function () {
    beforeEach(async function () {
      await registry.connect(issuer).registerProject(
        projectId,
        0,
        "ipfs://metadata-project-001",
        evidenceHash
      );
    });

    it("should allow issuer to submit claim and auditor to record ML results", async function () {
      await expect(
        registry.connect(issuer).submitClaim(claimId, projectId, reportedCO2e, evidenceHash)
      )
        .to.emit(registry, "ClaimSubmitted")
        .withArgs(claimId, projectId, issuer.address, reportedCO2e, evidenceHash);

      await expect(
        registry.connect(auditor).recordMLVerification(
          claimId,
          mlEstimatedCO2e,
          verificationScore,
          anomalyScore,
          "LOW"
        )
      )
        .to.emit(registry, "ClaimAnalyzed")
        .withArgs(claimId, mlEstimatedCO2e, verificationScore, anomalyScore, "LOW");

      const claim = await registry.getClaim(claimId);
      expect(claim.status).to.equal(1); // ANALYZED
      expect(claim.mlEstimatedCO2e).to.equal(mlEstimatedCO2e);
    });

    it("should revert if issuer tries to approve their own claim", async function () {
      // Grant auditor role to issuer for test of self-approval check
      const AUDITOR_ROLE = await registry.AUDITOR_ROLE();
      await registry.connect(admin).grantRole(AUDITOR_ROLE, issuer.address);

      await registry.connect(issuer).submitClaim(claimId, projectId, reportedCO2e, evidenceHash);
      await registry.connect(auditor).recordMLVerification(
        claimId,
        mlEstimatedCO2e,
        verificationScore,
        anomalyScore,
        "LOW"
      );

      await expect(registry.connect(issuer).approveClaim(claimId)).to.be.revertedWith(
        "Issuer cannot approve own claim"
      );
    });

    it("should allow auditor to reject a suspicious claim", async function () {
      await registry.connect(issuer).submitClaim(claimIdRejected, projectId, 2500000, evidenceHash);
      await registry.connect(auditor).recordMLVerification(
        claimIdRejected,
        800000,
        2200,
        9100,
        "HIGH"
      );

      await expect(
        registry.connect(auditor).rejectClaim(claimIdRejected, "Over-reporting exceeds biophysical limit")
      )
        .to.emit(registry, "ClaimRejected")
        .withArgs(claimIdRejected, auditor.address, "Over-reporting exceeds biophysical limit");

      const claim = await registry.getClaim(claimIdRejected);
      expect(claim.status).to.equal(4); // REJECTED
      expect(claim.rejectReason).to.equal("Over-reporting exceeds biophysical limit");

      // Cannot issue credits for rejected claim
      await expect(registry.connect(auditor).issueCredits(claimIdRejected)).to.be.revertedWith(
        "Claim is not approved or already issued"
      );
    });
  });

  describe("Credit Issuance, Transfer, and Double-Counting Safeguards", function () {
    let creditId;

    beforeEach(async function () {
      await registry.connect(issuer).registerProject(
        projectId,
        0,
        "ipfs://metadata-project-001",
        evidenceHash
      );
      await registry.connect(issuer).submitClaim(claimId, projectId, reportedCO2e, evidenceHash);
      await registry.connect(auditor).recordMLVerification(
        claimId,
        mlEstimatedCO2e,
        verificationScore,
        anomalyScore,
        "LOW"
      );
      await registry.connect(auditor).approveClaim(claimId);

      const tx = await registry.connect(auditor).issueCredits(claimId);
      const receipt = await tx.wait();
      // Find CreditIssued event
      const event = receipt.logs
        .map((log) => {
          try {
            return registry.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "CreditIssued");

      creditId = event.args.creditId;
    });

    it("should issue credit with unique creditId and correct amount", async function () {
      const credit = await registry.getCredit(creditId);
      expect(credit.currentOwner).to.equal(issuer.address);
      expect(credit.amount).to.equal(reportedCO2e);
      expect(credit.status).to.equal(0); // ACTIVE
    });

    it("INVARIANT: should PREVENT duplicate issuance for the same claim", async function () {
      await expect(registry.connect(auditor).issueCredits(claimId)).to.be.revertedWith(
        "Claim is not approved or already issued"
      );
    });

    it("should transfer active credit from issuer to buyer", async function () {
      await expect(registry.connect(issuer).transferCredit(creditId, buyer.address))
        .to.emit(registry, "CreditTransferred")
        .withArgs(creditId, issuer.address, buyer.address);

      const credit = await registry.getCredit(creditId);
      expect(credit.currentOwner).to.equal(buyer.address);

      const history = await registry.getCreditHistory(creditId);
      expect(history.length).to.equal(2); // MINT + TRANSFER
      expect(history[1].action).to.equal("TRANSFER");
    });

    it("should allow buyer to retire credit with permanent reason", async function () {
      await registry.connect(issuer).transferCredit(creditId, buyer.address);

      await expect(
        registry.connect(buyer).retireCredit(creditId, "Corporate Net-Zero 2026 Commitment")
      )
        .to.emit(registry, "CreditRetired")
        .withArgs(creditId, buyer.address, "Corporate Net-Zero 2026 Commitment");

      const credit = await registry.getCredit(creditId);
      expect(credit.status).to.equal(1); // RETIRED
      expect(credit.retiredReason).to.equal("Corporate Net-Zero 2026 Commitment");
      expect(credit.retiredBy).to.equal(buyer.address);
    });

    it("INVARIANT: should PREVENT double retirement on already-retired credit", async function () {
      await registry.connect(issuer).transferCredit(creditId, buyer.address);
      await registry.connect(buyer).retireCredit(creditId, "First Retirement");

      // Second retirement MUST revert
      await expect(
        registry.connect(buyer).retireCredit(creditId, "Second Attempted Retirement")
      ).to.be.revertedWith("Credit already retired");
    });

    it("INVARIANT: should PREVENT transferring an already-retired credit", async function () {
      await registry.connect(issuer).transferCredit(creditId, buyer.address);
      await registry.connect(buyer).retireCredit(creditId, "Retired for ESG Offset");

      // Attempting to transfer retired credit MUST revert
      await expect(
        registry.connect(buyer).transferCredit(creditId, maliciousUser.address)
      ).to.be.revertedWith("Cannot transfer retired credit");
    });
  });
});
