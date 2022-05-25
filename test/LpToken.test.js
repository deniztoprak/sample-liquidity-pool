const { expect } = require("chai");

describe("LPToken", function () {
  it("Should have an initial supply", async function () {
    const initialSupply = hre.ethers.BigNumber.from('99999');
    const LPToken = await hre.ethers.getContractFactory("LPToken");
    const LPTokenInstance = await LPToken.deploy(initialSupply);
    await LPTokenInstance.deployed();

    const [deployer] = await hre.ethers.getSigners();
    const deployerBalance = await LPTokenInstance.balanceOf(deployer.address);

    expect(deployerBalance.eq(initialSupply)).to.be.true;

    // const setGreetingTx = await LPTokenInstance.setGreeting("Hola, mundo!");

    // // wait until the transaction is mined
    // await setGreetingTx.wait();

    // expect(await LPTokenInstance.greet()).to.equal("Hola, mundo!");
  });
});
