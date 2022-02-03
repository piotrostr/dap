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
import { BigNumber } from "ethers";

const { deployContract, provider } = waffle;

describe("DegenerateApeParty - fees", () => {
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let contract: DegenerateApeParty;
  let router: IPancakeRouter02;
  let factory: IPancakeFactory;
  let pair: IPancakePair;

  const addLiquidity = async () => {
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
    await addLiquidity();
  });

  /**
   * to pass below, change the visibilitiy of the
   * methods addLiquidity and swapDapForEth in DAP contract (those work)
   **
   * describe("pancake functionality", () => {
   *
   *   it("adds liquidity to pair DAP/ETH right", async () => {
   *     await addLiquidity();
   *   });
   *
   *   it("swaps DAP for ETH", async () => {
   *     await addLiquidity();
   *     const tx = await contract.swapDapForEth(parseEther("5000"));
   *     await tx.wait();
   *   });
   * });
   */

  describe("fees", () => {
    let marketingWallet: string;
    let partyWallet: string;

    const setAndGetWallets = async () => {
      const txs = await Promise.all([
        contract.setMarketingWallet(signers[6].address),
        contract.setPartyWallet(signers[7].address),
      ]);
      await Promise.all(txs.map(tx => tx.wait()));
      return await Promise.all([
        contract.marketingWallet(),
        contract.partyWallet(),
      ]);
    };

    const checkIfTakesRightFee = async (
      wallet: string,
      feeAmount: BigNumber,
    ) => {
      const bob = signers[2];
      const alice = signers[3];
      const balance0 = await provider.getBalance(wallet);
      const transferAmount = parseEther("50000");
      const giveToBob = await contract.transferFrom(
        owner.address,
        bob.address,
        transferAmount,
      );
      await giveToBob.wait();
      contract = contract.connect(bob);
      const approval = await contract.approve(bob.address, transferAmount);
      await approval.wait();
      expect(await contract.allowance(bob.address, bob.address)).to.eq(
        transferAmount,
      );
      const tx = await contract.transferFrom(
        bob.address,
        alice.address,
        transferAmount,
      );
      await tx.wait();
      const balance1 = await provider.getBalance(wallet);
      expect(balance1.eq(balance0.add(transferAmount.mul(feeAmount))));
    };

    beforeEach(async () => {
      [marketingWallet, venueWallet, drinksWallet] = await setAndGetWallets();
    });

    it("owner is excluded from the fees", async () => {
      const marketingBalance0 = await provider.getBalance(marketingWallet);
      const tx = await contract.transferFrom(
        owner.address,
        signers[2].address,
        parseEther("5000"),
      );
      await tx.wait();
      const marketingBalance1 = await provider.getBalance(marketingWallet);
      expect(marketingBalance1.eq(marketingBalance0));
    });

    it("takes the 8% marketing fee", async () => {
      const feeAmount = BigNumber.from("8").mul(BigNumber.from("100"));
      await checkIfTakesRightFee(marketingWallet, feeAmount);
    });

    it("takes the 10% party fee", async () => {
      const feeAmount = BigNumber.from("10").div(BigNumber.from("100"));
      await checkIfTakesRightFee(partyWallet, feeAmount);
    });

    it("takes the 2% autoliquidity fee and adds liquidity", async () => {
      const bob = signers[2];
      const alice = signers[3];
      const transferAmount = parseEther("5000");
      const giveToBob = await contract.transferFrom(
        owner.address,
        bob.address,
        transferAmount,
      );
      await giveToBob.wait();
      contract = contract.connect(bob);
      const approval = await contract.approve(bob.address, transferAmount);
      await approval.wait();
      expect(await contract.allowance(bob.address, bob.address)).to.eq(
        transferAmount,
      );
      await expect(
        contract.transferFrom(bob.address, alice.address, transferAmount),
      ).to.emit(contract, "AddedLiquidity");
    });

    describe("elevated fees", () => {
      it("allows to set elevated fees of 99% to prevent botting", async () => {
        const elevatedFees0 = await contract.elevatedFees();
        expect(elevatedFees0).to.be.false;
        const elevate = await contract.toggleFees();
        await elevate.wait();
        const elevatedFees1 = await contract.elevatedFees();
        expect(elevatedFees1).to.be.true;
      });

      it("takes the 99% elevated fee (to marketing wallet) if it is toggled", async () => {
        const elevate = await contract.toggleFees();
        await elevate.wait();
        const elevatedFees = await contract.elevatedFees();
        expect(elevatedFees).to.be.true;
        const feeAmount = BigNumber.from("99").mul(BigNumber.from("100"));
        await checkIfTakesRightFee(marketingWallet, feeAmount);
      });
    });
  });

  describe("wallet lock", async () => {});
});
