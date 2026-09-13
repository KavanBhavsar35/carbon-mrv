const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonBufferPool", function () {
  let token, bufferPool, minter, oracle, user;
  
  beforeEach(async function () {
    [admin, minter, oracle, user] = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory("ProductionCarbonCredit1155");
    token = await Token.deploy("ipfs://metadata/{id}.json");
    await token.waitForDeployment();
    
    const BufferPool = await ethers.getContractFactory("CarbonBufferPool");
    bufferPool = await BufferPool.deploy();
    await bufferPool.waitForDeployment();
    
    await bufferPool.setTokenContract(await token.getAddress());
    
    const MINTER_ROLE = await token.MINTER_ROLE();
    const BURNER_ROLE = await token.BURNER_ROLE();
    await token.grantRole(MINTER_ROLE, minter.address);
    await token.grantRole(BURNER_ROLE, await bufferPool.getAddress());
    
    const ORACLE_ROLE = await bufferPool.ORACLE_ROLE();
    await bufferPool.grantRole(ORACLE_ROLE, oracle.address);
  });
  
  it("should record deposits and track reserve balance", async function () {
    const tokenId = 1001;
    await token.connect(minter).mintCirculatingAndReserve(user.address, await bufferPool.getAddress(), tokenId, 8500, 1500);
    
    expect(await token.balanceOf(await bufferPool.getAddress(), tokenId)).to.equal(1500);
    // Since mint doesn't use safeTransfer, the bufferPool's onERC1155Received wasn't called.
    // Wait, _mint calls _update which calls _doSafeTransferAcceptanceCheck!
    // So onERC1155Received WAS called! Let's check reserveBalance
    expect(await bufferPool.reserveBalance(tokenId)).to.equal(1500);
  });
  
  it("should allow ORACLE to report reversal and burn buffer tokens", async function () {
    const tokenId = 1001;
    await token.connect(minter).mintCirculatingAndReserve(user.address, await bufferPool.getAddress(), tokenId, 8500, 1500);
    
    const incidentId = ethers.id("fire_incident_001");
    await bufferPool.connect(oracle).reportReversal(tokenId, 500, incidentId, ethers.ZeroHash);
    
    expect(await token.balanceOf(await bufferPool.getAddress(), tokenId)).to.equal(1000);
    expect(await bufferPool.reserveBalance(tokenId)).to.equal(1000);
    expect(await token.totalSupply(tokenId)).to.equal(9500);
  });
});
