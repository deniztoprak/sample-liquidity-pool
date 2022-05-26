const hre = require('hardhat');

async function deployLPToken() {
  const LPToken = await hre.ethers.getContractFactory('LPToken');
  const initialSupply = hre.ethers.BigNumber.from('999999999999999999');
  const LPTokenInstance = await LPToken.deploy(initialSupply);
  await LPTokenInstance.deployed();
  console.log('LPToken deployed to:', LPTokenInstance.address);

  return LPTokenInstance.address;
}

async function deployRewardToken() {
  const RewardToken = await hre.ethers.getContractFactory('RewardToken');
  const RewardTokenInstance = await RewardToken.deploy();
  await RewardTokenInstance.deployed();
  console.log('RewardToken deployed to:', RewardTokenInstance.address);

  return RewardTokenInstance.address;
}

async function main() {
  // Deploy dummy LPToken
  // Provide LPToken address in production environment
  const LPTokenAddress = await deployLPToken();

  // Deploy dummy RewardToken
  // Provide RewardToken address in production environment
  const RewardTokenAddress = await deployRewardToken();

  const StakeForReward = await hre.ethers.getContractFactory('StakeForReward');
  const StakeForRewardInstance = await StakeForReward.deploy(LPTokenAddress, RewardTokenAddress);
  await StakeForRewardInstance.deployed();
  console.log('StakeForReward deployed to:', StakeForRewardInstance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
