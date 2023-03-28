const {
  deployContract,
  contractAt,
  sendTxn,
  writeTmpAddresses,
} = require("../shared/helpers");

const network = process.env.HARDHAT_NETWORK || "mainnet";
const tokens = require("../core/tokens")[network];

async function main() {
  const { nativeToken } = tokens;

  const vestingDuration = 365 * 24 * 60 * 60;

  const xlxManager = await contractAt(
    "XLXManager",
    "0x0e035768950D6A0c4dED2a531b7d9f4919B35D8E"
  );
  const xlx = await contractAt(
    "XLX",
    "0xD4211A8E6Ef4302a521F4dD718f978fE31564E75"
  );

  const xdx = await contractAt(
    "XDX",
    "0x27Ab3310791372526F86f32F6f240347F96C43B8"
  );
  const esXDX = await contractAt(
    "EsXDX",
    "0xB175355B199A3bcaEa2cE6e2E6Bdc76ddaB03eDF"
  );
  const bnXDX = await deployContract("MintableBaseToken", [
    "Bonus XDX",
    "bnXDX",
    0,
  ]);
  // const bnXDX = await contractAt(
  //   "MintableBaseToken",
  //   "0x40e52C96C2011c6d42b87886A04fDdD1FA8c2Fa6"
  // );

  await sendTxn(
    esXDX.setInPrivateTransferMode(true),
    "esXDX.setInPrivateTransferMode"
  );
  await sendTxn(
    xlx.setInPrivateTransferMode(true),
    "xlx.setInPrivateTransferMode"
  );

  const stakedXDXTracker = await deployContract("RewardTracker", [
    "Staked XDX",
    "sXDX",
  ]);
  // const stakedXDXTracker = await contractAt(
  //   "RewardTracker",
  //   "0xcCBBcf0Ef91d6CbE85B2F2E14D68618F8d1dC7c4"
  // );
  const stakedXDXDistributor = await deployContract("RewardDistributor", [
    esXDX.address,
    stakedXDXTracker.address,
  ]);
  // const stakedXDXDistributor = await contractAt(
  //   "RewardDistributor",
  //   "0x1D0F7723A92EF7DCF05f52c0D651B379c9627f47"
  // );

  await sendTxn(
    stakedXDXTracker.initialize(
      [xdx.address, esXDX.address],
      stakedXDXDistributor.address
    ),
    "stakedXDXTracker.initialize"
  );
  await sendTxn(
    stakedXDXDistributor.updateLastDistributionTime(),
    "stakedXDXDistributor.updateLastDistributionTime"
  );

  const bonusXDXTracker = await deployContract("RewardTracker", [
    "Staked + Bonus XDX",
    "sbXDX",
  ]);
  // const bonusXDXTracker = await contractAt(
  //   "RewardTracker",
  //   "0x41Bf5F8F9E3EC63612647cE9a6817c4646fFd016"
  // );

  const bonusXDXDistributor = await deployContract("BonusDistributor", [
    bnXDX.address,
    bonusXDXTracker.address,
  ]);
  // const bonusXDXDistributor = await contractAt(
  //   "BonusDistributor",
  //   "0x1228838B4a25D0663eA3324A977fF42Dd821931a"
  // );

  await sendTxn(
    bonusXDXTracker.initialize(
      [stakedXDXTracker.address],
      bonusXDXDistributor.address
    ),
    "bonusXDXTracker.initialize"
  );
  await sendTxn(
    bonusXDXDistributor.updateLastDistributionTime(),
    "bonusXDXDistributor.updateLastDistributionTime"
  );

  const feeXDXTracker = await deployContract("RewardTracker", [
    "Staked + Bonus + Fee XDX",
    "sbfXDX",
  ]);
  // const feeXDXTracker = await contractAt(
  //   "RewardTracker",
  //   "0xF38A6040A917f582BBd331fbfE002A32d49D4AcC"
  // );

  const feeXDXDistributor = await deployContract("RewardDistributor", [
    nativeToken.address,
    feeXDXTracker.address,
  ]);
  // const feeXDXDistributor = await contractAt(
  //   "RewardDistributor",
  //   "0xdD9b8CCC89Bbff8540Ffc9Df15e506FbB36dC75C"
  // );

  await sendTxn(
    feeXDXTracker.initialize(
      [bonusXDXTracker.address, bnXDX.address],
      feeXDXDistributor.address
    ),
    "feeXDXTracker.initialize"
  );
  await sendTxn(
    feeXDXDistributor.updateLastDistributionTime(),
    "feeXDXDistributor.updateLastDistributionTime"
  );

  const feeXLXTracker = await deployContract("RewardTracker", [
    "Fee XLX",
    "fXLX",
  ]);
  // const feeXLXTracker = await contractAt(
  //   "RewardTracker",
  //   "0xab15d85582a4BDBc28494D1baB8251D6Cd1F9081"
  // );

  const feeXLXDistributor = await deployContract("RewardDistributor", [
    nativeToken.address,
    feeXLXTracker.address,
  ]);

  await sendTxn(
    feeXLXTracker.initialize([xlx.address], feeXLXDistributor.address),
    "feeXLXTracker.initialize"
  );
  await sendTxn(
    feeXLXDistributor.updateLastDistributionTime(),
    "feeXLXDistributor.updateLastDistributionTime"
  );

  const stakedXLXTracker = await deployContract("RewardTracker", [
    "Fee + Staked XLX",
    "fsXLX",
  ]);

  // const stakedXLXTracker = await contractAt(
  //   "RewardTracker",
  //   "0x2912c72567fbBa62431ADc9B88C17842AADa1D0e"
  // );

  const stakedXLXDistributor = await deployContract("RewardDistributor", [
    esXDX.address,
    stakedXLXTracker.address,
  ]);

  // const stakedXLXDistributor = await contractAt(
  //   "RewardDistributor",
  //   "0x6cBb2f142bccb904604cC320a7465F9932009639"
  // );

  await sendTxn(
    stakedXLXTracker.initialize(
      [feeXLXTracker.address],
      stakedXLXDistributor.address
    ),
    "stakedXLXTracker.initialize"
  );
  await sendTxn(
    stakedXLXDistributor.updateLastDistributionTime(),
    "stakedXLXDistributor.updateLastDistributionTime"
  );

  await sendTxn(
    stakedXDXTracker.setInPrivateTransferMode(true),
    "stakedXDXTracker.setInPrivateTransferMode"
  );
  await sendTxn(
    stakedXDXTracker.setInPrivateStakingMode(true),
    "stakedXDXTracker.setInPrivateStakingMode"
  );
  await sendTxn(
    bonusXDXTracker.setInPrivateTransferMode(true),
    "bonusXDXTracker.setInPrivateTransferMode"
  );
  await sendTxn(
    bonusXDXTracker.setInPrivateStakingMode(true),
    "bonusXDXTracker.setInPrivateStakingMode"
  );
  await sendTxn(
    bonusXDXTracker.setInPrivateClaimingMode(true),
    "bonusXDXTracker.setInPrivateClaimingMode"
  );
  await sendTxn(
    feeXDXTracker.setInPrivateTransferMode(true),
    "feeXDXTracker.setInPrivateTransferMode"
  );
  await sendTxn(
    feeXDXTracker.setInPrivateStakingMode(true),
    "feeXDXTracker.setInPrivateStakingMode"
  );

  await sendTxn(
    feeXLXTracker.setInPrivateTransferMode(true),
    "feeXLXTracker.setInPrivateTransferMode"
  );
  await sendTxn(
    feeXLXTracker.setInPrivateStakingMode(true),
    "feeXLXTracker.setInPrivateStakingMode"
  );
  await sendTxn(
    stakedXLXTracker.setInPrivateTransferMode(true),
    "stakedXLXTracker.setInPrivateTransferMode"
  );
  await sendTxn(
    stakedXLXTracker.setInPrivateStakingMode(true),
    "stakedXLXTracker.setInPrivateStakingMode"
  );

  const xdxVester = await deployContract("Vester", [
    "Vested XDX", // _name
    "vXDX", // _symbol
    vestingDuration, // _vestingDuration
    esXDX.address, // _esToken
    feeXDXTracker.address, // _pairToken
    xdx.address, // _claimableToken
    stakedXDXTracker.address, // _rewardTracker
  ]);

  // const xdxVester = await contractAt(
  //   "Vester",
  //   "0x37b2CD251b55484d5611d7dAcEcf1f2eAaB68a80"
  // );

  const xlxVester = await deployContract("Vester", [
    "Vested XLX", // _name
    "vXLX", // _symbol
    vestingDuration, // _vestingDuration
    esXDX.address, // _esToken
    stakedXLXTracker.address, // _pairToken
    xdx.address, // _claimableToken
    stakedXLXTracker.address, // _rewardTracker
  ]);

  // const xlxVester = await contractAt(
  //   "Vester",
  //   "0x95a78D16ebf6563B8496913D016531837F74E1AE"
  // );
  const rewardRouter = await deployContract("RewardRouterV2", []);
  // const rewardRouter = await contractAt(
  //   "RewardRouterV2",
  //   "0xf2b3e51B903544727d1B632391b24918A6Bc79eB"
  // );
  await sendTxn(
    rewardRouter.initialize(
      nativeToken.address,
      xdx.address,
      esXDX.address,
      bnXDX.address,
      xlx.address,
      stakedXDXTracker.address,
      bonusXDXTracker.address,
      feeXDXTracker.address,
      feeXLXTracker.address,
      stakedXLXTracker.address,
      xlxManager.address,
      xdxVester.address,
      xlxVester.address
    ),
    "rewardRouter.initialize"
  );

  await sendTxn(
    xlxManager.setHandler(rewardRouter.address, true),
    "xlxManager.setHandler(rewardRouter)"
  );

  // allow rewardRouter to stake in stakedXDXTracker
  await sendTxn(
    stakedXDXTracker.setHandler(rewardRouter.address, true),
    "stakedXDXTracker.setHandler(rewardRouter)"
  );
  // allow bonusXDXTracker to stake stakedXDXTracker
  await sendTxn(
    stakedXDXTracker.setHandler(bonusXDXTracker.address, true),
    "stakedXDXTracker.setHandler(bonusXDXTracker)"
  );
  // allow rewardRouter to stake in bonusXDXTracker
  await sendTxn(
    bonusXDXTracker.setHandler(rewardRouter.address, true),
    "bonusXDXTracker.setHandler(rewardRouter)"
  );
  // allow bonusXDXTracker to stake feeXDXTracker
  await sendTxn(
    bonusXDXTracker.setHandler(feeXDXTracker.address, true),
    "bonusXDXTracker.setHandler(feeXDXTracker)"
  );
  await sendTxn(
    bonusXDXDistributor.setBonusMultiplier(20000),
    "bonusXDXDistributor.setBonusMultiplier"
  );
  // allow rewardRouter to stake in feeXDXTracker
  await sendTxn(
    feeXDXTracker.setHandler(rewardRouter.address, true),
    "feeXDXTracker.setHandler(rewardRouter)"
  );
  // allow stakedXDXTracker to stake esXDX
  await sendTxn(
    esXDX.setHandler(stakedXDXTracker.address, true),
    "esXDX.setHandler(stakedXDXTracker)"
  );
  // allow feeXDXTracker to stake bnXDX
  await sendTxn(
    bnXDX.setHandler(feeXDXTracker.address, true),
    "bnXDX.setHandler(feeXDXTracker"
  );
  // allow rewardRouter to burn bnXDX
  await sendTxn(
    bnXDX.setMinter(rewardRouter.address),
    "bnXDX.setMinter(rewardRouter"
  );

  // allow stakedXLXTracker to stake feeXLXTracker
  await sendTxn(
    feeXLXTracker.setHandler(stakedXLXTracker.address, true),
    "feeXLXTracker.setHandler(stakedXLXTracker)"
  );
  // allow feeXLXTracker to stake xlx
  await sendTxn(
    xlx.setHandler(feeXLXTracker.address, true),
    "xlx.setHandler(feeXLXTracker)"
  );

  // allow rewardRouter to stake in feeXLXTracker
  await sendTxn(
    feeXLXTracker.setHandler(rewardRouter.address, true),
    "feeXLXTracker.setHandler(rewardRouter)"
  );
  // allow rewardRouter to stake in stakedXLXTracker
  await sendTxn(
    stakedXLXTracker.setHandler(rewardRouter.address, true),
    "stakedXLXTracker.setHandler(rewardRouter)"
  );

  await sendTxn(
    esXDX.setHandler(rewardRouter.address, true),
    "esXDX.setHandler(rewardRouter)"
  );
  await sendTxn(
    esXDX.setHandler(stakedXDXDistributor.address, true),
    "esXDX.setHandler(stakedXDXDistributor)"
  );
  await sendTxn(
    esXDX.setHandler(stakedXLXDistributor.address, true),
    "esXDX.setHandler(stakedXLXDistributor)"
  );
  await sendTxn(
    esXDX.setHandler(stakedXLXTracker.address, true),
    "esXDX.setHandler(stakedXLXTracker)"
  );
  await sendTxn(
    esXDX.setHandler(xdxVester.address, true),
    "esXDX.setHandler(xdxVester)"
  );
  await sendTxn(
    esXDX.setHandler(xlxVester.address, true),
    "esXDX.setHandler(xlxVester)"
  );

  await sendTxn(
    esXDX.setMinter(xdxVester.address),
    "esXDX.setMinter(xdxVester)"
  );
  await sendTxn(
    esXDX.setMinter(xlxVester.address),
    "esXDX.setMinter(xlxVester)"
  );

  await sendTxn(
    xdxVester.setHandler(rewardRouter.address, true),
    "xdxVester.setHandler(rewardRouter)"
  );
  await sendTxn(
    xlxVester.setHandler(rewardRouter.address, true),
    "xlxVester.setHandler(rewardRouter)"
  );

  await sendTxn(
    feeXDXTracker.setHandler(xdxVester.address, true),
    "feeXDXTracker.setHandler(xdxVester)"
  );
  await sendTxn(
    stakedXLXTracker.setHandler(xlxVester.address, true),
    "stakedXLXTracker.setHandler(xlxVester)"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
