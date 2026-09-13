require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
require("dotenv").config(); // Optional fallback if they put it in blockchain/
require("@nomicfoundation/hardhat-toolbox");

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
const accounts = deployerKey
  ? [deployerKey.startsWith("0x") ? deployerKey : `0x${deployerKey}`]
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: accounts,
      chainId: 11155111,
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    }
  }
};
