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

async function getAvaxValues() {
  const { eth, usdc } = tokens;
  const tokenArr = [eth, usdc];
  const fastPriceTokens = [eth, usdc];

  const priceFeedTimelock = {
    address: "0xAF922141Bd3202Cf3bc9817cA0b64A7FC63396B3",
  };

  const updater1 = { address: "0xEc181cF3a8660FC9240f4D72008b4fb71026933C" };
  const keeper1 = { address: "0xEc181cF3a8660FC9240f4D72008b4fb71026933C" };
  const updaters = [updater1.address, keeper1.address];

  const tokenManager = {
    address: "0x5B27E3aa98B48382a379214AA7F909C72e33bBF2",
  };

  const positionRouter = await contractAt(
    "PositionRouter",
    "0x022b7fCDE6344D2dfC298FAB72CF4BaCf9995b52"
  );

  const fastPriceEvents = await contractAt(
    "FastPriceEvents",
    "0xbafEE6346120d082BFfCA9e7BAb57e33d27Aa9c8"
  );

  // const fastPriceEvents = await contractAt("FastPriceEvents", "0x3ABC75fFf63a92F9b645e61393FCC15697506DE2")

  // const fastPriceEvents = await contractAt("FastPriceEvents", "0x02b7023D43bc52bFf8a0C54A9F2ecec053523Bf6", signer)

  return {
    fastPriceTokens,
    fastPriceEvents,
    tokenManager,
    positionRouter,
    tokenArr,
    updaters,
    priceFeedTimelock,
  };
}

async function getValues() {
  if (network === "avalanche") {
    return getAvaxValues();
  }
}

async function main() {
  // const signer = await getFrameSigner()
  const deployer = { address: "0xEc181cF3a8660FC9240f4D72008b4fb71026933C" };

  const {
    fastPriceTokens,
    fastPriceEvents,
    tokenManager,
    positionRouter,
    tokenArr,
    updaters,
    priceFeedTimelock,
  } = await getValues();

  const signers = [
    "0xEc181cF3a8660FC9240f4D72008b4fb71026933C", // coinflipcanada
  ];

  if (fastPriceTokens.find((t) => !t.fastPricePrecision)) {
    throw new Error("Invalid price precision");
  }

  if (fastPriceTokens.find((t) => !t.maxCumulativeDeltaDiff)) {
    throw new Error("Invalid price maxCumulativeDeltaDiff");
  }

  const secondaryPriceFeed = await deployContract("FastPriceFeed", [
    5 * 60, // _priceDuration
    60 * 60, // _maxPriceUpdateDelay
    1, // _minBlockInterval
    250, // _maxDeviationBasisPoints
    fastPriceEvents.address, // _fastPriceEvents
    deployer.address, // _tokenManager
    positionRouter.address,
  ]);

  // const vaultPriceFeed = await deployContract("VaultPriceFeed", [])
  const vaultPriceFeed = await contractAt(
    "VaultPriceFeed",
    "0x8Ceb2A921dd39f0225a52205163DC48060435F1f"
  );

  await sendTxn(
    vaultPriceFeed.setMaxStrictPriceDeviation(expandDecimals(1, 28)),
    "vaultPriceFeed.setMaxStrictPriceDeviation"
  ); // 0.01 USD
  await sendTxn(
    vaultPriceFeed.setPriceSampleSpace(1),
    "vaultPriceFeed.setPriceSampleSpace"
  );
  await sendTxn(
    vaultPriceFeed.setSecondaryPriceFeed(secondaryPriceFeed.address),
    "vaultPriceFeed.setSecondaryPriceFeed"
  );
  await sendTxn(
    vaultPriceFeed.setIsAmmEnabled(false),
    "vaultPriceFeed.setIsAmmEnabled"
  );

  for (const [i, tokenItem] of tokenArr.entries()) {
    if (tokenItem.spreadBasisPoints === undefined) {
      continue;
    }
    await sendTxn(
      vaultPriceFeed.setSpreadBasisPoints(
        tokenItem.address, // _token
        tokenItem.spreadBasisPoints // _spreadBasisPoints
      ),
      `vaultPriceFeed.setSpreadBasisPoints(${tokenItem.name}) ${tokenItem.spreadBasisPoints}`
    );
  }

  for (const token of tokenArr) {
    await sendTxn(
      vaultPriceFeed.setTokenConfig(
        token.address, // _token
        token.priceFeed, // _priceFeed
        token.priceDecimals, // _priceDecimals
        token.isStrictStable // _isStrictStable
      ),
      `vaultPriceFeed.setTokenConfig(${token.name}) ${token.address} ${token.priceFeed}`
    );
  }

  await sendTxn(
    secondaryPriceFeed.initialize(1, signers, updaters),
    "secondaryPriceFeed.initialize"
  );
  await sendTxn(
    secondaryPriceFeed.setTokens(
      fastPriceTokens.map((t) => t.address),
      fastPriceTokens.map((t) => t.fastPricePrecision)
    ),
    "secondaryPriceFeed.setTokens"
  );
  await sendTxn(
    secondaryPriceFeed.setVaultPriceFeed(vaultPriceFeed.address),
    "secondaryPriceFeed.setVaultPriceFeed"
  );
  await sendTxn(
    secondaryPriceFeed.setMaxTimeDeviation(60 * 60),
    "secondaryPriceFeed.setMaxTimeDeviation"
  );
  await sendTxn(
    secondaryPriceFeed.setSpreadBasisPointsIfInactive(50),
    "secondaryPriceFeed.setSpreadBasisPointsIfInactive"
  );
  await sendTxn(
    secondaryPriceFeed.setSpreadBasisPointsIfChainError(500),
    "secondaryPriceFeed.setSpreadBasisPointsIfChainError"
  );
  await sendTxn(
    secondaryPriceFeed.setMaxCumulativeDeltaDiffs(
      fastPriceTokens.map((t) => t.address),
      fastPriceTokens.map((t) => t.maxCumulativeDeltaDiff)
    ),
    "secondaryPriceFeed.setMaxCumulativeDeltaDiffs"
  );
  await sendTxn(
    secondaryPriceFeed.setPriceDataInterval(1 * 60),
    "secondaryPriceFeed.setPriceDataInterval"
  );

  await sendTxn(
    positionRouter.setPositionKeeper(secondaryPriceFeed.address, true),
    "positionRouter.setPositionKeeper(secondaryPriceFeed)"
  );
  await sendTxn(
    fastPriceEvents.setIsPriceFeed(secondaryPriceFeed.address, true),
    "fastPriceEvents.setIsPriceFeed"
  );

  await sendTxn(
    vaultPriceFeed.setGov(priceFeedTimelock.address),
    "vaultPriceFeed.setGov"
  );
  await sendTxn(
    secondaryPriceFeed.setGov(priceFeedTimelock.address),
    "secondaryPriceFeed.setGov"
  );
  await sendTxn(
    secondaryPriceFeed.setTokenManager(tokenManager.address),
    "secondaryPriceFeed.setTokenManager"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
