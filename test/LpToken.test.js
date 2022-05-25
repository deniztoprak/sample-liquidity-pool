const { expect } = require('chai');

const initialSupply = hre.ethers.BigNumber.from('99999');
let LPTokenInstance;

beforeEach(async function () {
  const LPToken = await hre.ethers.getContractFactory('LPToken');
  LPTokenInstance = await LPToken.deploy(initialSupply);
  await LPTokenInstance.deployed();
});

describe('LPToken', function () {
  it('Should initialize the total supply', async function () {
    const totalSupply = await LPTokenInstance.totalSupply();

    expect(totalSupply).to.equal(initialSupply);
  });

  it('Should transfer the initial supply to deployer account', async function () {
    const [deployer] = await hre.ethers.getSigners();
    const deployerBalance = await LPTokenInstance.balanceOf(deployer.address);

    expect(deployerBalance).to.equal(initialSupply);

    // const setGreetingTx = await LPTokenInstance.setGreeting("Hola, mundo!");

    // // wait until the transaction is mined
    // await setGreetingTx.wait();

    // expect(await LPTokenInstance.greet()).to.equal("Hola, mundo!");
  });
});
