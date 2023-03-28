import { ethers } from "ethers";
import { getContract } from "./contracts";
import { ARBITRUM, AVALANCHE } from "./chains";
import { Token } from "domain/tokens";

export const TOKENS: { [chainId: number]: Token[] } = {
  [AVALANCHE]: [
    {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
    {
      name: "Wrapped AVAX",
      symbol: "WAVAX",
      decimals: 18,
      address: "0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3",
      isWrapped: true,
      baseSymbol: "AVAX",
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      address: "0x8226EC2c1926c9162b6F815153d10018A7ccdf07",
      decimals: 18,
      isShortable: true,
      baseSymbol: "ETH",
      imageUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    {
      name: "USDC",
      symbol: "USDC",
      address: "0xC492c8d82DC576Ad870707bb40EDb63E2026111E",
      decimals: 6,
      isStable: true,
      isShortable: false,
      imageUrl: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389",
    },
  ],
  [ARBITRUM]: [
    {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
      address: ethers.constants.AddressZero,
      isNative: true,
      isShortable: true,
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
    {
      name: "Wrapped AVAX",
      symbol: "WAVAX",
      decimals: 18,
      address: "0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3",
      isWrapped: true,
      baseSymbol: "AVAX",
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      address: "0x8226EC2c1926c9162b6F815153d10018A7ccdf07",
      decimals: 18,
      isShortable: true,
      baseSymbol: "ETH",
      imageUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    },
    {
      name: "USDC",
      symbol: "USDC",
      address: "0xC492c8d82DC576Ad870707bb40EDb63E2026111E",
      decimals: 6,
      isStable: true,
      isShortable: false,
      imageUrl: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389",
    },
  ],
};

export const ADDITIONAL_TOKENS: { [chainId: number]: Token[] } = {
  [AVALANCHE]: [
    {
      name: "XDX",
      symbol: "$XDX",
      address: getContract(AVALANCHE, "XDX"),
      decimals: 18,
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
    {
      name: "Escrowed XDX",
      symbol: "esXDX",
      address: getContract(AVALANCHE, "ES_XDX"),
      decimals: 18,
    },
    {
      name: "$XLX",
      symbol: "$XLX",
      address: getContract(AVALANCHE, "XLX"),
      decimals: 18,
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
  ],
  [ARBITRUM]: [
    {
      name: "XDX",
      symbol: "$XDX",
      address: getContract(AVALANCHE, "XDX"),
      decimals: 18,
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
    {
      name: "Escrowed XDX",
      symbol: "esXDX",
      address: getContract(AVALANCHE, "ES_XDX"),
      decimals: 18,
    },
    {
      name: "$XLX",
      symbol: "$XLX",
      address: getContract(AVALANCHE, "XLX"),
      decimals: 18,
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
  ],
};

export const PLATFORM_TOKENS: { [chainId: number]: { [symbol: string]: Token } } = {
  [AVALANCHE]: {
    XDX: {
      name: "XDX",
      symbol: "$XDX",
      decimals: 18,
      address: getContract(AVALANCHE, "XDX"),
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
    XLX: {
      name: "$XLX",
      symbol: "$XLX",
      decimals: 18,
      address: getContract(AVALANCHE, "StakedXLXTracker"),
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
  },
  [ARBITRUM]: {
    XDX: {
      name: "XDX",
      symbol: "$XDX",
      decimals: 18,
      address: getContract(AVALANCHE, "XDX"),
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
    XLX: {
      name: "$XLX",
      symbol: "$XLX",
      decimals: 18,
      address: getContract(AVALANCHE, "StakedXLXTracker"),
      imageUrl: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    },
  },
};

export const ICONLINKS = {
  [AVALANCHE]: {
    XDX: {
      avalanche: "https://snowtrace.io/address/0x27Ab3310791372526F86f32F6f240347F96C43B8",
    },
    XLX: {
      avalanche: "https://snowtrace.io/address/0xD4211A8E6Ef4302a521F4dD718f978fE31564E75",
    },
    AVAX: {
      coingecko: "https://www.coingecko.com/en/coins/avalanche",
      avalanche: "https://snowtrace.io/address/0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/ethereum",
      avalanche: "https://snowtrace.io/address/0x8226EC2c1926c9162b6F815153d10018A7ccdf07",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      avalanche: "https://snowtrace.io/address/0xC492c8d82DC576Ad870707bb40EDb63E2026111E",
    },
  },
  [ARBITRUM]: {
    XDX: {
      avalanche: "https://snowtrace.io/address/0x27Ab3310791372526F86f32F6f240347F96C43B8",
    },
    XLX: {
      avalanche: "https://snowtrace.io/address/0xD4211A8E6Ef4302a521F4dD718f978fE31564E75",
    },
    AVAX: {
      coingecko: "https://www.coingecko.com/en/coins/avalanche",
      avalanche: "https://snowtrace.io/address/0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3",
    },
    ETH: {
      coingecko: "https://www.coingecko.com/en/coins/ethereum",
      avalanche: "https://snowtrace.io/address/0x8226EC2c1926c9162b6F815153d10018A7ccdf07",
    },
    USDC: {
      coingecko: "https://www.coingecko.com/en/coins/usd-coin",
      avalanche: "https://snowtrace.io/address/0xC492c8d82DC576Ad870707bb40EDb63E2026111E",
    },
  },
};

export const XLX_POOL_COLORS = {
  ETH: "#6062a6",
  USDC: "#2775CA",
};

export const TOKENS_MAP: { [chainId: number]: { [address: string]: Token } } = {};
export const TOKENS_BY_SYMBOL_MAP: { [chainId: number]: { [symbol: string]: Token } } = {};
export const WRAPPED_TOKENS_MAP: { [chainId: number]: Token } = {};
export const NATIVE_TOKENS_MAP: { [chainId: number]: Token } = {};

const CHAIN_IDS = [AVALANCHE, ARBITRUM];

for (let j = 0; j < CHAIN_IDS.length; j++) {
  const chainId = CHAIN_IDS[j];
  TOKENS_MAP[chainId] = {};
  TOKENS_BY_SYMBOL_MAP[chainId] = {};
  let tokens = TOKENS[chainId];
  if (ADDITIONAL_TOKENS[chainId]) {
    tokens = tokens.concat(ADDITIONAL_TOKENS[chainId]);
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    TOKENS_MAP[chainId][token.address] = token;
    TOKENS_BY_SYMBOL_MAP[chainId][token.symbol] = token;
  }
}

for (const chainId of CHAIN_IDS) {
  for (const token of TOKENS[chainId]) {
    if (token.isWrapped) {
      WRAPPED_TOKENS_MAP[chainId] = token;
    } else if (token.isNative) {
      NATIVE_TOKENS_MAP[chainId] = token;
    }
  }
}

export function getWrappedToken(chainId: number) {
  return WRAPPED_TOKENS_MAP[chainId];
}

export function getNativeToken(chainId: number) {
  return NATIVE_TOKENS_MAP[chainId];
}

export function getTokens(chainId: number) {
  return TOKENS[chainId];
}

export function isValidToken(chainId: number, address: string) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }
  return address in TOKENS_MAP[chainId];
}

export function getToken(chainId: number, address: string) {
  if (!TOKENS_MAP[chainId]) {
    throw new Error(`Incorrect chainId ${chainId}`);
  }

  if (!TOKENS_MAP[chainId][address]) {
    throw new Error(`Incorrect address "${address}" for chainId ${chainId}`);
  }
  return TOKENS_MAP[chainId][address];
}

export function getTokenBySymbol(chainId: number, symbol: string) {
  const token = TOKENS_BY_SYMBOL_MAP[chainId][symbol];
  if (!token) {
    throw new Error(`Incorrect symbol "${symbol}" for chainId ${chainId}`);
  }
  return token;
}

export function getWhitelistedTokens(chainId: number) {
  return TOKENS[chainId].filter((token) => token.symbol !== "USDG");
}

export function getVisibleTokens(chainId: number) {
  return getWhitelistedTokens(chainId).filter((token) => !token.isWrapped && !token.isTempHidden);
}
