const {
  deployContract,
  contractAt,
  writeTmpAddresses,
  sendTxn,
} = require("../shared/helpers");

const network = process.env.HARDHAT_NETWORK || "mainnet";

const priceFeedList = [
  "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
  "0x6970460aabF80C5BE983C6b74e5D06dEDCA95D4A",
  "0xd0C7101eACbB49F3deCcCc166d238410D6D46d57",
  "0xaD1d5344AaDE45F43E596773Bcc4c423EAbdD034",
  "0x86E53CF1B870786351Da77A57575e79CB55812CB",
  "0x0809E3d38d1B4214958faf06D8b1B1a2b73f2ab8",
  "0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7",
  "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3",
  "0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB",
];

async function main() {
  const feedEvent = await deployContract(
    "FastPriceEvents",
    [],
    "FastPriceEvents"
  );
  // const feedEvent = await contractAt(
  //   "FastPriceEvents",
  //   "0x18Dc3Eab019517A6b8cB625FbFaf806eBAf96Df1"
  // );

  for (let i = 0; i < priceFeedList.length; i++) {
    console.log(priceFeedList[i]);
    await sendTxn(
      feedEvent.setIsPriceFeed(priceFeedList[i], true),
      "feedEvent.setIsPriceFeed"
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
