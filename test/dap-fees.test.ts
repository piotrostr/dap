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

const { deployContract } = waffle;

describe("DegenerateApeParty - fees", () => {
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let contract: DegenerateApeParty;
  let router: IPancakeRouter02;
  let factory: IPancakeFactory;
  let pair: IPancakePair;

  const sendDapAndEthToContract = async () => {
    const ethTransferTx = await owner.sendTransaction({
      from: owner.address,
      to: contract.address,
      value: parseEther("100"),
    });
    await ethTransferTx.wait();
    const dapIn = parseEther("50000");
    const dapTransferTx = await contract.transferFrom(
      owner.address,
      contract.address,
      dapIn,
    );
    await dapTransferTx.wait();
  };

  before(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
  });

  beforeEach(async () => {
    const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    contract = (await deployContract(owner, DegeneratePartyAbi, [
      routerAddress,
    ])) as DegenerateApeParty;

    router = (await ethers.getContractAt(
      "IPancakeRouter02",
      await contract.router(),
    )) as IPancakeRouter02;
    factory = (await ethers.getContractAt(
      "IPancakeFactory",
      await contract.factory(),
    )) as IPancakeFactory;

    const approval = await contract.approve(
      owner.address,
      await contract.totalSupply(),
    );
    await approval.wait();

    expect(await contract.allowance(owner.address, owner.address)).to.equal(
      await contract.totalSupply(),
    );
  });

  describe("adds liquidity", () => {});

  describe("swapping", () => {});

  describe("fees", () => {
    it("owner is excluded from the fees", async () => {});

    it("takes the marketing fees", async () => {});
  });
});
