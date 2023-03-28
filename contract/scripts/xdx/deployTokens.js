const {
  deployContract,
  contractAt,
  writeTmpAddresses,
} = require("../shared/helpers");

async function main() {
  await deployContract("EsXDX", []);
  await deployContract("MintableBaseToken", ["EsXDX IOU", "EsXDX:IOU", 0]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
