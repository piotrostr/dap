// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import "hardhat/console.sol";

contract DegenerateApeParty is ERC20("DegenerateApeParty", "DAP"), Ownable {
    using SafeMath for uint256;

    uint256 public _totalSupply = 10**24;

    address public marketingWallet;
    address public venueWallet;
    address public drinksWallet;

    address public routerAddress;
    address public uniswapV2Pair;
    address public WETH;

    IUniswapV2Router02 public uniswapV2Router;
    IUniswapV2Factory public factory;

    constructor(address _routerAddress) {
        _mint(owner(), _totalSupply);
        routerAddress = _routerAddress;
        marketingWallet = owner();
        venueWallet = owner();
        drinksWallet = owner();
        uniswapV2Router = IUniswapV2Router02(routerAddress);
        factory = IUniswapV2Factory(uniswapV2Router.factory());
        WETH = uniswapV2Router.WETH();
        uniswapV2Pair = factory.createPair(address(this), WETH);
    }

    receive() external payable {}

    function setMarketingWallet(address newAddress) public onlyOwner {
        marketingWallet = newAddress;
    }

    function setVenueWallet(address newAddress) public onlyOwner {
        venueWallet = newAddress;
    }

    function setDrinksWallet(address newAddress) public onlyOwner {
        drinksWallet = newAddress;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (msg.sender == owner() || msg.sender == routerAddress) {
            super._transfer(from, to, amount);
        } else {
            uint256 balanceBefore = address(this).balance;
            swapTokenForEth(amount.mul(19).div(100));
            uint256 ethOut = (address(this).balance).sub(balanceBefore);

            payable(marketingWallet).transfer(ethOut.mul(8).div(19));
            payable(venueWallet).transfer(ethOut.mul(9).div(19));
            payable(drinksWallet).transfer(ethOut.div(19));

            addLiquidity(amount.div(100), ethOut.div(19));

            uint256 amountPostFee = amount.mul(80).div(100);
            super._transfer(from, to, amountPostFee);
        }
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) public {
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        uniswapV2Router.addLiquidityETH{ value: ethAmount }(
            address(this),
            tokenAmount,
            0,
            0,
            msg.sender,
            block.timestamp
        );
    }

    function swapEthForToken(uint256 ethAmount) public {
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = address(this);
        uniswapV2Router.swapExactETHForTokens{ value: ethAmount }(
            0,
            path,
            msg.sender, // not sure what this is for, might be refunds
            block.timestamp
        );
    }

    function swapTokenForEth(uint256 tokenAmount) public {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapV2Router.WETH();
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        console.log("%s", uniswapV2Pair);
        uniswapV2Router.swapExactTokensForETH(tokenAmount, 0, path, address(this), block.timestamp);
    }

    function withdraw() public onlyOwner returns (bool) {
        uint256 amount = address(this).balance;
        return payable(owner()).send(amount);
    }
}
