import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-tracer";
import "hardhat-abi-exporter";
import "hardhat-etherscan-abi";
import "hardhat-change-network";

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
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
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
    hardhat: {
      accounts,
      forking: {
        url: "https://bsc-dataseed.binance.org/",
      },
      chainId: 56,
    },
    bsc: {
      accounts,
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
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
  abiExporter: {
    path: "./artifacts/abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: true,
  },
};

export default config;
