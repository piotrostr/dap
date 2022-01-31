const DegenerateApeParty = artifacts.require('DegenerateApeParty')

const { assert } = require('chai')
const { expectRevert } = require('@openzeppelin/test-helpers')

contract('DegenerateApeParty', async (accounts) => {

  let dap

  beforeEach(async () => {
    dap = await DegenerateApeParty.deployed()
  })

  it('sets the marketing wallet address', async () => {
    const oldAddress = await dap.marketingWallet()
    assert.isFalse(accounts[2] == oldAddress)
    await dap.setMarketingWallet(accounts[2])
    const newAddress = await dap.marketingWallet()
    assert.equal(newAddress, accounts[2])
  })

  it('only owner can set the marketing wallet', async () => {
    assert.isFalse(accounts[2] == await dap.owner())
    await expectRevert(
      dap.setMarketingWallet(
        accounts[2], 
        { from: accounts[2] }
      ),
      'Ownable: caller is not the owner'
    )
  })
})
