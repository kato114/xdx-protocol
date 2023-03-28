const { deployContract, contractAt, sendTxn } = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");
const { toUsd } = require("../../test/shared/units");
const { errors } = require("../../test/core/Vault/helpers");

async function main() {
  const esXDX = await contractAt(
    "EsXDX",
    "0xB175355B199A3bcaEa2cE6e2E6Bdc76ddaB03eDF"
  );

  const distributors = [
    "0xEB3E5EF00D1528D90BCA8bfCa8aa730E310788Ba",
    "0x3B7fDb5025b3d4FD7E743271AF76a3CBAF61D850",
    "0xF66ad33Bd71E5F94F6565c29BfcaA7900936bcaB",
  ];

  for (var i = 0; i < distributors.length; i++) {
    await sendTxn(
      esXDX.mint(distributors[i], "1000000000000000000000000"),
      "esXDX.mint"
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
