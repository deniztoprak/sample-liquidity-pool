const { expect } = require('chai');
const dayjs = require('dayjs');

let LPTokenInstance;
let StakeForRewardInstance;

async function deployLPToken() {
  const LPToken = await hre.ethers.getContractFactory('LPToken');
  const initialSupply = hre.ethers.BigNumber.from('999999999999999999');
  LPTokenInstance = await LPToken.deploy(initialSupply);
  await LPTokenInstance.deployed();

  return LPTokenInstance;
}

async function deployRewardToken() {
  const RewardToken = await hre.ethers.getContractFactory('RewardToken');
  const RewardTokenInstance = await RewardToken.deploy('ipfs://123456789/');
  await RewardTokenInstance.deployed();

  return RewardTokenInstance;
}

async function deployStakeForRewardInstance(LPTokenInstance, RewardTokenInstance) {
  const StakeForReward = await hre.ethers.getContractFactory('StakeForReward');
  StakeForRewardInstance = await StakeForReward.deploy(LPTokenInstance.address, RewardTokenInstance.address);
  await StakeForRewardInstance.deployed();
  // Set stake contract as the owner of reward token contract
  await RewardTokenInstance.transferOwnership(StakeForRewardInstance.address);
}

async function fastForwardBlockTime(days) {
  const currentBlockNumber = await ethers.provider.getBlockNumber();
  const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
  const currentBlockTime = dayjs.unix(currentBlock.timestamp);
  const one1MonthLater = currentBlockTime.add(days, 'day').unix();

  await network.provider.send('evm_mine', [one1MonthLater]);
}

beforeEach(async function () {
  const LPTokenInstance = await deployLPToken();
  const RewardTokenInstance = await deployRewardToken();
  await deployStakeForRewardInstance(LPTokenInstance, RewardTokenInstance);
});

describe('StakeForReward', function () {
  it('allows users stake their LP tokens', async function () {
    const [deployer, testUser1, testUser2] = await hre.ethers.getSigners();
    const testUser1TokenAmount = hre.ethers.BigNumber.from('1000');
    const testUser2TokenAmount = hre.ethers.BigNumber.from('5000');
    // Transfer LP Token to test users
    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(deployer).transfer(testUser2.address, testUser2TokenAmount);
    // Test users approve the allowance of StakeForReward
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser2).approve(StakeForRewardInstance.address, testUser2TokenAmount);
    // Test users stake their LP tokens
    await StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount);
    await StakeForRewardInstance.connect(testUser2).stake(testUser2TokenAmount);

    const testUser1Balance = await StakeForRewardInstance.balanceOf(testUser1.address);
    const testUser2Balance = await StakeForRewardInstance.balanceOf(testUser2.address);
    const totalSupply = await StakeForRewardInstance.totalSupply();

    expect(testUser1Balance).to.equal(testUser1TokenAmount);
    expect(testUser2Balance).to.equal(testUser2TokenAmount);
    expect(totalSupply).to.equal(testUser1Balance.add(testUser2Balance));
  });

  it('reverts when users try to stake more then they own', async function () {
    const [deployer, testUser] = await hre.ethers.getSigners();
    const testUserTokenAmount = hre.ethers.BigNumber.from('1000');

    await LPTokenInstance.connect(deployer).transfer(testUser.address, testUserTokenAmount);
    await LPTokenInstance.connect(testUser).approve(StakeForRewardInstance.address, testUserTokenAmount);

    await expect(StakeForRewardInstance.connect(testUser).stake(testUserTokenAmount.add('1'))).to.be.revertedWith(
      'ERC20: insufficient allowance'
    );
  });

  it('allows users withdraw their stake', async function () {
    const [deployer, testUser] = await hre.ethers.getSigners();
    const testUserTokenAmount = hre.ethers.BigNumber.from('1000');

    await LPTokenInstance.connect(deployer).transfer(testUser.address, testUserTokenAmount);
    await LPTokenInstance.connect(testUser).approve(StakeForRewardInstance.address, testUserTokenAmount);

    await StakeForRewardInstance.connect(testUser).stake(testUserTokenAmount);

    // Withdraw half of the balance
    await StakeForRewardInstance.connect(testUser).withdraw(testUserTokenAmount.div(2));
    let testUserBalance = await StakeForRewardInstance.balanceOf(testUser.address);
    let totalSupply = await StakeForRewardInstance.totalSupply();
    expect(testUserBalance).to.equal(testUserTokenAmount.div(2));
    expect(totalSupply).to.equal(testUserTokenAmount.div(2));

    // Withdraw another half of the balance
    await StakeForRewardInstance.connect(testUser).withdraw(testUserTokenAmount.div(2));
    testUserBalance = await StakeForRewardInstance.balanceOf(testUser.address);
    totalSupply = await StakeForRewardInstance.totalSupply();
    expect(testUserBalance).to.equal(0);
    expect(totalSupply).to.equal(0);
  });

  it('reverts when users try to withdraw 0 token', async function () {
    const [deployer, testUser] = await hre.ethers.getSigners();
    const testUserTokenAmount = hre.ethers.BigNumber.from('1000');
    const zeroAmount = hre.ethers.BigNumber.from('0');

    await LPTokenInstance.connect(deployer).transfer(testUser.address, testUserTokenAmount);
    await LPTokenInstance.connect(testUser).approve(StakeForRewardInstance.address, testUserTokenAmount);

    await StakeForRewardInstance.connect(testUser).stake(testUserTokenAmount);

    await expect(StakeForRewardInstance.connect(testUser).withdraw(zeroAmount)).to.be.revertedWith(
      'Withdraw amount can not be 0'
    );
  });

  it('reverts when users try to withdraw more than their balance', async function () {
    const [deployer, testUser1, testUser2] = await hre.ethers.getSigners();
    const testUser1TokenAmount = hre.ethers.BigNumber.from('1000');
    const unstakedTokenAmount = hre.ethers.BigNumber.from('500');

    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);

    await StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount);

    await expect(StakeForRewardInstance.connect(testUser1).withdraw(testUser1TokenAmount.add('1'))).to.be.revertedWith(
      "User doesn't have enough balance"
    );

    await expect(StakeForRewardInstance.connect(testUser2).withdraw(unstakedTokenAmount)).to.be.revertedWith(
      "User doesn't have enough balance"
    );
  });

  it('allows users claim their reward after a certain time period has passed', async function () {
    const [deployer, testUser1, testUser2] = await hre.ethers.getSigners();
    const testUser1TokenAmount = hre.ethers.BigNumber.from('500');
    const testUser2TokenAmount = hre.ethers.BigNumber.from('1000');

    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(deployer).transfer(testUser2.address, testUser2TokenAmount);
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser2).approve(StakeForRewardInstance.address, testUser2TokenAmount);

    await StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount);
    await StakeForRewardInstance.connect(testUser2).stake(testUser2TokenAmount);

    // Fast forward to to one month later ...
    await fastForwardBlockTime(30);

    // Expect testUser1 gets level 1 reward: 30 day / (((1500 * 10) / 500) * 1 day)
    await StakeForRewardInstance.connect(testUser1).claimReward();

    // Expect testUser2 gets level 2 reward: 30 day / (((1500 * 10) / 1000) * 1 day)
    await StakeForRewardInstance.connect(testUser2).claimReward();
  });

  it('reverts when users claim their reward without staking LP tokens', async function () {
    const [deployer, testUser] = await hre.ethers.getSigners();

    // Expect testUser gets no reward
    await expect(StakeForRewardInstance.connect(testUser).claimReward()).to.be.revertedWith(
      "User doesn't have enough balance"
    );
  });

  it('reverts when users claim their reward before next reward level stake time', async function () {
    const [deployer, testUser] = await hre.ethers.getSigners();
    const testUserTokenAmount = hre.ethers.BigNumber.from('500');

    await LPTokenInstance.connect(deployer).transfer(testUser.address, testUserTokenAmount);
    await LPTokenInstance.connect(testUser).approve(StakeForRewardInstance.address, testUserTokenAmount);

    await StakeForRewardInstance.connect(testUser).stake(testUserTokenAmount);

    // Fast forward to to fifteen days later ...
    await fastForwardBlockTime(5);

    // Expect testUser gets no reward: 5 day / (((500 * 10) / 500) * 1 day)
    await expect(StakeForRewardInstance.connect(testUser).claimReward()).to.be.revertedWith(
      'You have not reached the next reward level'
    );

    // Fast forward to to one month days later ...
    await fastForwardBlockTime(10);

    // Expect testUser gets level 1 reward
    await StakeForRewardInstance.connect(testUser).claimReward();

    // Expect claimReward reverts when testUser re-claims reward before level 2 stake time elapsed
    await expect(StakeForRewardInstance.connect(testUser).claimReward()).to.be.revertedWith(
      'You have not reached the next reward level'
    );
  });
});
