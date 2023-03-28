const { deployContract, contractAt, sendTxn } = require("../shared/helpers");

const tokenList = [
  {
    _tokenName: "AVAX",
    _token: "0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3",
    _tokenDecimals: 18,
    _tokenWeight: 2500,
    _minProfitBps: 150,
    _maxUsdgAmount: "30000000000000000000000000",
    _isStable: false,
    _isShortable: true,
  },
  {
    _tokenName: "ETH",
    _token: "0x8226EC2c1926c9162b6F815153d10018A7ccdf07",
    _tokenDecimals: 18,
    _tokenWeight: 2500,
    _minProfitBps: 150,
    _maxUsdgAmount: "30000000000000000000000000",
    _isStable: false,
    _isShortable: true,
  },
  {
    _tokenName: "USDC",
    _token: "0xC492c8d82DC576Ad870707bb40EDb63E2026111E",
    _tokenDecimals: 6,
    _tokenWeight: 2500,
    _minProfitBps: 150,
    _maxUsdgAmount: "30000000000000000000000000",
    _isStable: true,
    _isShortable: false,
  },
];

async function main() {
  const vault = await contractAt(
    "Vault",
    "0xb878f1fc91a40f06050f621E49B077088E142D1e"
  );

  for (let i = 0; i < tokenList.length; i++) {
    console.log(tokenList[i]["_tokenName"]);

    await sendTxn(
      vault.setTokenConfig(
        tokenList[i]["_token"],
        tokenList[i]["_tokenDecimals"],
        tokenList[i]["_tokenWeight"],
        tokenList[i]["_minProfitBps"],
        tokenList[i]["_maxUsdgAmount"],
        tokenList[i]["_isStable"],
        tokenList[i]["_isShortable"]
      ),
      "vault.setTokenConfig " + tokenList[i]["_tokenName"]
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
