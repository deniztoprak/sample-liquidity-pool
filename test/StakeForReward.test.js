const { expect } = require('chai');
const dayjs = require('dayjs');

let LPTokenInstance;
let StakeForRewardInstance;
let RewardTokenInstance;
let deployer;
let testUser1;
let testUser2;

async function deployLPToken() {
  const LPToken = await hre.ethers.getContractFactory('LPToken');
  const initialSupply = hre.ethers.BigNumber.from('999999999999999999');
  LPTokenInstance = await LPToken.deploy(initialSupply);
  await LPTokenInstance.deployed();
}

async function deployRewardToken() {
  const RewardToken = await hre.ethers.getContractFactory('RewardToken');
  RewardTokenInstance = await RewardToken.deploy('ipfs://123456789/');
  await RewardTokenInstance.deployed();
}

async function deployStakeForReward() {
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

async function getRewardTokenId(tx) {
  const receipt = await tx.wait();
  const [rewardEvent] = receipt.events.filter((e) => {
    return e.event == 'RewardPaid';
  });
  return rewardEvent.args.rewardId.toString();
}

beforeEach(async function () {
  await deployLPToken();
  await deployRewardToken();
  await deployStakeForReward();

  [deployer, testUser1, testUser2] = await hre.ethers.getSigners();
});

describe('StakeForReward', function () {
  it('allows users stake their LP tokens', async function () {
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
    const testUser1TokenAmount = hre.ethers.BigNumber.from('1000');

    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);

    await expect(StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount.add('1'))).to.be.revertedWith(
      'ERC20: insufficient allowance'
    );
  });

  it('allows users withdraw their stake', async function () {
    const testUser1TokenAmount = hre.ethers.BigNumber.from('1000');

    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);

    await StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount);

    // Withdraw half of the balance
    await StakeForRewardInstance.connect(testUser1).withdraw(testUser1TokenAmount.div(2));
    let testUser1Balance = await StakeForRewardInstance.balanceOf(testUser1.address);
    let totalSupply = await StakeForRewardInstance.totalSupply();
    expect(testUser1Balance).to.equal(testUser1TokenAmount.div(2));
    expect(totalSupply).to.equal(testUser1TokenAmount.div(2));

    // Withdraw another half of the balance
    await StakeForRewardInstance.connect(testUser1).withdraw(testUser1TokenAmount.div(2));
    testUser1Balance = await StakeForRewardInstance.balanceOf(testUser1.address);
    totalSupply = await StakeForRewardInstance.totalSupply();
    expect(testUser1Balance).to.equal(0);
    expect(totalSupply).to.equal(0);
  });

  it('reverts when users try to withdraw 0 token', async function () {
    const testUser1TokenAmount = hre.ethers.BigNumber.from('1000');
    const zeroAmount = hre.ethers.BigNumber.from('0');

    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);

    await StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount);

    await expect(StakeForRewardInstance.connect(testUser1).withdraw(zeroAmount)).to.be.revertedWith(
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
    // Expect testUser1 gets no reward
    await expect(StakeForRewardInstance.connect(testUser1).claimReward()).to.be.revertedWith(
      "User doesn't have enough balance"
    );
  });

  it('reverts when users claim their reward before next reward level stake time', async function () {
    const testUser1TokenAmount = hre.ethers.BigNumber.from('500');

    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);

    await StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount);

    // Fast forward to to fifteen days later ...
    await fastForwardBlockTime(5);

    // Expect testUser1 gets no reward: 5 day / (((500 * 10) / 500) * 1 day)
    await expect(StakeForRewardInstance.connect(testUser1).claimReward()).to.be.revertedWith(
      'You have not reached the next reward level'
    );

    // Fast forward to to one month days later ...
    await fastForwardBlockTime(10);

    // Expect testUser1 gets level 1 reward
    await StakeForRewardInstance.connect(testUser1).claimReward();

    // Expect claimReward reverts when testUser1 re-claims reward before level 2 stake time elapsed
    await expect(StakeForRewardInstance.connect(testUser1).claimReward()).to.be.revertedWith(
      'You have not reached the next reward level'
    );
  });

  it('mints reward tokens including metadata reflecting current reward level', async function () {
    const testUser1TokenAmount = hre.ethers.BigNumber.from('500');

    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);

    await StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount);

    await fastForwardBlockTime(15);

    let tx = await StakeForRewardInstance.connect(testUser1).claimReward();
    let rewardTokenId = getRewardTokenId(tx);
    let rewardTokenURI = await RewardTokenInstance.tokenURI(rewardTokenId);

    expect(rewardTokenURI).to.equal('ipfs://123456789/1');

    await fastForwardBlockTime(10);

    tx = await StakeForRewardInstance.connect(testUser1).claimReward();
    rewardTokenId = getRewardTokenId(tx);
    rewardTokenURI = await RewardTokenInstance.tokenURI(rewardTokenId);

    expect(rewardTokenURI).to.equal('ipfs://123456789/2');
  });

  it('burns reward tokens of previous level when a new reward token is minted', async function () {
    const testUser1TokenAmount = hre.ethers.BigNumber.from('500');

    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);

    await StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount);

    await fastForwardBlockTime(15);

    let tx = await StakeForRewardInstance.connect(testUser1).claimReward();
    let firstLevelRewardTokenId = getRewardTokenId(tx);
    let firstLevelRewardTokenOwner = await RewardTokenInstance.ownerOf(firstLevelRewardTokenId);

    expect(firstLevelRewardTokenOwner).to.equal(testUser1.address);

    await fastForwardBlockTime(10);

    await StakeForRewardInstance.connect(testUser1).claimReward();
    await expect(RewardTokenInstance.ownerOf(firstLevelRewardTokenId)).to.be.revertedWith(
      'ERC721: owner query for nonexistent token'
    );
  });

  it('mints maximum 3 levels of reward token', async function () {
    const testUser1TokenAmount = hre.ethers.BigNumber.from('500');

    await LPTokenInstance.connect(deployer).transfer(testUser1.address, testUser1TokenAmount);
    await LPTokenInstance.connect(testUser1).approve(StakeForRewardInstance.address, testUser1TokenAmount);

    await StakeForRewardInstance.connect(testUser1).stake(testUser1TokenAmount);

    await fastForwardBlockTime(30);

    let tx = await StakeForRewardInstance.connect(testUser1).claimReward();
    let thirdLevelRewardTokenId = getRewardTokenId(tx);
    let rewardTokenURI = await RewardTokenInstance.tokenURI(thirdLevelRewardTokenId);

    expect(rewardTokenURI).to.equal('ipfs://123456789/3');

    await fastForwardBlockTime(90);

    await expect(StakeForRewardInstance.connect(testUser1).claimReward()).to.be.revertedWith(
      'You have already reached the highest reward level'
    );
  });
});
