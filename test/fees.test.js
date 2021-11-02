const Neko = artifacts.require('Neko')
const UniswapRouter = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json')

const { assert } = require('chai')
const { BN, expectRevert } = require('@openzeppelin/test-helpers')

contract('Neko', async (accounts) => {

  let neko
  let uniswapRouter
  let owner

  beforeEach(async () => {
    neko = await Neko.deployed()
    owner = await neko.owner()
    uniswapRouter = new web3.eth.Contract(
      UniswapRouter.abi,
      await neko.routerAddress()
    )
    await web3.eth.sendTransaction({
      from: owner,
      value: web3.utils.toWei('5.01', 'ether'), 
      to: neko.address 
    })
    await neko.approve(owner, await neko.totalSupply())
    await neko.transferFrom(
      owner, 
      neko.address,
      web3.utils.toWei('100000', 'ether'),
      { from: owner }
    )
    await neko.addLiquidity(
      web3.utils.toWei('50000', 'ether'),  // of neko
      web3.utils.toWei('5', 'ether')  // of ether
    )
  })

  it('takes 5% marketing tax', async () => {
    const transferAmount = new BN(web3.utils.toWei('10000', 'ether'))
    const marketingTax = transferAmount.muln(5).divn(100)
    const ethBalanceBeforeTx = await web3.eth.getBalance(neko.address)
    const WETH = await neko.WETH()
    const [nekoIn, ethOut] = await uniswapRouter.methods
      .getAmountsOut(
        marketingTax,
        [neko.address, WETH]
      )
      .call()
    await neko.withdraw({ from: owner })
    const balance0 = new BN(await web3.eth.getBalance(await neko.marketingWallet()))
    await neko.transferFrom(owner, accounts[1], transferAmount)
    assert.isFalse(accounts[1] == owner)
    await neko.transfer(accounts[2], transferAmount, { from: accounts[1] })
    const balance1 = new BN(await web3.eth.getBalance(await neko.marketingWallet()))
    assert.equal(balance1.sub(balance0).toString(), ethOut)
  })

})
 
