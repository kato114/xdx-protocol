const {
  deployContract,
  contractAt,
  sendTxn,
  getFrameSigner,
} = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");

const network = process.env.HARDHAT_NETWORK || "mainnet";

async function getPolygonValues() {
  const tokenManager = {
    address: "0x5B27E3aa98B48382a379214AA7F909C72e33bBF2",
  };

  return { tokenManager };
}

async function getValues() {
  return getPolygonValues();
}

async function main() {
  const admin = "0xEc181cF3a8660FC9240f4D72008b4fb71026933C";
  const buffer = 24 * 60 * 60;

  const { tokenManager } = await getValues();

  const timelock = await deployContract(
    "PriceFeedTimelock",
    [admin, buffer, tokenManager.address],
    "Timelock"
  );

  // const deployedTimelock = await contractAt("PriceFeedTimelock", timelock.address, signer)
  const deployedTimelock = await contractAt(
    "PriceFeedTimelock",
    timelock.address
  );

  const signers = [
    "0xEc181cF3a8660FC9240f4D72008b4fb71026933C", // coinflipcanada
  ];

  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i];
    await sendTxn(
      deployedTimelock.setContractHandler(signer, true),
      `deployedTimelock.setContractHandler(${signer})`
    );
  }

  const keepers = [
    "0xEc181cF3a8660FC9240f4D72008b4fb71026933C", // X
  ];

  for (let i = 0; i < keepers.length; i++) {
    const keeper = keepers[i];
    await sendTxn(
      deployedTimelock.setKeeper(keeper, true),
      `deployedTimelock.setKeeper(${keeper})`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
