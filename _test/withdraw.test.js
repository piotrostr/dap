const DegenerateApeParty = artifacts.require("DegenerateApeParty");
const { assert } = require("chai");
const { BN, expectRevert } = require("@openzeppelin/test-helpers");

contract("DegenerateApeParty", async accounts => {
  let dap;

  beforeEach(async () => {
    dap = await DegenerateApeParty.deployed();
  });

  it("should be able to withdraw eth in the contract", async function () {
    await web3.eth.sendTransaction({
      from: accounts[1],
      to: dap.address,
      value: web3.utils.toWei("1", "ether"),
    });
    const balance0 = new BN(await web3.eth.getBalance(await dap.owner()));
    await dap.withdraw({ from: await dap.owner() });
    const balance1 = new BN(await web3.eth.getBalance(await dap.owner()));
    // for some reason there are no gas fees on ganache,
    // but withdrawing works that is what counts
    assert.equal(balance1.sub(balance0).toString(), web3.utils.toWei("1", "ether"));
  });
});
