import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import DegeneratePartyAbi from "../artifacts/contracts/DegenerateApeParty.sol/DegenerateApeParty.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DegenerateApeParty,
  IPancakeRouter02,
  IPancakePair,
  IPancakeFactory,
} from "../typechain";
import { parseEther } from "ethers/lib/utils";

const { deployContract, provider } = waffle;

describe("DegenerateApeParty - fees", () => {
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let contract: DegenerateApeParty;
  let router: IPancakeRouter02;
  let factory: IPancakeFactory;
  let pair: IPancakePair;

  before(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
  });

  beforeEach(async () => {
    const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    contract = (await deployContract(owner, DegeneratePartyAbi, [
      routerAddress,
    ])) as DegenerateApeParty;

    const approval = await contract.approve(
      owner.address,
      await contract.totalSupply(),
    );
    await approval.wait();

    expect(await contract.allowance(owner.address, owner.address)).to.equal(
      await contract.totalSupply(),
    );
    router = (await ethers.getContractAt(
      "IPancakeRouter02",
      await contract.router(),
    )) as IPancakeRouter02;
    factory = (await ethers.getContractAt(
      "IPancakeFactory",
      await contract.factory(),
    )) as IPancakeFactory;
    pair = (await ethers.getContractAt(
      "IPancakePair",
      await contract.pair(),
    )) as IPancakePair;
    expect(router.address).not.to.be.null;
    expect(factory.address).not.to.be.null;
    expect(pair.address).not.to.be.null;
    const ethBalance0 = await provider.getBalance(contract.address);
    const dapBalance0 = await contract.balanceOf(contract.address);
    const ethIn = parseEther("50.01");
    const ethTransferTx = await owner.sendTransaction({
      from: owner.address,
      to: contract.address,
      value: ethIn,
    });
    await ethTransferTx.wait();
    const dapIn = parseEther("600000");
    const dapTransferTx = await contract.transferFrom(
      owner.address,
      contract.address,
      dapIn,
    );
    await dapTransferTx.wait();
    expect(await contract.balanceOf(contract.address)).to.equal(
      dapBalance0.add(dapIn),
    );
    expect(await provider.getBalance(contract.address)).to.equal(
      ethBalance0.add(ethIn),
    );
  });

  describe("pancake functionality", () => {
    beforeEach(async () => {});

    it("adds liquidity to pair DAP/ETH right", async () => {
      const dapIn = parseEther("50000");
      const ethIn = parseEther("50");
      expect((await contract.balanceOf(contract.address)).gte(dapIn));
      expect((await provider.getBalance(contract.address)).gte(ethIn));
      const liqTx = await contract.addLiquidity(dapIn, ethIn);
      await liqTx.wait();
      const reserves = await pair.callStatic.getReserves();
      const { reserve0, reserve1 } = reserves;
      expect(reserve0.eq(dapIn));
      expect(reserve1.eq(ethIn));
    });

    it("swaps DAP for ETH", () => {});
  });

  describe("fees", () => {
    it("owner is excluded from the fees", async () => {});

    it("takes the marketing fees", async () => {});
  });
});
