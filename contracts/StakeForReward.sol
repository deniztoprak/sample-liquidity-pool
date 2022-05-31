//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IRewardToken.sol";

// import "hardhat/console.sol";

/**
 * @title Stake contract
 * @author Deniz Toprak
 * @notice The contract rewards staking liquidity by reward tokens
 */
contract StakeForReward {
    // Use SafeERC20 to deal with non-reverting / non-standard ERC20 tokens
    using SafeERC20 for IERC20;

    // Events

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed to, uint256 rewardId);

    // State variables

    IERC20 public stakeToken;
    IRewardToken public rewardToken;

    struct Stake {
        uint256 balance;
        uint256 startTime;
        uint256 rewardLevel;
        uint256 rewardId;
    }

    uint256 private _totalSupply;
    mapping(address => Stake) private _stakes;

    /**
     * @dev Reward token is injected as a parameter instead of being instantiated inside the contract.
     *      This prevents tight coupling with reward implementation, provides modularity and saves gas.
     */
    constructor(address _stakeToken, address _rewardToken) {
        stakeToken = IERC20(_stakeToken);
        rewardToken = IRewardToken(_rewardToken);
    }

    // View functions

    /**
     * @notice Returns total liquidity supply of the contract
     * @dev Method added to provide ERC20 analogue interface
     */
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @notice Returns the balance of an account
     * @dev Method is added to provide ERC20 analogue interface
     */
    function balanceOf(address account) external view returns (uint256) {
        return _stakes[account].balance;
    }

    /**
     * @dev Calculates the reward level by a stake-weighted algorithm
     */
    function getRewardLevel(address staker) private view returns (uint256) {
        uint256 levelUpTime = ((_totalSupply * 10) / _stakes[staker].balance) * 1 days;
        uint256 rewardLevel = (block.timestamp - _stakes[staker].startTime) / levelUpTime;

        return rewardLevel;
    }

    // Mutative functions

    /**
     * @notice Stake given amount of liquidity
     */
    function stake(uint256 _amount) external {
        stakeToken.safeTransferFrom(msg.sender, address(this), _amount);
        _totalSupply += _amount;
        _stakes[msg.sender].balance += _amount;
        _stakes[msg.sender].startTime = block.timestamp;
        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice Withdraw given amount of liquidity
     */
    function withdraw(uint256 _amount) external {
        require(_amount > 0, "Withdraw amount can not be 0");
        require(_amount <= _stakes[msg.sender].balance, "User doesn't have enough balance");

        // SafeMath is not needed, since the 0.8 compiler has built-in overflow checking.
        _totalSupply -= _amount;
        _stakes[msg.sender].balance -= _amount;
        _stakes[msg.sender].startTime = block.timestamp;
        stakeToken.safeTransfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @notice Claim reward tokens
     */
    function claimReward() external {
        require(_stakes[msg.sender].balance > 0, "User doesn't have enough balance");
        uint256 rewardLevel = getRewardLevel(msg.sender);

        require(_stakes[msg.sender].rewardLevel != rewardLevel, "You have not reached the next reward level");
        require(_stakes[msg.sender].rewardLevel < 3, "You have already reached the highest reward level");

        if (_stakes[msg.sender].rewardId != 0) {
            rewardToken.burn(_stakes[msg.sender].rewardId);
        }
        _stakes[msg.sender].rewardId = rewardToken.mint(msg.sender, Strings.toString(rewardLevel));
        _stakes[msg.sender].rewardLevel = rewardLevel;
        emit RewardPaid(msg.sender, _stakes[msg.sender].rewardId);
    }
}
