import { ethers } from "ethers";

const { parseEther } = ethers.utils;

export const AVALANCHE = 43113; //43114
export const ARBITRUM = 42161;

export const DEFAULT_CHAIN_ID = AVALANCHE;
export const CHAIN_ID = DEFAULT_CHAIN_ID;

export const SUPPORTED_CHAIN_IDS = [AVALANCHE];

export const IS_NETWORK_DISABLED = {
  [AVALANCHE]: false,
  [ARBITRUM]: true,
};

export const CHAIN_NAMES_MAP = {
  [AVALANCHE]: "Avalanche Fuji",
  [ARBITRUM]: "Arbitrum",
};

export const GAS_PRICE_ADJUSTMENT_MAP = {
  [AVALANCHE]: "2000000000",
  [ARBITRUM]: "0",
};

export const MAX_GAS_PRICE_MAP = {
  [AVALANCHE]: "40000000000", // 200 gwei
};

export const HIGH_EXECUTION_FEES_MAP = {
  [AVALANCHE]: 3, // 3 USD
  [ARBITRUM]: 3, // 3 USD
};

const constants = {
  [AVALANCHE]: {
    nativeTokenSymbol: "AVAX",
    wrappedTokenSymbol: "WAVAX",
    defaultCollateralSymbol: "USDC",
    defaultFlagOrdersEnabled: true,
    positionReaderPropsLength: 9,
    v2: true,

    SWAP_ORDER_EXECUTION_GAS_FEE: parseEther("0.0003"),
    INCREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.0003"),
    DECREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.000300001"),
  },
  [ARBITRUM]: {
    nativeTokenSymbol: "ETH",
    wrappedTokenSymbol: "WETH",
    defaultCollateralSymbol: "USDC",
    defaultFlagOrdersEnabled: false,
    positionReaderPropsLength: 9,
    v2: true,

    SWAP_ORDER_EXECUTION_GAS_FEE: parseEther("0.0003"),
    INCREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.0003"),
    DECREASE_ORDER_EXECUTION_GAS_FEE: parseEther("0.000300001"),
  },
};

// export const AVALANCHE_RPC_PROVIDERS = ["https://api.avax.network/ext/bc/C/rpc"];
export const AVALANCHE_RPC_PROVIDERS = ["https://api.avax-test.network/ext/bc/C/rpc"];
export const ARBITRUM_RPC_PROVIDERS = ["https://api.avax-test.network/ext/bc/C/rpc"];

export const RPC_PROVIDERS = {
  [AVALANCHE]: AVALANCHE_RPC_PROVIDERS,
  [ARBITRUM]: ARBITRUM_RPC_PROVIDERS,
};

export const FALLBACK_PROVIDERS = {
  [AVALANCHE]: ["https://avax-mainnet.gateway.pokt.network/v1/lb/626f37766c499d003aada23b"],
  [ARBITRUM]: ["https://avax-mainnet.gateway.pokt.network/v1/lb/626f37766c499d003aada23b"],
};

export const NETWORK_METADATA = {
  [AVALANCHE]: {
    chainId: "0x" + AVALANCHE.toString(16),
    chainName: "Avalanche",
    nativeCurrency: {
      name: "AVAX",
      symbol: "AVAX",
      decimals: 18,
    },
    rpcUrls: AVALANCHE_RPC_PROVIDERS,
    blockExplorerUrls: [getExplorerUrl(AVALANCHE)],
  },
  [ARBITRUM]: {
    chainId: "0x" + ARBITRUM.toString(16),
    chainName: "Arbitrum",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ARBITRUM_RPC_PROVIDERS,
    blockExplorerUrls: [getExplorerUrl(ARBITRUM)],
  },
};

export const getConstant = (chainId: number, key: string) => {
  if (!constants[chainId]) {
    throw new Error(`Unsupported chainId ${chainId}`);
  }

  if (!(key in constants[chainId])) {
    throw new Error(`Key ${key} does not exist for chainId ${chainId}`);
  }

  return constants[chainId][key];
};

export function getChainName(chainId: number) {
  return CHAIN_NAMES_MAP[chainId];
}

export function getExplorerUrl(chainId) {
  if (chainId === AVALANCHE) {
    // return "https://snowtrace.io/";
    return "https://testnet.snowtrace.io/";
  } else if (chainId === ARBITRUM) {
    return "https://arbiscan.io/";
  }

  return "https://testnet.snowtrace.io/";
}

export function getHighExecutionFee(chainId) {
  return HIGH_EXECUTION_FEES_MAP[chainId] || 3;
}

export function isSupportedChain(chainId) {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
}
