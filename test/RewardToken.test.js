const { expect } = require('chai');

let RewardTokenInstance;
let deployer;
let testUser1;

async function getRewardTokenId(tx) {
  const receipt = await tx.wait();
  const [rewardEvent] = receipt.events.filter((e) => {
    return e.event == 'Transfer';
  });
  return rewardEvent.args.tokenId.toString();
}

beforeEach(async function () {
  const RewardToken = await hre.ethers.getContractFactory('RewardToken');
  RewardTokenInstance = await RewardToken.deploy('ipfs://123456789/');
  await RewardTokenInstance.deployed();

  [deployer, testUser1] = await hre.ethers.getSigners();
});

describe('RewardToken', function () {
  it('allows token mint only for contract owner', async function () {
    await RewardTokenInstance.connect(deployer).mint(testUser1.address, '123');

    await expect(RewardTokenInstance.connect(testUser1).mint(deployer.address, '123')).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
  });

  it('allows token burn only for contract owner', async function () {
    let tx = await RewardTokenInstance.connect(deployer).mint(testUser1.address, '123');
    let rewardTokenId = await getRewardTokenId(tx);

    await RewardTokenInstance.connect(deployer).burn(rewardTokenId);

    tx = await RewardTokenInstance.connect(deployer).mint(testUser1.address, '123');
    rewardTokenId = await getRewardTokenId(tx);

    await expect(RewardTokenInstance.connect(testUser1).burn(rewardTokenId)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
  });

  it('allows token transfer only for contract owner', async function () {
    const tx = await RewardTokenInstance.connect(deployer).mint(deployer.address, '123');
    const rewardTokenId = await getRewardTokenId(tx);

    await RewardTokenInstance.connect(deployer).transferFrom(deployer.address, testUser1.address, rewardTokenId);

    await expect(
      RewardTokenInstance.connect(testUser1).transferFrom(testUser1.address, deployer.address, rewardTokenId)
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });
});
