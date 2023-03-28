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
const { getArgumentForSignature } = require("typechain");

const network = process.env.HARDHAT_NETWORK || "mainnet";
const tokens = require("./tokens")[network];

async function getPolygonValues() {
  return { vaultAddress: "0xb878f1fc91a40f06050f621E49B077088E142D1e" };
}

async function getValues() {
  return await getPolygonValues();
}

async function main() {
  const { vaultAddress, gasLimit } = await getValues();
  const gov = { address: "0xEc181cF3a8660FC9240f4D72008b4fb71026933C" };
  const shortsTracker = await deployContract(
    "ShortsTracker",
    [vaultAddress],
    "ShortsTracker",
    { gasLimit }
  );
  await sendTxn(shortsTracker.setGov(gov.address), "shortsTracker.setGov");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
