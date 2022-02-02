import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import DegeneratePartyAbi from "../artifacts/contracts/DegenerateApeParty.sol/DegenerateApeParty.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DegenerateApeParty } from "../typechain";
import { parseEther } from "ethers/lib/utils";

const { deployContract } = waffle;
const routerAddress = "";

describe("DegenerateApeParty - fees", () => {
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let contract: DegenerateApeParty;

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
  });

  describe("adds liquidity", () => {});

  describe("swapping", () => {});

  describe("fees", () => {
    it("owner is excluded from the fees", async () => {});

    it("takes the marketing fees", async () => {});
  });
});
