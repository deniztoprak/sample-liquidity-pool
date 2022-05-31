const { expect } = require('chai');

describe('LPToken', function () {
  it('mints token on deployment', async function () {
    const LPToken = await hre.ethers.getContractFactory('LPToken');
    const initialSupply = hre.ethers.BigNumber.from('999999999999999999');
    const LPTokenInstance = await LPToken.deploy(initialSupply);
    await LPTokenInstance.deployed();

    const balance = await LPTokenInstance.totalSupply();

    expect(balance).to.equal(initialSupply);
  });
});
