const { deployContract, contractAt, sendTxn } = require("../shared/helpers");
const { expandDecimals } = require("../../test/shared/utilities");
const { toUsd } = require("../../test/shared/units");
const { errors } = require("../../test/core/Vault/helpers");

const tokenList = [
  {
    _token: "0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3",
    _tokenName: "AVAX",
    _priceFeed: "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD",
    _priceDecimals: 8,
    _isStrictStable: false,
  },
  {
    _token: "0x8226EC2c1926c9162b6F815153d10018A7ccdf07",
    _tokenName: "ETH",
    _priceFeed: "0x86d67c3D38D2bCeE722E601025C25a575021c6EA",
    _priceDecimals: 8,
    _isStrictStable: false,
  },
  {
    _token: "0xC492c8d82DC576Ad870707bb40EDb63E2026111E",
    _tokenName: "USDC",
    _priceFeed: "0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad",
    _priceDecimals: 8,
    _isStrictStable: true,
  },
];

async function main() {
  const vaultPriceFeed = await contractAt(
    "VaultPriceFeed",
    "0x8Ceb2A921dd39f0225a52205163DC48060435F1f"
  );

  for (let i = 0; i < tokenList.length; i++) {
    await sendTxn(
      vaultPriceFeed.setTokenConfig(
        tokenList[i]["_token"],
        tokenList[i]["_priceFeed"],
        tokenList[i]["_priceDecimals"],
        tokenList[i]["_isStrictStable"]
      ),
      "vaultPriceFeed.setTokenConfig " + tokenList[i]["_tokenName"]
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
