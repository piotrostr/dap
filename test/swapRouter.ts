import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { SwapExamples } from "../typechain";
import SwapExamplesAbi from "../artifacts/contracts/SingleSwapContract.sol/SwapExamples.json";
import { parseEther } from "ethers/lib/utils";

const routerAddressV3 = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

const { deployContract } = waffle;

describe("SwapExamples", () => {
  let contract: SwapExamples;
  let owner: SignerWithAddress;
  let weth: any;
  let dai: any;

  before(async () => {
    const signers = await ethers.getSigners();
    owner = signers[0];
    contract = (await deployContract(owner, SwapExamplesAbi, [
      routerAddressV3,
    ])) as SwapExamples;
    const hre = require("hardhat");
    weth = await hre.ethers.getVerifiedContractAt(await contract.WETH9());
    dai = await hre.ethers.getVerifiedContractAt(await contract.DAI());
  });

  describe("swaps", () => {
    it("swaps dai for eth", async () => {
      const amount = parseEther("1");
      const wrap = await weth.deposit({
        from: owner.address,
        value: amount,
      });
      await wrap.wait();

      const wethBalance = await weth.balanceOf(owner.address);
      expect(wethBalance.eq(amount));

      const approval = await weth.approve(contract.address, amount);
      await approval.wait();

      const output = await contract.callStatic.swapExactInputSingle(amount);
      const swap = await contract.swapExactInputSingle(amount);
      await swap.wait();
      expect(await dai.balanceOf(owner.address)).to.eq(output);
    });
  });
});
