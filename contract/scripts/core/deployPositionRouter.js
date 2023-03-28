const {
  getFrameSigner,
  deployContract,
  contractAt,
  sendTxn,
  readTmpAddresses,
  writeTmpAddresses,
} = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");
const { toUsd } = require("../../test/shared/units");

const network = process.env.HARDHAT_NETWORK || "mainnet";
const tokens = require("./tokens")[network];

async function getPolygonValues() {
  const vault = await contractAt(
    "Vault",
    "0xb878f1fc91a40f06050f621E49B077088E142D1e"
  );
  const router = await contractAt("Router", await vault.router());
  const weth = await contractAt("WETH", tokens.nativeToken.address);
  const referralStorage = await contractAt(
    "ReferralStorage",
    "0xE02633a1fa9a1922C92Acb41Ccf83BAB53037234"
  );
  const shortsTracker = await contractAt(
    "ShortsTracker",
    "0x7bDC0792857E1db968b2afE8C6edfA066aFA62c1"
  );
  const depositFee = "30"; // 0.3%
  const minExecutionFee = "20000000000000000"; // 0.02 MATIC

  return {
    vault,
    router,
    weth,
    referralStorage,
    shortsTracker,
    depositFee,
    minExecutionFee,
  };
}

async function getValues() {
  return getPolygonValues();
}

async function main() {
  const {
    vault,
    router,
    weth,
    shortsTracker,
    depositFee,
    minExecutionFee,
    referralStorage,
  } = await getValues();

  // const referralStorageGov = await contractAt(
  //   "Timelock",
  //   await referralStorage.gov()
  // );

  const positionRouterArgs = [
    vault.address,
    router.address,
    weth.address,
    shortsTracker.address,
    depositFee,
    minExecutionFee,
  ];
  const positionRouter = await deployContract(
    "PositionRouter",
    positionRouterArgs
  );

  // const positionRouter = await contractAt(
  //   "PositionRouter",
  //   "0xF7fDa0A11f741b50AF8fa8986bD5e51B132081d8"
  // );
  await sendTxn(
    positionRouter.setReferralStorage(referralStorage.address),
    "positionRouter.setReferralStorage"
  );
  // await sendTxn(referralStorageGov.signalSetHandler(referralStorage.address, positionRouter.address, true), "referralStorage.signalSetHandler(positionRouter)")

  await sendTxn(
    shortsTracker.setHandler(positionRouter.address, true),
    "shortsTracker.setHandler(positionRouter)"
  );

  await sendTxn(router.addPlugin(positionRouter.address), "router.addPlugin");

  await sendTxn(
    positionRouter.setDelayValues(1, 180, 30 * 60),
    "positionRouter.setDelayValues"
  );
  // await sendTxn(timelock.setContractHandler(positionRouter.address, true), "timelock.setContractHandler(positionRouter)")

  // await sendTxn(positionRouter.setGov(await vault.gov()), "positionRouter.setGov")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
