// SPDX-License-Identifier: MIT
// Copyright (c) 2021 piotrostr.eth
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/IPancakePair.sol";
import "./interfaces/IPancakeFactory.sol";
import "./interfaces/IPancakeRouter02.sol";

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

    uint256 private _totalSupply = 10**24;

    address public marketingWallet;
    address public partyWallet;

    uint256 public marketingFee = 8;
    uint256 public partyFee = 10;
    uint256 public liquidityFee = 1; // is actually 2%, as another 1% swaps into eth

    bool public elevatedFees = false;

    uint24 public poolFee = 2500;
    address public pair;
    IPancakeRouter02 public router;
    IPancakeFactory public factory;

    event AddedLiquidity(uint256 dapAmount, uint256 ethAmount);

    constructor(address _routerAddress) {
        _mint(owner(), _totalSupply);
        marketingWallet = owner();
        partyWallet = owner();

        router = IPancakeRouter02(_routerAddress);
        factory = IPancakeFactory(router.factory());
        pair = factory.createPair(address(this), router.WETH());
    }

    receive() external payable {}

    function setMarketingWallet(address newAddress) public onlyOwner {
        marketingWallet = newAddress;
    }

    function setPartyWallet(address newAddress) public onlyOwner {
        partyWallet = newAddress;
    }

    function toggleFees() public onlyOwner {
        elevatedFees = !elevatedFees;
        if (elevatedFees == true) {
            marketingFee = 99;
            partyFee = 0;
            liquidityFee = 0;
        } else {
            marketingFee = 8;
            partyFee = 10;
            liquidityFee = 1;
        }
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (msg.sender == owner() || msg.sender == address(router)) {
            super._transfer(from, to, amount);
        } else {
            uint256 totalFee = marketingFee.add(partyFee).add(liquidityFee);
            uint256 dapToSwap = amount.mul(totalFee).div(100);
            uint256 amountPostFee = amount.sub(dapToSwap);

            uint256[] memory amounts = swapDapForEth(dapToSwap);
            uint256 dapOut = amounts[0];
            uint256 ethOut = amounts[1];

            // add up the remainder that doesnt get swapped
            amountPostFee = amountPostFee.add(dapToSwap.sub(dapOut));

            uint256 marketingEth = ethOut.mul(marketingFee).div(totalFee);
            uint256 partyEth = ethOut.mul(partyFee).div(totalFee);
            uint256 liquidityEth = ethOut.mul(liquidityFee).div(totalFee);
            uint256 liquidityDap = amount.div(100);

            // marketing fee is never 0
            payable(marketingWallet).transfer(marketingEth);

            if (partyFee != 0) {
                payable(partyWallet).transfer(partyEth);
            }

            if (liquidityFee != 0) {
                addLiquidity(liquidityDap, liquidityEth);
                emit AddedLiquidity(liquidityDap, liquidityEth);
                amountPostFee = amountPostFee.sub(liquidityDap);
            }

            super._transfer(from, to, amountPostFee);
        }
    }

    function addLiquidity(uint256 _amountDap, uint256 _amountETH)
        public
        returns (
            uint256 amountDap,
            uint256 amountETH,
            uint256 liquidity
        )
    {
        _approve(address(this), address(router), totalSupply());
        (amountDap, amountETH, liquidity) = router.addLiquidityETH{
            value: _amountETH
        }(
            address(this), // token
            _amountDap, // amountTokenDesired
            0, // amountTokenMin
            0, // amountETHMin
            owner(), // lp tokens recipient
            block.timestamp // deadline
        );
    }

    function swapDapForEth(uint256 _amountDap)
        public
        returns (uint256[] memory amounts)
    {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = router.WETH();
        _approve(address(this), address(router), _amountDap);
        amounts = router.swapExactTokensForETH(
            _amountDap, // desired token amount
            0, // min token amount
            path, // path
            address(this), // recipient
            block.timestamp // deadline
        );
    }

    function withdraw() public onlyOwner returns (bool success) {
        uint256 amount = address(this).balance;
        success = payable(owner()).send(amount);
    }
}
