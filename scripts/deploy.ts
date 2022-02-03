import { ethers } from "hardhat";
import { DegenerateApeParty } from "../typechain";

async function main() {
  const hre = require("hardhat");
  const dap = await ethers.getContractFactory("DegenerateApeParty");

  const contract = (await dap.deploy(
    "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  )) as DegenerateApeParty;
  await contract.deployed();

  await hre.tenderly.persistArtifacts({
    name: "DegenerateApeParty",
    address: contract.address,
  });

  console.log("dap deployed to:", contract.address);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
