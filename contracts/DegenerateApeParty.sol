// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IPancakeRouter02.sol";
import "./interfaces/IPancakePair.sol";
import "./interfaces/IPancakeFactory.sol";

import "hardhat/console.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract DegenerateApeParty is ERC20("DegenerateApeParty", "DAP"), Ownable {
    using SafeMath for uint256;

    uint256 public _totalSupply = 10**24;

    address public marketingWallet;
    address public venueWallet;
    address public drinksWallet;

    uint24 public constant poolFee = 2500;
    address public pair;
    IPancakeRouter02 public router;
    IPancakeFactory public factory;

    constructor(address _routerAddress) {
        _mint(owner(), _totalSupply);
        marketingWallet = owner();
        venueWallet = owner();
        drinksWallet = owner();

        router = IPancakeRouter02(_routerAddress);
        factory = IPancakeFactory(router.factory());
        pair = factory.createPair(address(this), router.WETH());
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
        if (msg.sender == owner() || msg.sender == address(router)) {
            super._transfer(from, to, amount);
        } else {
            uint256 ethOut = swapTokenForEth(amount.mul(19).div(100));

            payable(marketingWallet).transfer(ethOut.mul(8).div(19));
            payable(venueWallet).transfer(ethOut.mul(9).div(19));
            payable(drinksWallet).transfer(ethOut.div(19));

            addLiquidity(amount.div(100), ethOut.div(19));

            uint256 amountPostFee = amount.mul(80).div(100);
            super._transfer(from, to, amountPostFee);
        }
    }

    function addLiquidity(uint256 _amountToken, uint256 _amountETH)
        public
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        )
    {
        (amountToken, amountETH, liquidity) = router.addLiquidityETH{
            value: _amountETH
        }(
            address(this), // token
            _amountToken, // amountTokenDesired
            0, // amountTokenMin
            0, // amountETHMin
            owner(), // lp tokens recipient
            block.timestamp // deadline
        );
    }

    function swapTokenForEth(uint256 tokenAmount)
        internal
        returns (uint256 amountOut)
    {
        // TODO
    }

    function withdraw() public onlyOwner returns (bool) {
        uint256 amount = address(this).balance;
        return payable(owner()).send(amount);
    }
}
