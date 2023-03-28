const {
  getFrameSigner,
  deployContract,
  contractAt,
  sendTxn,
} = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");
const { toUsd } = require("../../test/shared/units");
const { errors } = require("../../test/core/Vault/helpers");

const network = process.env.HARDHAT_NETWORK || "mainnet";
const tokens = require("./tokens")[network];

const depositFee = 30; // 0.3%

async function getPolygonValues() {
  const vault = await contractAt(
    "Vault",
    "0xb878f1fc91a40f06050f621E49B077088E142D1e"
  );
  const timelock = await contractAt("Timelock", await vault.gov());
  const router = await contractAt("Router", await vault.router());
  const shortsTracker = await contractAt(
    "ShortsTracker",
    "0x7bDC0792857E1db968b2afE8C6edfA066aFA62c1"
  );
  const weth = await contractAt("WETH", tokens.nativeToken.address);
  const orderBook = await contractAt(
    "OrderBook",
    "0xee15AEbCe71eE01e1822571dd87c2f43fa68B59f"
  );
  const referralStorage = await contractAt(
    "ReferralStorage",
    "0xE02633a1fa9a1922C92Acb41Ccf83BAB53037234"
  );

  const orderKeepers = [
    { address: "0xEc181cF3a8660FC9240f4D72008b4fb71026933C" },
  ];
  const liquidators = [
    { address: "0xEc181cF3a8660FC9240f4D72008b4fb71026933C" },
  ];

  const partnerContracts = ["0xEc181cF3a8660FC9240f4D72008b4fb71026933C"];

  return {
    vault,
    timelock,
    router,
    shortsTracker,
    weth,
    depositFee,
    orderBook,
    referralStorage,
    orderKeepers,
    liquidators,
    partnerContracts,
  };
}

async function getValues() {
  return getPolygonValues();
}

async function main() {
  // const signer = await getFrameSigner()

  const {
    positionManagerAddress,
    vault,
    // timelock,
    router,
    shortsTracker,
    weth,
    depositFee,
    orderBook,
    referralStorage,
    orderKeepers,
    liquidators,
    partnerContracts,
  } = await getValues();

  let positionManager;

  // positionManager = await contractAt(
  //   "PositionManager",
  //   "0x412E0855f4A610a17cFd39FbA75ffC3d66EFF381"
  // );

  console.log("Deploying new position manager");
  const positionManagerArgs = [
    vault.address,
    router.address,
    shortsTracker.address,
    weth.address,
    depositFee,
    orderBook.address,
  ];
  positionManager = await deployContract(
    "PositionManager",
    positionManagerArgs
  );

  // positionManager only reads from referralStorage so it does not need to be set as a handler of referralStorage
  if (
    (await positionManager.referralStorage()).toLowerCase() !=
    referralStorage.address.toLowerCase()
  ) {
    await sendTxn(
      positionManager.setReferralStorage(referralStorage.address),
      "positionManager.setReferralStorage"
    );
  }
  if (await positionManager.shouldValidateIncreaseOrder()) {
    await sendTxn(
      positionManager.setShouldValidateIncreaseOrder(false),
      "positionManager.setShouldValidateIncreaseOrder(false)"
    );
  }

  for (let i = 0; i < orderKeepers.length; i++) {
    const orderKeeper = orderKeepers[i];
    if (!(await positionManager.isOrderKeeper(orderKeeper.address))) {
      await sendTxn(
        positionManager.setOrderKeeper(orderKeeper.address, true),
        "positionManager.setOrderKeeper(orderKeeper)"
      );
    }
  }

  for (let i = 0; i < liquidators.length; i++) {
    const liquidator = liquidators[i];
    if (!(await positionManager.isLiquidator(liquidator.address))) {
      await sendTxn(
        positionManager.setLiquidator(liquidator.address, true),
        "positionManager.setLiquidator(liquidator)"
      );
    }
  }

  //  //  //  // if (!(await timelock.isHandler(positionManager.address))) {
  //  //  //  //   await sendTxn(timelock.setContractHandler(positionManager.address, true), "timelock.setContractHandler(positionManager)")
  //  //  //  // }
  //  //  //  // if (!(await vault.isLiquidator(positionManager.address))) {
  //  //  //  //   await sendTxn(timelock.setLiquidator(vault.address, positionManager.address, true), "timelock.setLiquidator(vault, positionManager, true)")
  //  //  //  // }
  if (!(await shortsTracker.isHandler(positionManager.address))) {
    await sendTxn(
      shortsTracker.setHandler(positionManager.address, true),
      "shortsTracker.setContractHandler(positionManager.address, true)"
    );
  }
  if (!(await router.plugins(positionManager.address))) {
    await sendTxn(
      router.addPlugin(positionManager.address),
      "router.addPlugin(positionManager)"
    );
  }

  for (let i = 0; i < partnerContracts.length; i++) {
    const partnerContract = partnerContracts[i];
    if (!(await positionManager.isPartner(partnerContract))) {
      await sendTxn(
        positionManager.setPartner(partnerContract, false),
        "positionManager.setPartner(partnerContract)"
      );
    }
  }

  if ((await positionManager.gov()) != (await vault.gov())) {
    await sendTxn(
      positionManager.setGov(await vault.gov()),
      "positionManager.setGov"
    );
  }

  console.log("done.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
