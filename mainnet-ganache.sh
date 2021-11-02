npx ganache-cli \
    --mnemonic ${mnemonic} \
    --defaultBalanceEther 1000000 \
    --gasLimit 0xfffffffffff \
    --gasPrice 0 \
    --port 8545 \
    --networkId 1 \
    --host 0.0.0.0 \
    --fork https://mainnet.infura.io/v3/${infura} 

