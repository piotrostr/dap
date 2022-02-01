// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract DegenerateApeParty is ERC20("DegenerateApeParty", "DAP"), Ownable {
    using SafeMath for uint256;
    uint24 public constant poolFee = 2500;

    uint256 public _totalSupply = 10**24;

    address public marketingWallet;
    address public venueWallet;
    address public drinksWallet;

    address public routerAddress;
    address public WETH;

    ISwapRouter public immutable swapRouter;

    constructor(ISwapRouter _swapRouter) {
        swapRouter = _swapRouter;
        _mint(owner(), _totalSupply);
        marketingWallet = owner();
        venueWallet = owner();
        drinksWallet = owner();
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

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) public {}

    function swapEthForToken(uint256 ethAmount) public {}

    function swapTokenForEth(uint256 tokenAmount) public {}

    function withdraw() public onlyOwner returns (bool) {
        uint256 amount = address(this).balance;
        return payable(owner()).send(amount);
    }
}
