const {
  deployContract,
  contractAt,
  sendTxn,
  writeTmpAddresses,
} = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");

const network = process.env.HARDHAT_NETWORK || "mainnet";
const tokens = require("./tokens")[network];

async function main() {
  const { nativeToken } = tokens;

  const orderBook = await deployContract("OrderBook", []);

  await sendTxn(
    orderBook.initialize(
      "0x064740A971Ba8a19225BC509853F4b32Ba2E3aED", // router
      "0xb878f1fc91a40f06050f621E49B077088E142D1e", // vault
      nativeToken.address, // weth
      "0x8614A398C0a7fF5063d4a7CB841c62Af42cF9f32", // usdg
      "10000000000000000", // 0.01 MATIC
      expandDecimals(10, 30) // min purchase token amount usd
    ),
    "orderBook.initialize"
  );

  writeTmpAddresses({
    orderBook: orderBook.address,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
