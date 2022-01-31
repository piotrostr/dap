import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import DegeneratePartyAbi from "../artifacts/contracts/DegenerateApeParty.sol/DegenerateApeParty.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import {
  DegenerateApeParty,
  IUniswapV2Pair,
  IUniswapV2Router02,
  IUniswapV2Factory,
} from "../typechain";
import UniswapV2RouterAbi from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import UniswapV2PairAbi from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
import { formatEther, parseEther } from "ethers/lib/utils";

const { deployContract, provider } = waffle;

describe("DegenerateApeParty", () => {
  let signers: SignerWithAddress[];
  let owner: string;
  let ownerAcc: SignerWithAddress;
  let contract: DegenerateApeParty;
  let router: IUniswapV2Router02;
  let pair: IUniswapV2Pair;
  let factory: IUniswapV2Factory;
  let marketingWallet: string;
  let drinksWallet: string;
  let venueWallet: string;
  let initialDapPrice: BigNumber;

  before(async () => {
    signers = await ethers.getSigners();
    ownerAcc = signers[0];
    owner = await ownerAcc.getAddress();
  });

  beforeEach(async () => {
    contract = (await deployContract(
      ownerAcc,
      DegeneratePartyAbi,
    )) as DegenerateApeParty;

    router = (await deployContract(ownerAcc, UniswapV2RouterAbi, [
      await contract.routerAddress(),
    ])) as IUniswapV2Router02;

    pair = (await deployContract(ownerAcc, UniswapV2PairAbi, [
      await contract.uniswapV2Pair(),
    ])) as IUniswapV2Pair;

    const approveTx = await contract.approve(
      owner,
      await contract.totalSupply(),
    );
    await approveTx.wait();

    const dapIn = parseEther("50000");
    const ethIn = parseEther("5");

    const transferTx = await contract.transferFrom(
      owner,
      contract.address,
      dapIn,
    );
    await transferTx.wait();

    const addLiqTx = await contract.addLiquidity(dapIn, ethIn);
    await addLiqTx.wait();

    initialDapPrice = ethIn.div(dapIn);
    marketingWallet = await signers[1].getAddress();
    venueWallet = await signers[2].getAddress();
    drinksWallet = await signers[3].getAddress();
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

    it("should have total supply of TODO", async () => {
      const total = await contract.totalSupply();
      expect(total).to.equal(null);
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
});
