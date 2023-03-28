const { deployContract, contractAt, sendTxn } = require("../shared/helpers");

const network = process.env.HARDHAT_NETWORK || "mainnet";

async function getPolygonValues() {
  const positionRouter = await contractAt(
    "PositionRouter",
    "0x022b7fCDE6344D2dfC298FAB72CF4BaCf9995b52"
  );
  const positionManager = await contractAt(
    "PositionManager",
    "0x649bFcbc67836E250be87A0D91cA5bc180E63447"
  );

  return { positionRouter, positionManager };
}

async function getValues() {
  if (network === "avalanche") {
    return getPolygonValues();
  }
}

async function main() {
  const { positionRouter, positionManager } = await getValues();
  // const referralStorage = await deployContract("ReferralStorage", []);

  const referralStorage = await contractAt(
    "ReferralStorage",
    "0xE02633a1fa9a1922C92Acb41Ccf83BAB53037234"
  );

  // await sendTxn(
  //   referralStorage.setTier(0, 2400, 5000),
  //   "referralStorage.setTier"
  // );

  // await sendTxn(
  //   positionRouter.setReferralStorage(referralStorage.address),
  //   "positionManager.setReferralStorage"
  // );
  // await sendTxn(
  //   positionManager.setReferralStorage(referralStorage.address),
  //   "positionManager.setReferralStorage"
  // );

  await sendTxn(
    referralStorage.setHandler(positionRouter.address, true),
    "referralStorage.setHandler(positionRouter)"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
