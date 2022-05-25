import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-tracer";
import "hardhat-abi-exporter";
import "hardhat-etherscan-abi";
import "hardhat-change-network";
// import "@tenderly/hardhat-tenderly";

import { task } from "hardhat/config";

require("solidity-coverage");

dotenv.config();

task("accounts", "lists accounts", async (_, { ethers }) => {
  const signers = await ethers.getSigners();
  for (let signer of signers) {
    console.log(signer.address);
  }
});

const accounts = { mnemonic: process.env.MNEMONIC || "" };

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.13",
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
    local: {
      accounts,
      url: "http://127.0.0.1:8545",
      forking: {
        url: "https://bsc-dataseed.binance.org/",
      },
    },
    hardhat: {
      forking: {
        url: `https://speedy-nodes-nyc.moralis.io/${process.env.MORALIS_KEY}/bsc/mainnet/archive`,
        blockNumber: 14944129,
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
    path: "./abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: true,
  },
};

export default config;
