const { expect } = require('chai');

let LPTokenInstance;
let StakeForRewardInstance;

async function deployLPToken() {
  const LPToken = await hre.ethers.getContractFactory('LPToken');
  const initialSupply = hre.ethers.BigNumber.from('999999999999999999');
  LPTokenInstance = await LPToken.deploy(initialSupply);
  await LPTokenInstance.deployed();

  return LPTokenInstance.address;
}

async function deployRewardToken() {
  const RewardToken = await hre.ethers.getContractFactory('RewardToken');
  const RewardTokenInstance = await RewardToken.deploy();
  await RewardTokenInstance.deployed();

  return RewardTokenInstance.address;
}

beforeEach(async function () {
  const LPTokenAddress = await deployLPToken();
  const RewardTokenAddress = await deployRewardToken();

  const StakeForReward = await hre.ethers.getContractFactory('StakeForReward');
  StakeForRewardInstance = await StakeForReward.deploy(LPTokenAddress, RewardTokenAddress);
  await StakeForRewardInstance.deployed();
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

    await expect(StakeForRewardInstance.stake(testUserTokenAmount.add('1'))).to.be.revertedWith(
      'ERC20: insufficient allowance'
    );
  });
});
