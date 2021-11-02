const Neko = artifacts.require('Neko')

const { assert } = require('chai')
const { expectRevert } = require('@openzeppelin/test-helpers')

contract('Neko', async (accounts) => {

  let neko

  beforeEach(async () => {
    neko = await Neko.deployed()
  })

  it('takes marketing tax', async () => {
    const ethBalanceBeforeTx = await web3.eth.getBalance(neko.address)
      /*
    await neko.transfer(
      web.utils.toWei('100000', 'ether'), 
      ...
    )
    assert.equal()
    */
  })
})
 
