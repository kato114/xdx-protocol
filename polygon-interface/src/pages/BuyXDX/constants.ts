import { ARBITRUM, AVALANCHE } from "config/chains";
import { getContract } from "config/contracts";

const ARBITRUM_XDX = getContract(ARBITRUM, "XDX");
const AVALANCHE_XDX = getContract(AVALANCHE, "XDX");

type Exchange = {
  name: string;
  icon: string;
  networks: number[];
  link?: string;
  links?: { [ARBITRUM]: string; [AVALANCHE]: string };
};

export const EXTERNAL_LINKS = {
  [ARBITRUM]: {
    bungee: `https://multitx.bungee.exchange/?toChainId=42161&toTokenAddress=${ARBITRUM_XDX}`,
    banxa: "https://xdx.banxa.com/?coinType=ETH&fiatType=USD&fiatAmount=500&blockchain=arbitrum",
    o3: "https://o3swap.com/",
    networkWebsite: "https://arbitrum.io/",
    buyXDX: {
      banxa: "https://xdx.banxa.com/?coinType=XDX&fiatType=USD&fiatAmount=500&blockchain=arbitrum",
      uniswap: `https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=${ARBITRUM_XDX}`,
    },
  },
  [AVALANCHE]: {
    bungee: `https://multitx.bungee.exchange/?toChainId=43114&toTokenAddress=${AVALANCHE_XDX}`,
    banxa: "https://xdx.banxa.com/?coinType=AVAX&fiatType=USD&fiatAmount=500&blockchain=avalanche",
    networkWebsite: "https://www.avax.network/",
    buyXDX: {
      banxa: "https://xdx.banxa.com/?coinType=XDX&fiatType=USD&fiatAmount=500&blockchain=avalanche",
      traderjoe: `http://test.hurricaneswap.com/#/swap?outputCurrency=${AVALANCHE_XDX}`,
    },
  },
};

export const TRANSFER_EXCHANGES: Exchange[] = [
  {
    name: "Binance",
    icon: "ic_binance.svg",
    networks: [ARBITRUM, AVALANCHE],
    link: "https://www.binance.com/en/trade/",
  },
  {
    name: "Synapse",
    icon: "ic_synapse.svg",
    networks: [ARBITRUM, AVALANCHE],
    link: "https://synapseprotocol.com/",
  },
  {
    name: "Arbitrum",
    icon: "ic_arbitrum_24.svg",
    networks: [ARBITRUM],
    link: "https://bridge.arbitrum.io/",
  },
  {
    name: "Avalanche",
    icon: "ic_avax_30.svg",
    networks: [AVALANCHE],
    link: "https://bridge.avax.network/",
  },
  {
    name: "Hop",
    icon: "ic_hop.svg",
    networks: [ARBITRUM],
    link: "https://app.hop.exchange/send?token=ETH&sourceNetwork=ethereum&destNetwork=arbitrum",
  },
  {
    name: "Bungee",
    icon: "ic_bungee.png",
    networks: [ARBITRUM, AVALANCHE],
    link: "https://multitx.bungee.exchange",
  },
  {
    name: "Multiswap",
    icon: "ic_multiswap.svg",
    networks: [ARBITRUM, AVALANCHE],
    link: "https://app.multichain.org/#/router",
  },
  {
    name: "O3",
    icon: "ic_o3.png",
    networks: [ARBITRUM, AVALANCHE],
    link: "https://o3swap.com/",
  },
  {
    name: "Across",
    icon: "ic_across.svg",
    networks: [ARBITRUM],
    link: "https://across.to/",
  },
];

export const CENTRALISED_EXCHANGES: Exchange[] = [
  {
    name: "Binance",
    icon: "ic_binance.svg",
    link: "https://www.binance.com/en/trade/XDX_USDT?_from=markets",
    networks: [ARBITRUM, AVALANCHE],
  },
  {
    name: "Bybit",
    icon: "ic_bybit.svg",
    link: "https://www.bybit.com/en-US/trade/spot/XDX/USDT",
    networks: [ARBITRUM, AVALANCHE],
  },
  {
    name: "Kucoin",
    icon: "ic_kucoin.svg",
    link: "https://www.kucoin.com/trade/XDX-USDT",
    networks: [ARBITRUM, AVALANCHE],
  },
  {
    name: "Huobi",
    icon: "ic_huobi.svg",
    link: "https://www.huobi.com/en-us/exchange/xdx_usdt/",
    networks: [ARBITRUM, AVALANCHE],
  },
];

export const DECENTRALISED_AGGRIGATORS: Exchange[] = [
  {
    name: "1inch",
    icon: "ic_1inch.svg",
    links: {
      [ARBITRUM]: "https://app.1inch.io/#/42161/unified/swap/ETH/XDX",
      [AVALANCHE]: "https://app.1inch.io/#/43114/unified/swap/AVAX/XDX",
    },
    networks: [ARBITRUM, AVALANCHE],
  },
  {
    name: "Matcha",
    icon: "ic_matcha.png",
    links: {
      [ARBITRUM]: `https://www.matcha.xyz/markets/42161/${ARBITRUM_XDX}`,
      [AVALANCHE]: `https://www.matcha.xyz/markets/43114/${AVALANCHE_XDX}`,
    },
    networks: [ARBITRUM, AVALANCHE],
  },
  {
    name: "Paraswap",
    icon: "ic_paraswap.svg",
    links: {
      [ARBITRUM]: "https://app.paraswap.io/#/?network=arbitrum",
      [AVALANCHE]: "https://app.paraswap.io/#/?network=avalanche",
    },
    networks: [ARBITRUM, AVALANCHE],
  },
  {
    name: "Firebird",
    icon: "ic_firebird.png",
    link: "https://app.firebird.finance/swap",
    networks: [ARBITRUM, AVALANCHE],
  },
  {
    name: "OpenOcean",
    icon: "ic_openocean.svg",
    links: {
      [ARBITRUM]: "https://app.openocean.finance/CLASSIC#/ARBITRUM/ETH/XDX",
      [AVALANCHE]: "https://app.openocean.finance/CLASSIC#/AVAX/AVAX/XDX",
    },
    networks: [ARBITRUM, AVALANCHE],
  },
  {
    name: "DODO",
    icon: "ic_dodo.svg",
    links: {
      [ARBITRUM]: `https://app.dodoex.io/?from=ETH&to=${ARBITRUM_XDX}&network=arbitrum`,
      [AVALANCHE]: `https://app.dodoex.io/?from=AVAX&to=${AVALANCHE_XDX}&network=avalanche`,
    },
    networks: [ARBITRUM, AVALANCHE],
  },
  {
    name: "Odos",
    icon: "ic_odos.png",
    link: "https://app.odos.xyz/",
    networks: [ARBITRUM],
  },
  {
    name: "Slingshot",
    icon: "ic_slingshot.svg",
    link: "https://app.slingshot.finance/swap/ETH",
    networks: [ARBITRUM],
  },
  {
    name: "Yieldyak",
    icon: "ic_yield_yak.png",
    link: "https://yieldyak.com/swap",
    networks: [AVALANCHE],
  },
];
