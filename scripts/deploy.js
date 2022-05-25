const hre = require("hardhat");

async function main() {
  const LPToken = await hre.ethers.getContractFactory("LPToken");
  const initialSupply = hre.ethers.BigNumber.from('99999');
  const LPTokenInstance = await LPToken.deploy(initialSupply);

  await LPTokenInstance.deployed();

  console.log("LPToken deployed to:", LPTokenInstance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
