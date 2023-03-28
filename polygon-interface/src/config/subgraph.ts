import { ARBITRUM, AVALANCHE } from "./chains";

export const SUBGRAPH_URLS = {
  [AVALANCHE]: {
    stats: "https://api.thegraph.com/subgraphs/name/strongnezha/xdx-stats",
    referrals: "https://api.thegraph.com/subgraphs/name/strongnezha/xdx-referrals",
    trades: "https://api.thegraph.com/subgraphs/name/strongnezha/xdx-trades",
  },
  [ARBITRUM]: {
    stats: "https://api.thegraph.com/subgraphs/name/strongnezha/xdx-stats",
    referrals: "https://api.thegraph.com/subgraphs/name/strongnezha/xdx-referrals",
    trades: "https://api.thegraph.com/subgraphs/name/strongnezha/xdx-trades",
  },

  common: {
    chainLink: "https://api.thegraph.com/subgraphs/name/deividask/chainlink",
  },
};
