import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { DegenerateApeParty } from "../typechain";

const { provider } = waffle;

describe("DegenerateApeParty - base", () => {
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let contract: DegenerateApeParty;
  let marketingWallet: string;
  let partyWallet: string;

  before(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    marketingWallet = await signers[1].getAddress();
    partyWallet = await signers[2].getAddress();
  });

  beforeEach(async () => {
    const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
    const dap = await ethers.getContractFactory("DegenerateApeParty");
    contract = (await dap.deploy(routerAddress)) as DegenerateApeParty;
  });

  describe("constants", () => {
    it(`should have a name of "DegenerateApeParty"`, async () => {
      const name = await contract.name();
      expect(name).to.equal("DegenerateApeParty");
    });

    it(`should have a symbol of "DAP"`, async () => {
      const symbol = await contract.symbol();
      expect(symbol).to.equal("DAP");
    });

    it("should have total supply of one million", async () => {
      const oneMillion = BigNumber.from(10).pow(
        6 + (await contract.decimals()),
      );
      expect(await contract.totalSupply()).to.equal(oneMillion);
    });
  });

  describe("ownership", () => {
    it("only owner can transfer ownership", async () => {
      const newOwner = signers[1].address;
      await expect(
        contract.transferOwnership(newOwner, { from: signers[2].address }),
      ).to.be.reverted;
    });

    it("should be able to transfer ownership", async () => {
      let contractOwner: string;
      contractOwner = await contract.owner();
      expect(contractOwner).to.equal(owner.address);
      const newOwner = signers[1].address;
      const changeOwnershipTx = await contract.transferOwnership(newOwner);
      await changeOwnershipTx.wait();
      contractOwner = await contract.owner();
      expect(contractOwner).to.equal(newOwner);
    });
  });

  describe("payable", () => {
    it("contract should be able to receive eth", async () => {
      const txValue = ethers.utils.parseEther("3");
      const tx = await owner.sendTransaction({
        from: owner.address,
        to: contract.address,
        value: txValue,
      });
      await tx.wait();
      expect(await provider.getBalance(contract.address)).to.equal(txValue);
    });

    it("owner should be able to withdraw eth from contract", async () => {
      const txValue = ethers.utils.parseEther("3");
      const tx = await owner.sendTransaction({
        to: contract.address,
        value: txValue,
      });
      await tx.wait();
      const contractBalance = await provider.getBalance(contract.address);
      expect(contractBalance).to.equal(txValue);

      const initialOwnerBalance = await provider.getBalance(owner.address);
      const withdrawTx = await contract.withdraw();
      const withdrawReceipt = await withdrawTx.wait();
      const ownerBalance = await provider.getBalance(owner.address);
      const gas = withdrawReceipt.gasUsed.mul(
        withdrawReceipt.effectiveGasPrice,
      );
      expect(initialOwnerBalance.sub(gas).add(txValue)).to.equal(ownerBalance);
    });
  });

  describe("setting wallets", () => {
    it("sets the marketing wallet properly", async () => {
      const set = await contract.setMarketingWallet(marketingWallet);
      await set.wait();
      expect(await contract.marketingWallet()).to.equal(marketingWallet);
    });

    it("sets the party wallet properly", async () => {
      const set = await contract.setPartyWallet(partyWallet);
      await set.wait();
      expect(await contract.partyWallet()).to.equal(partyWallet);
    });
  });
});
