//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title A dummy ERC20 contract
 * @author Deniz Toprak
 * @notice The contract is intended to test StakeForReward
 */
contract LPToken is ERC20 {
    /**
     * @dev Initializes the contract by minting the initial supply.
     */
    constructor(uint256 initialSupply) ERC20("LPToken", "LPT") {
        _mint(msg.sender, initialSupply);
    }
}
