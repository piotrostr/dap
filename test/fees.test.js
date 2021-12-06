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
  let marketingWallet
  let venueWallet
  let drinksWallet
  let uniswapPair
  let initialAdpPrice

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
      value: web3.utils.toWei('50.01', 'ether'), 
      to: adp.address 
    })
    await adp.approve(owner, await adp.totalSupply())
    await adp.transferFrom(
      owner, 
      adp.address,
      web3.utils.toWei('600000', 'ether'),
      { from: owner }
    )
    const adpIn = '500000'
    const ethIn = '50'
    await adp.addLiquidity(
      web3.utils.toWei(adpIn, 'ether'), 
      web3.utils.toWei(ethIn, 'ether')  
    )
    initialAdpPrice = ethIn / adpIn
    marketingWallet = accounts[1]
    venueWallet = accounts[2]
    drinksWallet = accounts[3]
  })

  it('sets the marketing wallet properly', async () => {
    await adp.setMarketingWallet(marketingWallet)
    assert(await adp.marketingWallet() == marketingWallet)
  })

  it('sets the venue wallet properly', async () => {
    await adp.setVenueWallet(venueWallet)
    assert(await adp.venueWallet() == venueWallet)
  })

  it('sets the drinks wallet properly', async () => {
    await adp.setDrinksWallet(drinksWallet)
    assert(await adp.drinksWallet() == drinksWallet)
  })
  // see if above runs before the ones below, else set in the before block

  it('takes all tax properly', async () => {
    // TODO all tax
    const transferAmount = new BN(web3.utils.toWei('10000', 'ether'))
    const feeAmount = transferAmount.muln(19).divn(100)
    const ethBalanceBeforeTx = await web3.eth.getBalance(adp.address)
    const WETH = await adp.WETH()
    const [adpIn, ethOut] = await uniswapRouter.methods
      .getAmountsOut(
        feeAmount,
        [adp.address, WETH]
      )
      .call()
    const balanceMarketing0 = new BN(
      await web3.eth.getBalance(
        await adp.marketingWallet()
      )
    )
    const balanceVenue0 = new BN(
      await web3.eth.getBalance(
        await adp.venueWallet()
      )
    )
    const balanceDrinks0 = new BN(
      await web3.eth.getBalance(
        await adp.drinksWallet()
      )
    )
    await adp.transferFrom(owner, accounts[1], transferAmount)
    assert.isFalse(accounts[1] == owner)
    await adp.transfer(accounts[2], transferAmount, { from: accounts[1] })
    const adpAmount = web3.utils.fromWei(transferAmount)
    const inEth = adpAmount*initialAdpPrice
    console.log(`transfer amount: ${adpAmount} ADP (~${inEth} ETH)`)
    const balanceMarketing1 = new BN(
      await web3.eth.getBalance(
        await adp.marketingWallet()
      )
    )
    const balanceVenue1 = new BN(
      await web3.eth.getBalance(
        await adp.venueWallet()
      )
    )
    const balanceDrinks1 = new BN(
      await web3.eth.getBalance(
        await adp.drinksWallet()
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
 
