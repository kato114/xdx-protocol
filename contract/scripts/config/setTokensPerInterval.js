const { deployContract, contractAt, sendTxn } = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");
const { toUsd } = require("../../test/shared/units");
const { errors } = require("../../test/core/Vault/helpers");

async function main() {
  const stakedXDXChainRewardDistributor = await contractAt(
    "RewardDistributor",
    "0xEB3E5EF00D1528D90BCA8bfCa8aa730E310788Ba"
  );
  const stakedBonusFeeXDXChainRewardDistributor = await contractAt(
    "RewardDistributor",
    "0xF66ad33Bd71E5F94F6565c29BfcaA7900936bcaB"
  );
  const feeXLXRewardDistributor = await contractAt(
    "RewardDistributor",
    "0xa15bC34b204cB41ff0b49cceb3F0aFe376450C24"
  );
  const feeStakedXLXRewardDistributor = await contractAt(
    "RewardDistributor",
    "0x346741b9A83D078fCcA3e65f0E9dd0897ce1c835"
  );

  await sendTxn(
    stakedXDXChainRewardDistributor.setTokensPerInterval("10000000000000000"),
    "stakedXDXChainRewardDistributor.setTokensPerInterval"
  );

  await sendTxn(
    stakedBonusFeeXDXChainRewardDistributor.setTokensPerInterval(
      "10000000000000000"
    ),
    "stakedBonusFeeXDXChainRewardDistributor.setTokensPerInterval"
  );

  await sendTxn(
    feeXLXRewardDistributor.setTokensPerInterval("10000000000000000"),
    "feeXLXRewardDistributor.setTokensPerInterval"
  );

  await sendTxn(
    feeStakedXLXRewardDistributor.setTokensPerInterval("10000000000000000"),
    "feeStakedXLXRewardDistributor.setTokensPerInterval"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
