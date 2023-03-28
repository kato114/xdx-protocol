const {
  deployContract,
  contractAt,
  writeTmpAddresses,
  sendTxn,
} = require("../shared/helpers");

async function main() {
  const tokenManager = await deployContract(
    "TokenManager",
    [1],
    "TokenManager"
  );

  const signers = ["0xEc181cF3a8660FC9240f4D72008b4fb71026933C"];

  await sendTxn(tokenManager.initialize(signers), "tokenManager.initialize");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
