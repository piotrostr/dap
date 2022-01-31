const DegenerateApeParty = artifacts.require('DegenerateApeParty')
const UniswapRouter = require(
  '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
)
const UniswapPair = require('@uniswap/v2-periphery/build/IUniswapV2Pair.json')

const { assert } = require('chai')
const { BN, expectRevert } = require('@openzeppelin/test-helpers')

contract('DegenerateApeParty - transfer', async (accounts) => {

  let dap
  let uniswapRouter
  let owner
  let marketingWallet
  let venueWallet
  let drinksWallet
  let uniswapPair
  let initialAdpPrice

  before(async () => {
    dap = await DegenerateApeParty.deployed()
    owner = await dap.owner()
    uniswapRouter = new web3.eth.Contract(
      UniswapRouter.abi,
      await dap.routerAddress()
    )
    uniswapPair = new web3.eth.Contract(
      UniswapPair.abi,
      await dap.uniswapV2Pair()
    )
    await web3.eth.sendTransaction({
      from: owner,
      value: web3.utils.toWei('50.01', 'ether'), 
      to: dap.address 
    })
    await dap.approve(owner, await dap.totalSupply())
    await dap.transferFrom(
      owner, 
      dap.address,
      web3.utils.toWei('600000', 'ether'),
      { from: owner }
    )
    const dapIn = '500000'
    const ethIn = '50'
    await dap.addLiquidity(
      web3.utils.toWei(dapIn, 'ether'), 
      web3.utils.toWei(ethIn, 'ether')  
    )
    initialAdpPrice = ethIn / dapIn
    marketingWallet = accounts[1]
    venueWallet = accounts[2]
    drinksWallet = accounts[3]
  })

  it('sets the marketing wallet properly', async () => {
    await dap.setMarketingWallet(marketingWallet)
    assert(await dap.marketingWallet() == marketingWallet)
  })

  it('sets the venue wallet properly', async () => {
    await dap.setVenueWallet(venueWallet)
    assert(await dap.venueWallet() == venueWallet)
  })

  it('sets the drinks wallet properly', async () => {
    await dap.setDrinksWallet(drinksWallet)
    assert(await dap.drinksWallet() == drinksWallet)
  })
  // see if above runs before the ones below, else set in the before block

  it('takes all tax properly', async () => {
    // TODO all tax
    const transferAmount = new BN(web3.utils.toWei('10000', 'ether'))
    const feeAmount = transferAmount.muln(19).divn(100)
    const ethBalanceBeforeTx = await web3.eth.getBalance(dap.address)
    const WETH = await dap.WETH()
    const [dapIn, ethOut] = await uniswapRouter.methods
      .getAmountsOut(
        feeAmount,
        [dap.address, WETH]
      )
      .call()
    const balanceMarketing0 = new BN(
      await web3.eth.getBalance(
        await dap.marketingWallet()
      )
    )
    const balanceVenue0 = new BN(
      await web3.eth.getBalance(
        await dap.venueWallet()
      )
    )
    const balanceDrinks0 = new BN(
      await web3.eth.getBalance(
        await dap.drinksWallet()
      )
    )
    await dap.transferFrom(owner, accounts[1], transferAmount)
    assert.isFalse(accounts[1] == owner)
    await dap.transfer(accounts[2], transferAmount, { from: accounts[1] })
    const dapAmount = web3.utils.fromWei(transferAmount)
    const inEth = dapAmount*initialAdpPrice
    console.log(`transfer amount: ${dapAmount} DAP (~${inEth} ETH)`)
    const balanceMarketing1 = new BN(
      await web3.eth.getBalance(
        await dap.marketingWallet()
      )
    )
    const balanceVenue1 = new BN(
      await web3.eth.getBalance(
        await dap.venueWallet()
      )
    )
    const balanceDrinks1 = new BN(
      await web3.eth.getBalance(
        await dap.drinksWallet()
      )
    )
    const marketingTax = new BN(ethOut).muln(8).divn(19).toString()
    assert.equal(
      balanceMarketing1.sub(balanceMarketing0), 
      marketingTax
    )
    console.log(`marketing tax: ${web3.utils.fromWei(marketingTax)} ETH`)
    const venueTax = new BN(ethOut).muln(9).divn(19).toString()
    assert.equal(
      balanceVenue1.sub(balanceVenue0), 
      venueTax
    )
    console.log(`venue tax: ${web3.utils.fromWei(venueTax)} ETH`)
    const drinksTax = new BN(ethOut).muln(1).divn(19).toString()
    assert.equal(
      balanceDrinks1.sub(balanceDrinks0).toString(), 
      drinksTax
    )
    console.log(`drinks tax: ${web3.utils.fromWei(drinksTax)} ETH`)
  })
})
 
