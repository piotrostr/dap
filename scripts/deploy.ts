import { ethers } from "hardhat";
import { DegenerateApeParty } from "../typechain";

async function main() {
  const hre = require("hardhat");
  const dap = await ethers.getContractFactory("DegenerateApeParty");
  const deployer = await hre.ethers.getSigner();
  console.log("signer:", await deployer.getAddress());

  const contract = (await dap.deploy(
    "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  )) as DegenerateApeParty;
  await contract.deployed();

  if (hre?.tenderly) {
    await hre.tenderly.persistArtifacts({
      name: "DegenerateApeParty",
      address: contract.address,
    });
  }

  console.log("deployed to:", contract.address);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
