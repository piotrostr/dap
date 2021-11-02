const Neko = artifacts.require('Neko')

module.exports = async (deployer) => {
  deployer.deploy(Neko)
}

