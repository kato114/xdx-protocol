const { deployContract, contractAt, sendTxn } = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");
const { toUsd } = require("../../test/shared/units");
const { errors } = require("../../test/core/Vault/helpers");

const network = process.env.HARDHAT_NETWORK || "mainnet";
const tokens = require("./tokens")[network];

async function main() {
  const { nativeToken } = tokens;

  // const vault = await deployContract("Vault", []);
  // const usdg = await deployContract("USDG", [vault.address]);
  // const router = await deployContract("Router", [
  //   vault.address,
  //   usdg.address,
  //   nativeToken.address,
  // ]);
  // const vaultPriceFeed = await deployContract("VaultPriceFeed", []);

  const vault = await contractAt(
    "Vault",
    "0xb878f1fc91a40f06050f621E49B077088E142D1e"
  );
  const usdg = await contractAt(
    "USDG",
    "0x8614A398C0a7fF5063d4a7CB841c62Af42cF9f32"
  );
  const router = await contractAt(
    "Router",
    "0x064740A971Ba8a19225BC509853F4b32Ba2E3aED"
  );
  const vaultPriceFeed = await contractAt(
    "VaultPriceFeed",
    "0x8Ceb2A921dd39f0225a52205163DC48060435F1f"
  );

  // const secondaryPriceFeed = await deployContract("FastPriceFeed", [5 * 60])

  // await sendTxn(
  //   vaultPriceFeed.setMaxStrictPriceDeviation(expandDecimals(1, 28)),
  //   "vaultPriceFeed.setMaxStrictPriceDeviation"
  // ); // 0.05 USD
  // await sendTxn(
  //   vaultPriceFeed.setPriceSampleSpace(1),
  //   "vaultPriceFeed.setPriceSampleSpace"
  // );
  // await sendTxn(
  //   vaultPriceFeed.setIsAmmEnabled(false),
  //   "vaultPriceFeed.setIsAmmEnabled"
  // );

  // const xlx = await deployContract("XLX", []);
  const xlx = await contractAt(
    "XLX",
    "0xD4211A8E6Ef4302a521F4dD718f978fE31564E75"
  );
  // await sendTxn(
  //   xlx.setInPrivateTransferMode(true),
  //   "xlx.setInPrivateTransferMode"
  // );

  // const xlxManager = await deployContract("XLXManager", [
  //   vault.address,
  //   usdg.address,
  //   xlx.address,
  //   15 * 60,
  // ]);
  const xlxManager = await contractAt(
    "XLXManager",
    "0x0e035768950D6A0c4dED2a531b7d9f4919B35D8E"
  );

  // await sendTxn(
  //   xlxManager.setInPrivateMode(true),
  //   "xlxManager.setInPrivateMode"
  // );

  // await sendTxn(xlx.setMinter(xlxManager.address), "xlx.setMinter");
  await sendTxn(usdg.addVault(xlxManager.address), "usdg.addVault(xlxManager)");

  await sendTxn(
    vault.initialize(
      router.address, // router
      usdg.address, // usdg
      vaultPriceFeed.address, // priceFeed
      toUsd(2), // liquidationFeeUsd
      100, // fundingRateFactor
      100 // stableFundingRateFactor
    ),
    "vault.initialize"
  );

  await sendTxn(
    vault.setFundingRate(60 * 60, 100, 100),
    "vault.setFundingRate"
  );

  await sendTxn(vault.setInManagerMode(true), "vault.setInManagerMode");
  await sendTxn(vault.setManager(xlxManager.address, true), "vault.setManager");

  await sendTxn(
    vault.setFees(
      10, // _taxBasisPoints
      5, // _stableTaxBasisPoints
      20, // _mintBurnFeeBasisPoints
      20, // _swapFeeBasisPoints
      1, // _stableSwapFeeBasisPoints
      10, // _marginFeeBasisPoints
      toUsd(2), // _liquidationFeeUsd
      24 * 60 * 60, // _minProfitTime
      true // _hasDynamicFees
    ),
    "vault.setFees"
  );

  const vaultErrorController = await deployContract("VaultErrorController", []);
  // const vaultErrorController = await contractAt(
  //   "VaultErrorController",
  //   "0x3E1f69a3D8DC6dF2402E7b610Fa9F7cCa9A12C45"
  // );
  await sendTxn(
    vault.setErrorController(vaultErrorController.address),
    "vault.setErrorController"
  );
  await sendTxn(
    vaultErrorController.setErrors(vault.address, errors),
    "vaultErrorController.setErrors"
  );

  const vaultUtils = await deployContract("VaultUtils", [vault.address]);
  await sendTxn(vault.setVaultUtils(vaultUtils.address), "vault.setVaultUtils");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
