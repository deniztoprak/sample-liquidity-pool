const hre = require('hardhat');

async function main() {
  // Deploy LPToken
  const LPToken = await hre.ethers.getContractFactory('LPToken');
  const initialSupply = hre.ethers.BigNumber.from('999999999999999999');
  const LPTokenInstance = await LPToken.deploy(initialSupply);
  await LPTokenInstance.deployed();
  console.log('LPToken deployed to:', LPTokenInstance.address);

  // Deploy RewardToken
  const RewardToken = await hre.ethers.getContractFactory('RewardToken');
  const RewardTokenInstance = await RewardToken.deploy();
  await RewardTokenInstance.deployed();
  console.log('RewardToken deployed to:', RewardTokenInstance.address);

  // Deploy StakeForReward
  const StakeForReward = await hre.ethers.getContractFactory('StakeForReward');
  const StakeForRewardInstance = await StakeForReward.deploy(LPTokenInstance.address, RewardTokenInstance.address);
  await StakeForRewardInstance.deployed();
  console.log('StakeForReward deployed to:', StakeForRewardInstance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
