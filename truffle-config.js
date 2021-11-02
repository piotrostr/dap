const HDWalletProvider = require("@truffle/hdwallet-provider");

const { 
  mnemonic, 
  BSCSCANAPIKEY, 
  infura,
  ETHERSCANAPIKEY,
  MATICSCANKEY
} = require('./.env.json');


module.exports = {
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    bscscan: BSCSCANAPIKEY,
    etherscan: ETHERSCANAPIKEY,
    polygonscan: MATICSCANKEY
  },
  networks: {

    bscTestnet: {
        provider: () => new HDWalletProvider(mnemonic, `https://data-seed-prebsc-1-s1.binance.org:8545`),
        network_id: 97,
        timeoutBlocks: 200,
        confirmations: 5,
        production: true    // Treats this network as if it was a public net. (default: false)
    },

    development: {
        host: "localhost",
        port: 8545,
        network_id: 1,
        skipDryRun: true
    },

    ropsten: {
        provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infura}`),
        network_id: 3,
        timeoutBlocks: 200,
        gas: 5500000, 
        confirmations: 2,
        production: true,
        skipDryRun: false
    },

    rinkeby: {
        provider: () => new HDWalletProvider(mnemonic, `wss://rinkeby.infura.io/ws/v3/${infura}`),
        network_id: 4,
        confirmations: 2,
        production: true,
        skipDryRun: true,
        // gas: 4500000,
        // gasPrice: 10000000000,
    },

    mainnet: {
      provider: () => new HDWalletProvider(mnemonic, `https://mainnet.infura.io/v3/${infura}`),
      network_id: 1,
      confirmations: 0,
      timeoutBlocks: 1000,
      gasPrice: 90000000000,
      skipDryRun: false,
      production: true
    },

    matic: {
      provider: () => new HDWalletProvider(mnemonic, `https://polygon-rpc.com/`),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      production: true
    },

    kovan: {
      provider: () => new HDWalletProvider(mnemonic, `https://kovan.infura.io/v3/${infura}`),
      network_id: 42,         
      confirmations: 0,      
      timeoutBlocks: 200,   
      gasPrice: 10000000000,
      skipDryRun: true,
      production: true
    },

    goerli: {
      provider: () => new HDWalletProvider(mnemonic, `wss://goerli.infura.io/ws/v3/${infura}`),
      network_id: 5,         
      skipDryRun: true,
      production: true
    },
  },
  mocha: {
    timeout: 100000,
  },
  compilers: {
    solc: {
      version: '0.8.9',
      settings: {       
       optimizer: {
         enabled: true,
         runs: 200
       },
      }
    },
  },
};

