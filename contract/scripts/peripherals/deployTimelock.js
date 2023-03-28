const {
  deployContract,
  contractAt,
  sendTxn,
  getFrameSigner,
} = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");

const network = process.env.HARDHAT_NETWORK || "mainnet";

async function getPolygonValues() {
  const vault = await contractAt(
    "Vault",
    "0xb878f1fc91a40f06050f621E49B077088E142D1e"
  );
  const tokenManager = {
    address: "0x5B27E3aa98B48382a379214AA7F909C72e33bBF2",
  };
  const xlxManager = { address: "0x0e035768950D6A0c4dED2a531b7d9f4919B35D8E" };

  const positionRouter = {
    address: "0x022b7fCDE6344D2dfC298FAB72CF4BaCf9995b52",
  };
  const positionManager = {
    address: "0x649bFcbc67836E250be87A0D91cA5bc180E63447",
  };
  const xdxChain = { address: "0x27Ab3310791372526F86f32F6f240347F96C43B8" };

  return {
    vault,
    tokenManager,
    xlxManager,
    positionRouter,
    positionManager,
    xdxChain,
  };
}

async function getValues() {
  return getPolygonValues();
}

async function main() {
  const admin = "0xEc181cF3a8660FC9240f4D72008b4fb71026933C";
  const buffer = 0;
  const maxTokenSupply = expandDecimals("13250000", 18);

  const {
    vault,
    tokenManager,
    xlxManager,
    positionRouter,
    positionManager,
    xdxChain,
  } = await getValues();
  const mintReceiver = tokenManager;

  const timelock = await deployContract(
    "Timelock",
    [
      admin,
      buffer,
      tokenManager.address,
      mintReceiver.address,
      xlxManager.address,
      maxTokenSupply,
      10, // marginFeeBasisPoints 0.1%
      500, // maxMarginFeeBasisPoints 5%
    ],
    "Timelock"
  );

  const deployedTimelock = await contractAt("Timelock", timelock.address);
  // const deployedTimelock = await contractAt(
  //   "Timelock",
  //   "0x3402CeEFF69B904581c5717380006B52236046c7"
  // );

  await sendTxn(
    deployedTimelock.setShouldToggleIsLeverageEnabled(true),
    "deployedTimelock.setShouldToggleIsLeverageEnabled(true)"
  );
  await sendTxn(
    deployedTimelock.setContractHandler(positionRouter.address, true),
    "deployedTimelock.setContractHandler(positionRouter)"
  );
  await sendTxn(
    deployedTimelock.setContractHandler(positionManager.address, true),
    "deployedTimelock.setContractHandler(positionManager)"
  );

  // update gov of vault
  const vaultGov = await contractAt("Timelock", await vault.gov());
  await sendTxn(
    vaultGov.signalSetGov(vault.address, deployedTimelock.address),
    "vaultGov.signalSetGov"
  );
  await sendTxn(
    deployedTimelock.signalSetGov(vault.address, vaultGov.address),
    "deployedTimelock.signalSetGov(vault)"
  );

  const signers = ["0xEc181cF3a8660FC9240f4D72008b4fb71026933C"];

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

  await sendTxn(
    deployedTimelock.signalApprove(
      xdxChain.address,
      admin,
      "100000000000000000000000000000"
    ),
    "deployedTimelock.signalApprove"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
