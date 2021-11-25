const AmericanDegenParty = artifacts.require('AmericanDegenParty')

const { assert } = require('chai')
const { BN, expectRevert } = require('@openzeppelin/test-helpers')

contract('AmericanDegenParty', async (accounts) => {

  let adp
  
  beforeEach(async () => {
    adp = await AmericanDegenParty.deployed()
  })

  it('should be able to withdraw eth in the contract', async function() {
    await web3.eth.sendTransaction({
      from: accounts[1], 
      to: adp.address, 
      value: web3.utils.toWei('1', 'ether')
    })
    const balance0 = new BN(await web3.eth.getBalance(await adp.owner()))
    await adp.withdraw({ from: await adp.owner() })
    const balance1 = new BN(await web3.eth.getBalance(await adp.owner()))
    // for some reason there are no gas fees on ganache,
    // but withdrawing works that is what counts
    assert.equal(
      balance1.sub(balance0).toString(), 
      web3.utils.toWei('1', 'ether')
    )
  })
})

