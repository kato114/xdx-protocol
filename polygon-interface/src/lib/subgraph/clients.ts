import { createClient } from "./utils";
import { SUBGRAPH_URLS } from "config/subgraph";
import { ARBITRUM, AVALANCHE } from "config/chains";

export const chainlinkClient = createClient(SUBGRAPH_URLS.common.chainLink);

export const arbitrumGraphClient = createClient(SUBGRAPH_URLS[ARBITRUM].stats);
export const arbitrumReferralsGraphClient = createClient(SUBGRAPH_URLS[ARBITRUM].referrals);
export const nissohGraphClient = createClient(SUBGRAPH_URLS[ARBITRUM].trades);

export const avalancheGraphClient = createClient(SUBGRAPH_URLS[AVALANCHE].stats);
export const avalancheReferralsGraphClient = createClient(SUBGRAPH_URLS[AVALANCHE].referrals);
export const avalancheGraphClientForTrades = createClient(SUBGRAPH_URLS[AVALANCHE].trades);

export function getXDXGraphClient(chainId: number) {
  if (chainId === ARBITRUM) {
    return arbitrumGraphClient;
  } else if (chainId === AVALANCHE) {
    return avalancheGraphClient;
  }

  throw new Error(`Unsupported chain ${chainId}`);
}
