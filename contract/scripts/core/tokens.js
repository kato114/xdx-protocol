// price feeds https://docs.chain.link/docs/binance-smart-chain-addresses/
const { expandDecimals } = require("../../test/shared/utilities");

module.exports = {
  avalanche: {
    nativeToken: {
      name: "avax",
      address: "0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3",
      decimals: 18,
    },
    eth: {
      name: "eth",
      address: "0x8226EC2c1926c9162b6F815153d10018A7ccdf07",
      decimals: 18,
    },
    usdc: {
      name: "usdc",
      address: "0xC492c8d82DC576Ad870707bb40EDb63E2026111E",
      decimals: 6,
    },
  },
};
