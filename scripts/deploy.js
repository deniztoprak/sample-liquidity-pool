const hre = require('hardhat');

let LPTokenInstance;
let RewardTokenInstance;

async function deployLPToken() {
  const LPToken = await hre.ethers.getContractFactory('LPToken');
  const initialSupply = hre.ethers.BigNumber.from('999999999999999999');
  LPTokenInstance = await LPToken.deploy(initialSupply);
  await LPTokenInstance.deployed();
  console.log('LPToken deployed to:', LPTokenInstance.address);
}

async function deployRewardToken() {
  const RewardToken = await hre.ethers.getContractFactory('RewardToken');
  RewardTokenInstance = await RewardToken.deploy('ipfs://123456789/');
  await RewardTokenInstance.deployed();
  console.log('RewardToken deployed to:', RewardTokenInstance.address);
}

async function main() {
  await deployLPToken();
  await deployRewardToken();

  const StakeForReward = await hre.ethers.getContractFactory('StakeForReward');
  StakeForRewardInstance = await StakeForReward.deploy(LPTokenInstance.address, RewardTokenInstance.address);
  await StakeForRewardInstance.deployed();
  console.log('StakeForReward deployed to:', StakeForRewardInstance.address);

  // Set stake contract as the owner of reward token contract
  await RewardTokenInstance.transferOwnership(StakeForRewardInstance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
