// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';

contract Neko is ERC20('NekoNeko', 'NEKO'), Ownable {
    using SafeMath for uint;

    uint public _totalSupply = 10**6;

    address public marketingWallet;
    address public routerAddress;
    address public uniswapV2Pair;
    address public WETH;

    IUniswapV2Router02 public uniswapV2Router = IUniswapV2Router02(routerAddress);
    IUniswapV2Factory public factory;

    constructor(address _routerAddress) {
        _mint(owner(), _totalSupply);
        emit Transfer(address(0), owner(), _totalSupply);
        routerAddress = _routerAddress;
        marketingWallet = owner();
        factory = IUniswapV2Factory(uniswapV2Router.factory());
        WETH = uniswapV2Router.WETH();
        uniswapV2Pair = factory.createPair(address(this), WETH);
    }

    receive() external payable {}

    function setMarketingWallet(address newAddress) public onlyOwner {
        marketingWallet = newAddress;
    }

    function _transfer(address from, address to, uint amount) internal override {
        uint marketingFee = amount.mul(5).div(100);
        uint liquidityFee = amount.mul(2).div(100);
        super._transfer(from, marketingWallet, marketingFee);
        uint amountPostFee = amount.sub(marketingFee).sub(liquidityFee);
        super._transfer(from, to, amountPostFee);
    }

    function addLiquidity(uint tokenAmount, uint ethAmount) public {
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        uniswapV2Router.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            0,  // min amount A
            0,  // min amount B
            address(0),  // not sure why addressTo is the zero addie in BabyBAT
            block.timestamp
        );
    }

    function swapEthForToken(uint ethAmount) public {
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = address(this);
        uniswapV2Router.swapExactETHForTokens{value: ethAmount}(
            0,
            path,
            address(this),  // not sure what this is for, might be refunds
            block.timestamp
        );
    }

    function swapTokenForEth(uint tokenAmount) public {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapV2Router.WETH();
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        uniswapV2Router.swapExactTokensForETH(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }

    function withdraw() public onlyOwner returns (bool) {
        uint amount = address(this).balance;
        return payable(owner()).send(amount);
    }
}

