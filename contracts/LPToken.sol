//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LPToken is ERC20 {
    string private greeting;

    constructor(uint256 initialSupply) ERC20("LPToken", "LP") {
        _mint(msg.sender, initialSupply);
    }
}
