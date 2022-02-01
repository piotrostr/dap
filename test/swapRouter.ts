import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { SingleSwapContract } from "../typechain";

const routerAddressV3 = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

const { deployContract, provider } = waffle;

describe("SingleSwapContract", () => {
  let contract: SingleSwapContract;
  let owner: SignerWithAddress;

  before(async () => {
    const signers = await ethers.getSigners();
    contract = await deployContract(owner);
  });
});
