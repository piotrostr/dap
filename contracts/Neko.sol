// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Neko is ERC20('NekoNeko', 'NEKO'), Ownable {
  using SafeMath for uint;

  uint public _totalSupply = 10**6;

  address public _marketingWallet;

  constructor() {
    _mint(owner(), _totalSupply);
    emit Transfer(address(0), owner(), _totalSupply);
    _marketingWallet = owner();
  }

  function setMarketingWallet(address newAddress) public onlyOwner {
    _marketingWallet = newAddress;
  }

}

