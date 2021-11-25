const AmericanDegenParty = artifacts.require('AmericanDegenParty')

const { assert } = require('chai')
const { expectRevert } = require('@openzeppelin/test-helpers')

contract('AmericanDegenParty', async (accounts) => {

  let adp

  beforeEach(async () => {
    adp = await AmericanDegenParty.deployed()
  })

  it('sets the marketing wallet address', async () => {
    const oldAddress = await adp.marketingWallet()
    assert.isFalse(accounts[2] == oldAddress)
    await adp.setMarketingWallet(accounts[2])
    const newAddress = await adp.marketingWallet()
    assert.equal(newAddress, accounts[2])
  })

  it('only owner can set the marketing wallet', async () => {
    assert.isFalse(accounts[2] == await adp.owner())
    await expectRevert(
      adp.setMarketingWallet(
        accounts[2], 
        { from: accounts[2] }
      ),
      'Ownable: caller is not the owner'
    )
  })
})
