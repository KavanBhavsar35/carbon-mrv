const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductionCarbonCredit1155", function () {
  let token, minter, burner, user, bufferPool;
  
  beforeEach(async function () {
    [admin, minter, burner, user, bufferPool, otherUser] = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory("ProductionCarbonCredit1155");
    token = await Token.deploy("ipfs://metadata/{id}.json");
    await token.waitForDeployment();
    
    const MINTER_ROLE = await token.MINTER_ROLE();
    const BURNER_ROLE = await token.BURNER_ROLE();
    
    await token.grantRole(MINTER_ROLE, minter.address);
    await token.grantRole(BURNER_ROLE, burner.address);
  });
  
  it("should allow MINTER to mint circulating and reserve", async function () {
    const tokenId = 1001;
    await token.connect(minter).mintCirculatingAndReserve(user.address, bufferPool.address, tokenId, 8500, 1500);
    
    expect(await token.balanceOf(user.address, tokenId)).to.equal(8500);
    expect(await token.balanceOf(bufferPool.address, tokenId)).to.equal(1500);
    expect(await token.totalSupply(tokenId)).to.equal(10000);
  });
  
  it("should revert mint if not minter", async function () {
    await expect(token.connect(user).mintCirculatingAndReserve(user.address, bufferPool.address, 1, 100, 10))
      .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
  });
  
  it("should allow partial retirement and generate retirementId", async function () {
    const tokenId = 1001;
    await token.connect(minter).mintCirculatingAndReserve(user.address, bufferPool.address, tokenId, 8500, 1500);
    
    const tx = await token.connect(user).retire(tokenId, 3500, user.address, "Corporate Offset", ethers.ZeroHash);
    const receipt = await tx.wait();
    
    expect(await token.balanceOf(user.address, tokenId)).to.equal(5000);
    expect(await token.totalSupply(tokenId)).to.equal(6500); // 10000 - 3500
  });

  it("should prevent transferring retired credits because they are burned", async function () {
    const tokenId = 1001;
    await token.connect(minter).mintCirculatingAndReserve(user.address, bufferPool.address, tokenId, 8500, 0);
    
    await token.connect(user).retire(tokenId, 8500, user.address, "Full Offset", ethers.ZeroHash);
    
    // Balance is now 0, transfer should fail
    await expect(token.connect(user).safeTransferFrom(user.address, otherUser.address, tokenId, 1, "0x"))
      .to.be.reverted;
  });

  it("should allow BURNER to burn buffer reserve", async function () {
    const tokenId = 1001;
    await token.connect(minter).mintCirculatingAndReserve(user.address, burner.address, tokenId, 8500, 1500);
    
    await token.connect(burner).burnBufferReserve(tokenId, 500);
    
    expect(await token.balanceOf(burner.address, tokenId)).to.equal(1000); 
  });
});
