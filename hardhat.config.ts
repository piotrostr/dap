import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import { task } from "hardhat/config";

dotenv.config();

task("accounts", "lists accounts", async (_, { ethers }) => {
  const signers = await ethers.getSigners();
  for (let signer of signers) {
    console.log(signer.address);
  }
});

const accounts = { mnemonic: process?.env?.MNEMONIC };

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  typechain: {
    outDir: "./typechain",
    target: "ethers-v5",
  },
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts,
    },
    rinkeby: {
      accounts,
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 4,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    src: "./contracts",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY,
  },
};

export default config;
