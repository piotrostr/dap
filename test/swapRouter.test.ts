import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { SwapExamples } from "../typechain";
import SwapExamplesAbi from "../artifacts/contracts/SingleSwapContract.sol/SwapExamples.json";
import { parseEther } from "ethers/lib/utils";

const routerAddressV3 = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const { deployContract } = waffle;

describe("SwapExamples", () => {
  let contract: SwapExamples;
  let owner: SignerWithAddress;
  let weth: any;
  let uni: any;

  before(async () => {
    const signers = await ethers.getSigners();
    owner = signers[0];
    contract = (await deployContract(owner, SwapExamplesAbi, [
      routerAddressV3,
      wethAddress,
    ])) as SwapExamples;
    const hre = require("hardhat");
    weth = await hre.ethers.getVerifiedContractAt(wethAddress);
    uni = await hre.ethers.getVerifiedContractAt(await contract.UNI());
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

      const output = await contract.callStatic.swapExactInputSingle(
        amount,
        weth.address,
        uni.address,
      );
      const swap = await contract.swapExactInputSingle(
        amount,
        weth.address,
        uni.address,
      );
      await swap.wait();
      expect(await uni.balanceOf(owner.address)).to.eq(output);
    });
  });
});
