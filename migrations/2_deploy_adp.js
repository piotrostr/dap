const ADP = artifacts.require('AmericanDegenParty')

const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

module.exports = async (deployer) => {
  deployer.deploy(ADP, uniswapRouterAddress)
}
