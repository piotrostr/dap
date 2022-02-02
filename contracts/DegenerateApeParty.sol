// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import "./interfaces/IWETH.sol";

import "hardhat/console.sol";

contract DegenerateApeParty is ERC20("DegenerateApeParty", "DAP"), Ownable {
    using SafeMath for uint256;

    uint256 public _totalSupply = 10**24;
    address public marketingWallet;
    address public venueWallet;
    address public drinksWallet;
    address public routerAddress;

    uint24 public constant poolFee = 2500;

    ISwapRouter public immutable swapRouter;
    IWETH public immutable weth;

    constructor(ISwapRouter _swapRouter, IWETH _weth) {
        swapRouter = _swapRouter;
        _mint(owner(), _totalSupply);
        marketingWallet = owner();
        venueWallet = owner();
        drinksWallet = owner();
        weth = _weth;
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
            uint256 ethOut = swapTokenForEth(amount.mul(19).div(100));

            payable(marketingWallet).transfer(ethOut.mul(8).div(19));
            payable(venueWallet).transfer(ethOut.mul(9).div(19));
            payable(drinksWallet).transfer(ethOut.div(19));

            addLiquidity(amount.div(100), ethOut.div(19));

            uint256 amountPostFee = amount.mul(80).div(100);
            super._transfer(from, to, amountPostFee);
        }
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) public {
        // TODO
    }

    function swapExactInputSingle(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) public returns (uint256 amountOut) {
        TransferHelper.safeTransferFrom(
            address(weth),
            msg.sender,
            address(this),
            amountIn
        );
        TransferHelper.safeApprove(
            address(weth),
            address(swapRouter),
            amountIn
        );

        // TODO use oracle to ensure there are no goofy txs
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle(params);
    }

    function swapTokenForEth(uint256 tokenAmount)
        public
        returns (uint256 amountOut)
    {
        // this should be internal but I wanna test it to
        // get that sweet 100% coverage
        // dunno how though
        console.log(msg.sender);
        console.log(address(this));
        require(
            msg.sender == address(this),
            "only the contract can call this method"
        );
        amountOut = swapExactInputSingle(
            tokenAmount,
            address(this),
            address(weth)
        );
        weth.withdraw(amountOut);
    }

    function withdraw() public onlyOwner returns (bool) {
        uint256 amount = address(this).balance;
        return payable(owner()).send(amount);
    }
}
