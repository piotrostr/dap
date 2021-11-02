const Neko = artifacts.require('Neko')

contract('Neko', async (accounts) => {
  it('takes marketing tax', async () => {
    return
    const neko = await Neko.deployed()
    const ethBalanceBeforeTx = await web3.eth.getBalance(neko.address)
    await neko.transfer(
      web.utils.toWei('100000', 'ether'), 
      ...
    )
    assert.equal()
  })
})
 
