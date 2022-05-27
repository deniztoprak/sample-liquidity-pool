//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "hardhat/console.sol";

contract StakeForReward {
    using SafeERC20 for IERC20;

    IERC20 public stakeToken;
    IERC721 public rewardToken;

    struct Stake {
        address user;
        uint256 balance;
        uint256 since;
    }

    uint256 private _totalSupply;
    mapping(address => Stake) private _stakes;

    constructor(address _stakeToken, address _rewardToken) {
        stakeToken = IERC20(_stakeToken);
        rewardToken = IERC721(_rewardToken);
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _stakes[account].balance;
    }

    function stake(uint256 _amount) external {
        stakeToken.safeTransferFrom(msg.sender, address(this), _amount);
        _totalSupply += _amount;
        _stakes[msg.sender].balance += _amount;
    }

    function withdraw(uint256 _amount) external {
        require(_amount > 0, "Withdraw amount can not be 0");
        require(_amount <= _stakes[msg.sender].balance, "User doesn't have enough balance");

        // SafeMath is not needed, since the 0.8 compiler has built-in overflow checking.
        _totalSupply -= _amount;
        _stakes[msg.sender].balance -= _amount;
        stakeToken.safeTransfer(msg.sender, _amount);
    }
}
