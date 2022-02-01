import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import DegeneratePartyAbi from "../artifacts/contracts/DegenerateApeParty.sol/DegenerateApeParty.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import {
  DegenerateApeParty,
  IUniswapV2Router02,
  IUniswapV2Factory,
} from "../typechain";
import { parseEther } from "ethers/lib/utils";

const { deployContract, provider } = waffle;

describe("DegenerateApeParty", () => {
  let signers: SignerWithAddress[];
  let owner: string;
  let ownerAcc: SignerWithAddress;
  let contract: DegenerateApeParty;
  let router: IUniswapV2Router02;
  let factory: IUniswapV2Factory;
  let marketingWallet: string;
  let drinksWallet: string;
  let venueWallet: string;
  let initialDapPrice: BigNumber;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;

  const setupRouter = async () => {
    const ethIn = parseEther("5");
    const ethTransferTx = await ownerAcc.sendTransaction({
      from: owner,
      to: contract.address,
      value: ethIn,
    });
    await ethTransferTx.wait();

    const dapIn = parseEther("50000");
    const dapTransferTx = await contract.transferFrom(
      owner,
      contract.address,
      dapIn,
    );
    await dapTransferTx.wait();

    const addLiqTx = await contract.addLiquidity(dapIn, ethIn);
    await addLiqTx.wait();

    initialDapPrice = ethIn.div(dapIn);
  };

  before(async () => {
    signers = await ethers.getSigners();
    ownerAcc = signers[0];
    bob = signers[5];
    alice = signers[6];
    owner = await ownerAcc.getAddress();
    marketingWallet = await signers[1].getAddress();
    venueWallet = await signers[2].getAddress();
    drinksWallet = await signers[3].getAddress();
  });

  beforeEach(async () => {
    const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    router = await ethers.getContractAt("IUniswapV2Router02", routerAddress);

    const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);

    contract = (await deployContract(ownerAcc, DegeneratePartyAbi, [
      routerAddress,
    ])) as DegenerateApeParty;
    expect(router.address).to.equal(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    );
    const pair = await factory.getPair(contract.address, await contract.WETH());
    expect(pair).not.to.be.null;
    expect(initialDapPrice).not.to.be.null;

    const approveOwnerTx = await contract.approve(
      owner,
      await contract.totalSupply(),
    );
    await approveOwnerTx.wait();

    const approveBobTx = await contract.approve(
      bob.address,
      await contract.totalSupply(),
    );
    await approveBobTx.wait();
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
      expect(contractOwner).to.equal(owner);
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
      const tx = await ownerAcc.sendTransaction({
        from: owner,
        to: contract.address,
        value: txValue,
      });
      await tx.wait();
      expect(await provider.getBalance(contract.address)).to.equal(txValue);
    });

    it("owner should be able to withdraw eth from contract", async () => {
      const txValue = ethers.utils.parseEther("3");
      const tx = await ownerAcc.sendTransaction({
        to: contract.address,
        value: txValue,
      });
      await tx.wait();
      const contractBalance = await provider.getBalance(contract.address);
      expect(contractBalance).to.equal(txValue);

      const initialOwnerBalance = await provider.getBalance(owner);
      const withdrawTx = await contract.withdraw();
      const withdrawReceipt = await withdrawTx.wait();
      const ownerBalance = await provider.getBalance(owner);
      const gas = withdrawReceipt.gasUsed.mul(
        withdrawReceipt.effectiveGasPrice,
      );
      expect(initialOwnerBalance.sub(gas).add(txValue)).to.equal(ownerBalance);
    });
  });

  describe("setting wallets", () => {
    it("sets the marketing wallet properly", async () => {
      await contract.setMarketingWallet(marketingWallet);
      expect(await contract.marketingWallet()).to.equal(marketingWallet);
    });

    it("sets the venue wallet properly", async () => {
      await contract.setVenueWallet(venueWallet);
      expect(await contract.venueWallet()).to.equal(venueWallet);
    });

    it("sets the drinks wallet properly", async () => {
      await contract.setDrinksWallet(drinksWallet);
      expect(await contract.drinksWallet()).to.equal(drinksWallet);
    });
  });

  describe("fees", () => {
    beforeEach(async () => {
      await setupRouter();
    });

    it("takes the marketing fee", async () => {
      const amount = parseEther("2");
      // const feeAmount = amount.mul(19).div(100);
      // const marketingFee = amount.mul(8).div(19);

      const dapTransferTx = await contract.transferFrom(
        owner,
        bob.address,
        amount,
      );
      dapTransferTx.wait();

      const marketingBalance0 = await provider.getBalance(marketingWallet);

      const transferTxRequest = await contract.populateTransaction.transferFrom(
        bob.address,
        alice.address,
        amount,
      );
      // this way of sending tx may not be right, check how to populate and then sign

      const tx = await bob.sendTransaction(transferTxRequest);
      console.log(tx);
      await tx.wait();
      const marketingBalance1 = await provider.getBalance(marketingWallet);
      expect(marketingBalance1.gt(marketingBalance0)).to.be.true;
    });
  });
});
