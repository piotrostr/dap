const AmericanDegenParty = artifacts.require('AmericanDegenParty')
const UniswapRouter = require(
  '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
)
const UniswapPair = require('@uniswap/v2-periphery/build/IUniswapV2Pair.json')

const { assert } = require('chai')
const { BN, expectRevert } = require('@openzeppelin/test-helpers')

contract('AmericanDegenParty - transfer', async (accounts) => {

  let adp
  let uniswapRouter
  let owner
  let uniswapPair

  before(async () => {
    adp = await AmericanDegenParty.deployed()
    owner = await adp.owner()
    uniswapRouter = new web3.eth.Contract(
      UniswapRouter.abi,
      await adp.routerAddress()
    )
    uniswapPair = new web3.eth.Contract(
      UniswapPair.abi,
      await adp.uniswapV2Pair()
    )
    await web3.eth.sendTransaction({
      from: owner,
      value: web3.utils.toWei('5.01', 'ether'), 
      to: adp.address 
    })
    await adp.approve(owner, await adp.totalSupply())
    await adp.transferFrom(
      owner, 
      adp.address,
      web3.utils.toWei('600000', 'ether'),
      { from: owner }
    )
    await adp.addLiquidity(
      web3.utils.toWei('500000', 'ether'),  // of adp
      web3.utils.toWei('5', 'ether')  // of ether
    )
  })

  it('takes 5% marketing tax', async () => {
    const transferAmount = new BN(web3.utils.toWei('10000', 'ether'))
    const feeAmount = transferAmount.muln(6).divn(100)
    const ethBalanceBeforeTx = await web3.eth.getBalance(adp.address)
    const WETH = await adp.WETH()
    const [adpIn, ethOut] = await uniswapRouter.methods
      .getAmountsOut(
        feeAmount,
        [adp.address, WETH]
      )
      .call()
    const balance0 = new BN(
      await web3.eth.getBalance(
        await adp.marketingWallet()
      )
    )
    await adp.transferFrom(owner, accounts[1], transferAmount)
    assert.isFalse(accounts[1] == owner)
    await adp.transfer(accounts[2], transferAmount, { from: accounts[1] })
    const balance1 = new BN(
      await web3.eth.getBalance(
        await adp.marketingWallet()
      )
    )
    assert.equal(
      balance1.sub(balance0).toString(), 
      new BN(ethOut).muln(5).divn(6).toString()
    )
  })
})
 
