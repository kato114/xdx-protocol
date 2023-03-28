import { BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { ChainlinkPrice, UniswapPrice } from "../generated/schema";

export let BASIS_POINTS_DIVISOR = BigInt.fromI32(10000);
export let PRECISION = BigInt.fromI32(10).pow(30);

export let XDX = "0x27Ab3310791372526F86f32F6f240347F96C43B8";
export let AVAX = "0x1D308089a2D1Ced3f1Ce36B1FcaF815b07217be3";
export let ETH = "0x8226EC2c1926c9162b6F815153d10018A7ccdf07";
export let USDC = "0xC492c8d82DC576Ad870707bb40EDb63E2026111E";

export function timestampToDay(timestamp: BigInt): BigInt {
  return timestampToPeriod(timestamp, "daily");
}

export function timestampToPeriod(timestamp: BigInt, period: string): BigInt {
  let periodTime: BigInt;

  if (period == "daily") {
    periodTime = BigInt.fromI32(86400);
  } else if (period == "hourly") {
    periodTime = BigInt.fromI32(3600);
  } else if (period == "weekly") {
    periodTime = BigInt.fromI32(86400 * 7);
  } else {
    throw new Error("Unsupported period " + period);
  }

  return (timestamp / periodTime) * periodTime;
}

export function getTokenDecimals(token: String): u8 {
  let tokenDecimals = new Map<String, i32>();
  tokenDecimals.set(XDX, 18);
  tokenDecimals.set(AVAX, 18);
  tokenDecimals.set(ETH, 18);
  tokenDecimals.set(USDC, 6);

  return tokenDecimals.get(token) as u8;
}

export function getTokenAmountUsd(token: String, amount: BigInt): BigInt {
  let decimals = getTokenDecimals(token);
  let denominator = BigInt.fromI32(10).pow(decimals);
  let price = getTokenPrice(token);
  return (amount * price) / denominator;
}

export function getTokenPrice(token: String): BigInt {
  if (token != XDX) {
    let chainlinkPriceEntity = ChainlinkPrice.load(token);
    if (chainlinkPriceEntity != null) {
      // all chainlink prices have 8 decimals
      // adjusting them to fit XDX 30 decimals USD values
      return chainlinkPriceEntity.value * BigInt.fromI32(10).pow(22);
    }
  }

  if (token == XDX) {
    let uniswapPriceEntity = UniswapPrice.load(XDX);

    if (uniswapPriceEntity != null) {
      return uniswapPriceEntity.value;
    }
  }

  let prices = new TypedMap<String, BigInt>();
  prices.set(XDX, PRECISION);
  prices.set(AVAX, PRECISION);
  prices.set(ETH, PRECISION);
  prices.set(USDC, PRECISION);

  return prices.get(token) as BigInt;
}
