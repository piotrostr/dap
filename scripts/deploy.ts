import { ethers } from "hardhat";
import { DegenerateApeParty } from "../typechain";

async function main() {
  const dap = await ethers.getContractFactory("DegenerateApeParty");
  const contract = (await dap.deploy(
    "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  )) as DegenerateApeParty;
  await contract.deployed();

  console.log("dap deployed to:", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
