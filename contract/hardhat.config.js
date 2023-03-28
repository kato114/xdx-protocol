require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("@typechain/hardhat");

const {
  AVALANCHE_API_KEY,
  AVALANCHE_DEPLOY_KEY,
  AVALANCHE_URL,
} = require("./env.json");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.info(account.address);
  }
});
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  defaultNetwork: "avalanche",
  networks: {
    localhost: {
      timeout: 120000,
    },
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    avalanche: {
      url: AVALANCHE_URL,
      chainId: 43113,
      accounts: [AVALANCHE_DEPLOY_KEY],
    },
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: AVALANCHE_API_KEY,
    },
  },
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};
