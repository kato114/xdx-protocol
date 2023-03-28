import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import { Trans, t } from "@lingui/macro";
import useSWR from "swr";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import TooltipComponent from "components/Tooltip/Tooltip";

import hexToRgba from "hex-to-rgba";
import { ethers } from "ethers";

import {
  USD_DECIMALS,
  XDX_DECIMALS,
  XLX_DECIMALS,
  BASIS_POINTS_DIVISOR,
  DEFAULT_MAX_USDG_AMOUNT,
  getPageTitle,
  importImage,
  arrayURLFetcher,
} from "lib/legacy";
import {
  useTotalXDXInLiquidity,
  useXDXPrice,
  useTotalXDXStaked,
  useTotalXDXSupply,
  useTradeVolumeHistory,
  usePositionStates,
  useTotalVolume,
  useFeesData,
  useVolumeData,
  formatNumber,
} from "domain/legacy";
import useFeesSummary from "domain/useFeesSummary";

import { getContract } from "config/contracts";

import VaultV2 from "abis/VaultV2.json";
import ReaderV2 from "abis/ReaderV2.json";
import XLXManager from "abis/XLXManager.json";
import Footer from "components/Footer/Footer";

import "./DashboardV2.css";

import xdx40Icon from "img/ic_xdx_40.svg";
import xlx40Icon from "img/ic_xlx_40.svg";
import avalanche16Icon from "img/ic_avalanche_16.svg";
import arbitrum16Icon from "img/ic_arbitrum_16.svg";
import arbitrum24Icon from "img/ic_arbitrum_24.svg";
import avalanche24Icon from "img/ic_avalanche_24.svg";

import AssetDropdown from "./AssetDropdown";
import ExternalLink from "components/ExternalLink/ExternalLink";
import SEO from "components/Common/SEO";
import StatsTooltip from "components/StatsTooltip/StatsTooltip";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import { ARBITRUM, AVALANCHE, getChainName } from "config/chains";
import { getServerUrl } from "config/backend";
import { contractFetcher } from "lib/contracts";
import { useInfoTokens } from "domain/tokens";
import { getTokenBySymbol, getWhitelistedTokens, XLX_POOL_COLORS } from "config/tokens";
import { bigNumberify, expandDecimals, formatAmount, formatKeyAmount, numberWithCommas } from "lib/numbers";
import { useChainId } from "lib/chains";
import { formatDate } from "lib/dates";
const ACTIVE_CHAIN_IDS = [ARBITRUM, AVALANCHE];

const { AddressZero } = ethers.constants;

function getVolumeInfo(hourlyVolumes) {
  if (!hourlyVolumes || hourlyVolumes.length === 0) {
    return {};
  }
  const dailyVolumes = hourlyVolumes.map((hourlyVolume) => {
    const secondsPerHour = 60 * 60;
    const minTime = parseInt(Date.now() / 1000 / secondsPerHour) * secondsPerHour - 24 * secondsPerHour;
    const info = {};
    let totalVolume = bigNumberify(0);
    for (let i = 0; i < hourlyVolume.length; i++) {
      const item = hourlyVolume[i].data;
      if (parseInt(item.timestamp) < minTime) {
        break;
      }

      if (!info[item.token]) {
        info[item.token] = bigNumberify(0);
      }

      info[item.token] = info[item.token].add(item.volume);
      totalVolume = totalVolume.add(item.volume);
    }
    info.totalVolume = totalVolume;
    return info;
  });
  return dailyVolumes.reduce(
    (acc, cv, index) => {
      acc.totalVolume = acc.totalVolume.add(cv.totalVolume);
      acc[ACTIVE_CHAIN_IDS[index]] = cv;
      return acc;
    },
    { totalVolume: bigNumberify(0) }
  );
}

function getPositionStats(positionStats) {
  if (!positionStats || positionStats.length === 0) {
    return null;
  }
  return positionStats.reduce(
    (acc, cv, i) => {
      acc.totalLongPositionSizes = acc.totalLongPositionSizes.add(cv.totalLongPositionSizes);
      acc.totalShortPositionSizes = acc.totalShortPositionSizes.add(cv.totalShortPositionSizes);
      acc[ACTIVE_CHAIN_IDS[i]] = cv;
      return acc;
    },
    {
      totalLongPositionSizes: bigNumberify(0),
      totalShortPositionSizes: bigNumberify(0),
    }
  );
}

function getCurrentFeesUsd(tokenAddresses, fees, infoTokens) {
  if (!fees || !infoTokens) {
    return bigNumberify(0);
  }

  let currentFeesUsd = bigNumberify(0);
  for (let i = 0; i < tokenAddresses.length; i++) {
    const tokenAddress = tokenAddresses[i];
    const tokenInfo = infoTokens[tokenAddress];
    if (!tokenInfo || !tokenInfo.contractMinPrice) {
      continue;
    }

    const feeUsd = fees[i].mul(tokenInfo.contractMinPrice).div(expandDecimals(1, tokenInfo.decimals));
    currentFeesUsd = currentFeesUsd.add(feeUsd);
  }
  return currentFeesUsd;
}

export default function DashboardV2() {
  const { active, library } = useWeb3React();
  const { chainId } = useChainId();
  // const totalVolume = useTotalVolume();
  const [totalVolume, totalVolumeDelta] = useVolumeData();

  const chainName = getChainName(chainId);
  // const { data: positionStats } = useSWR(
  //   ACTIVE_CHAIN_IDS.map((chainId) => getServerUrl(chainId, "/position_stats")),
  //   {
  //     fetcher: arrayURLFetcher,
  //   }
  // );
  const positionStats = usePositionStates(chainId);

  // const { data: hourlyVolumes } = useSWR(
  //   ACTIVE_CHAIN_IDS.map((chainId) => getServerUrl(chainId, "/hourly_volume")),
  //   {
  //     fetcher: arrayURLFetcher,
  //   }
  // );

  // const hourlyVolumes = useTradeVolumeHistory(chainId);
  // const dailyVolume = useVolumeData({from: parseInt(Date.now() / 1000) - 86400, to: parseInt(Date.now() / 1000) });

  let { total: totalXDXSupply } = useTotalXDXSupply();

  // const currentVolumeInfo = getVolumeInfo(hourlyVolumes);

  // const positionStatsInfo = getPositionStats(positionStats);
  const positionStatsInfo = positionStats;

  function getWhitelistedTokenAddresses(chainId) {
    const whitelistedTokens = getWhitelistedTokens(chainId);
    return whitelistedTokens.map((token) => token.address);
  }

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
  const visibleTokens = tokenList.filter((t) => !t.isTempHidden);

  const readerAddress = getContract(chainId, "Reader");
  const vaultAddress = getContract(chainId, "Vault");
  const xlxManagerAddress = getContract(chainId, "XLXManager");

  const xdxAddress = getContract(chainId, "XDX");
  const xlxAddress = getContract(chainId, "XLX");
  const usdgAddress = getContract(chainId, "USDG");

  const tokensForSupplyQuery = [xdxAddress, xlxAddress, usdgAddress];

  const { data: aums } = useSWR([`Dashboard:getAums:${active}`, chainId, xlxManagerAddress, "getAums"], {
    fetcher: contractFetcher(library, XLXManager),
  });

  const { data: totalSupplies } = useSWR(
    [`Dashboard:totalSupplies:${active}`, chainId, readerAddress, "getTokenBalancesWithSupplies", AddressZero],
    {
      fetcher: contractFetcher(library, ReaderV2, [tokensForSupplyQuery]),
    }
  );

  const { data: totalTokenWeights } = useSWR(
    [`XLXSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
    {
      fetcher: contractFetcher(library, VaultV2),
    }
  );

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);
  const { infoTokens: infoTokensArbitrum } = useInfoTokens(null, ARBITRUM, active, undefined, undefined);
  const { infoTokens: infoTokensAvax } = useInfoTokens(null, AVALANCHE, active, undefined, undefined);

  const { data: currentFees } = useSWR(
    infoTokensArbitrum[AddressZero].contractMinPrice && infoTokensAvax[AddressZero].contractMinPrice
      ? "Dashboard:currentFees"
      : null,
    {
      fetcher: () => {
        return Promise.all(
          ACTIVE_CHAIN_IDS.map((chainId) =>
            contractFetcher(null, ReaderV2, [getWhitelistedTokenAddresses(chainId)])(
              `Dashboard:fees:${chainId}`,
              chainId,
              getContract(chainId, "Reader"),
              "getFees",
              getContract(chainId, "Vault")
            )
          )
        ).then((fees) => {
          return fees.reduce(
            (acc, cv, i) => {
              const feeUSD = getCurrentFeesUsd(
                getWhitelistedTokenAddresses(ACTIVE_CHAIN_IDS[i]),
                cv,
                ACTIVE_CHAIN_IDS[i] === ARBITRUM ? infoTokensArbitrum : infoTokensAvax
              );
              acc[ACTIVE_CHAIN_IDS[i]] = feeUSD;
              acc.total = acc.total.add(feeUSD);
              return acc;
            },
            { total: bigNumberify(0) }
          );
        });
      },
    }
  );

  const { data: feesSummaryByChain } = useFeesSummary();
  const feesSummary = feesSummaryByChain[chainId];

  const eth = infoTokens[getTokenBySymbol(chainId, "ETH").address];
  const shouldIncludeCurrrentFees =
    feesSummaryByChain[chainId].lastUpdatedAt &&
    parseInt(Date.now() / 1000) - feesSummaryByChain[chainId].lastUpdatedAt > 60 * 60;

  // const totalFees = ACTIVE_CHAIN_IDS.map((chainId) => {
  //   if (shouldIncludeCurrrentFees && currentFees && currentFees[chainId]) {
  //     return currentFees[chainId].div(expandDecimals(1, USD_DECIMALS)).add(feesSummaryByChain[chainId].totalFees || 0);
  //   }

  //   return feesSummaryByChain[chainId].totalFees || 0;
  // })
  //   .map((v) => Math.round(v))
  //   .reduce(
  //     (acc, cv, i) => {
  //       acc[ACTIVE_CHAIN_IDS[i]] = cv;
  //       acc.total = acc.total + cv;
  //       return acc;
  //     },
  //     { total: 0 }
  //   );
  const [totalFees, totalFeesDelta] = useFeesData();

  const { xdxPrice, xdxPriceFromArbitrum, xdxPriceFromAvalanche } = useXDXPrice(
    chainId,
    { arbitrum: chainId === ARBITRUM ? library : undefined },
    active
  );

  let { total: totalXDXInLiquidity } = useTotalXDXInLiquidity(chainId, active);

  let { avax: avaxStakedXDX, arbitrum: arbitrumStakedXDX, total: totalStakedXDX } = useTotalXDXStaked();

  let xdxMarketCap;
  if (xdxPrice && totalXDXSupply) {
    xdxMarketCap = xdxPrice.mul(totalXDXSupply).div(expandDecimals(1, XDX_DECIMALS));
  }

  let stakedXDXSupplyUsd;
  if (xdxPrice && totalStakedXDX) {
    stakedXDXSupplyUsd = totalStakedXDX.mul(xdxPrice).div(expandDecimals(1, XDX_DECIMALS));
  }

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  let xlxPrice;
  let xlxSupply;
  let xlxMarketCap;
  if (aum && totalSupplies && totalSupplies[3]) {
    xlxSupply = totalSupplies[3];
    xlxPrice =
      aum && aum.gt(0) && xlxSupply.gt(0)
        ? aum.mul(expandDecimals(1, XLX_DECIMALS)).div(xlxSupply)
        : expandDecimals(1, USD_DECIMALS);
    xlxMarketCap = xlxPrice.mul(xlxSupply).div(expandDecimals(1, XLX_DECIMALS));
  }

  let tvl;
  if (xlxMarketCap && xdxPrice && totalStakedXDX) {
    tvl = xlxMarketCap.add(xdxPrice.mul(totalStakedXDX).div(expandDecimals(1, XDX_DECIMALS)));
  }

  // const ethFloorPriceFund = expandDecimals(350 + 148 + 384, 18);
  // const xlxFloorPriceFund = expandDecimals(660001, 18);
  // const usdcFloorPriceFund = expandDecimals(784598 + 200000, 30);
  const ethFloorPriceFund = expandDecimals(350, 18);
  const xlxFloorPriceFund = expandDecimals(660, 18);
  const usdcFloorPriceFund = expandDecimals(784 + 200, 30);

  let totalFloorPriceFundUsd;

  if (eth && eth.contractMinPrice && xlxPrice) {
    const ethFloorPriceFundUsd = ethFloorPriceFund.mul(eth.contractMinPrice).div(expandDecimals(1, eth.decimals));
    const xlxFloorPriceFundUsd = xlxFloorPriceFund.mul(xlxPrice).div(expandDecimals(1, 18));

    totalFloorPriceFundUsd = ethFloorPriceFundUsd.add(xlxFloorPriceFundUsd).add(usdcFloorPriceFund);
  }

  let adjustedUsdgSupply = bigNumberify(0);

  for (let i = 0; i < tokenList.length; i++) {
    const token = tokenList[i];
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo && tokenInfo.usdgAmount) {
      adjustedUsdgSupply = adjustedUsdgSupply.add(tokenInfo.usdgAmount);
    }
  }

  const getWeightText = (tokenInfo) => {
    if (
      !tokenInfo.weight ||
      !tokenInfo.usdgAmount ||
      !adjustedUsdgSupply ||
      adjustedUsdgSupply.eq(0) ||
      !totalTokenWeights
    ) {
      return "...";
    }

    const currentWeightBps = tokenInfo.usdgAmount.mul(BASIS_POINTS_DIVISOR).div(adjustedUsdgSupply);
    // use add(1).div(10).mul(10) to round numbers up
    const targetWeightBps = tokenInfo.weight.mul(BASIS_POINTS_DIVISOR).div(totalTokenWeights).add(1).div(10).mul(10);

    const weightText = `${formatAmount(currentWeightBps, 2, 2, false)}% / ${formatAmount(
      targetWeightBps,
      2,
      2,
      false
    )}%`;

    return (
      <TooltipComponent
        handle={weightText}
        position="right-bottom"
        renderContent={() => {
          return (
            <>
              <StatsTooltipRow
                label={t`Current Weight`}
                value={`${formatAmount(currentWeightBps, 2, 2, false)}%`}
                showDollar={false}
              />
              <StatsTooltipRow
                label={t`Target Weight`}
                value={`${formatAmount(targetWeightBps, 2, 2, false)}%`}
                showDollar={false}
              />
              <br />
              {currentWeightBps.lt(targetWeightBps) && (
                <div className="text-white">
                  <Trans>
                    {tokenInfo.symbol} is below its target weight.
                    <br />
                    <br />
                    Get lower fees to{" "}
                    <Link to="/buy_xlx" target="_blank" rel="noopener noreferrer">
                      buy $XLX
                    </Link>{" "}
                    with {tokenInfo.symbol},&nbsp; and to{" "}
                    <Link to="/trade" target="_blank" rel="noopener noreferrer">
                      swap
                    </Link>{" "}
                    {tokenInfo.symbol} for other tokens.
                  </Trans>
                </div>
              )}
              {currentWeightBps.gt(targetWeightBps) && (
                <div className="text-white">
                  <Trans>
                    {tokenInfo.symbol} is above its target weight.
                    <br />
                    <br />
                    Get lower fees to{" "}
                    <Link to="/trade" target="_blank" rel="noopener noreferrer">
                      swap
                    </Link>{" "}
                    tokens for {tokenInfo.symbol}.
                  </Trans>
                </div>
              )}
              <br />
              <div>
                <ExternalLink href="https://xdx.gitbook.io/xdx/">
                  <Trans>More Info</Trans>
                </ExternalLink>
              </div>
            </>
          );
        }}
      />
    );
  };

  let stakedPercent = 0;

  if (totalXDXSupply && !totalXDXSupply.isZero() && !totalStakedXDX.isZero()) {
    stakedPercent = totalStakedXDX.mul(100).div(totalXDXSupply).toNumber();
  }

  let liquidityPercent = 0;

  if (totalXDXSupply && !totalXDXSupply.isZero() && totalXDXInLiquidity) {
    liquidityPercent = totalXDXInLiquidity.mul(100).div(totalXDXSupply).toNumber();
  }

  let notStakedPercent = 100 - stakedPercent - liquidityPercent;

  let xdxDistributionData = [
    {
      name: t`staked`,
      value: stakedPercent,
      color: "#4353fa",
    },
    {
      name: t`in liquidity`,
      value: liquidityPercent,
      color: "#0598fa",
    },
    {
      name: t`not staked`,
      value: notStakedPercent,
      color: "#5c0af5",
    },
  ];

  const totalStatsStartDate = chainId === AVALANCHE ? t`06 Jan 2022` : t`01 Sep 2021`;

  let stableXLX = 0;
  let totalXLX = 0;

  let xlxPool = tokenList.map((token) => {
    const tokenInfo = infoTokens[token.address];
    if (tokenInfo.usdgAmount && adjustedUsdgSupply && adjustedUsdgSupply.gt(0)) {
      const currentWeightBps = tokenInfo.usdgAmount.mul(BASIS_POINTS_DIVISOR).div(adjustedUsdgSupply);
      if (tokenInfo.isStable) {
        stableXLX += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      }
      totalXLX += parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`);
      return {
        fullname: token.name,
        name: token.symbol,
        value: parseFloat(`${formatAmount(currentWeightBps, 2, 2, false)}`),
      };
    }
    return null;
  });

  let stablePercentage = totalXLX > 0 ? ((stableXLX * 100) / totalXLX).toFixed(2) : "0.0";

  xlxPool = xlxPool.filter(function (element) {
    return element !== null;
  });

  xlxPool = xlxPool.sort(function (a, b) {
    if (a.value < b.value) return 1;
    else return -1;
  });

  xdxDistributionData = xdxDistributionData.sort(function (a, b) {
    if (a.value < b.value) return 1;
    else return -1;
  });

  const [xdxActiveIndex, setXDXActiveIndex] = useState(null);

  const onXDXDistributionChartEnter = (_, index) => {
    setXDXActiveIndex(index);
  };

  const onXDXDistributionChartLeave = (_, index) => {
    setXDXActiveIndex(null);
  };

  const [xlxActiveIndex, setXLXActiveIndex] = useState(null);

  const onXLXPoolChartEnter = (_, index) => {
    setXLXActiveIndex(index);
  };

  const onXLXPoolChartLeave = (_, index) => {
    setXLXActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="stats-label">
          <div className="stats-label-color" style={{ backgroundColor: payload[0].color }}></div>
          {payload[0].value}% {payload[0].name}
        </div>
      );
    }

    return null;
  };

  return (
    <SEO title={getPageTitle("Dashboard")}>
      <div className="default-container DashboardV2 page-layout">
        <div className="section-title-block">
          <div className="section-title-icon"></div>
          <div className="section-title-content">
            <div className="Page-title">
              <Trans>Dashboard</Trans>
            </div>
            <div className="Page-description">
              Overview of the XDX exchange protocol.
            </div>
          </div>
        </div>
        <div className="DashboardV2-content">
          <div className="DashboardV2-cards">
            <div className="Dashboard-card">
               <div className="Dashboard-card-title">Trading Volume</div>
               <div className="Dashboard-card-content">{totalVolume ? formatNumber(totalVolume, { currency: true, compact: false }) : `$0`}</div>
               <div className="Dashboard-card-description">exchanged in last 24h</div>
            </div>
            <div className="Dashboard-card">
               <div className="Dashboard-card-title">Open Interest</div>
               <div className="Dashboard-card-content">$0</div>
               <div className="Dashboard-card-description">in open positions on XDX</div>
            </div>
            <div className="Dashboard-card">
               <div className="Dashboard-card-title">Trades</div>
               <div className="Dashboard-card-content">
                { totalVolumeDelta ? formatNumber(totalVolumeDelta, { currency: true, compact: false }) : `$0` }
                </div>
               <div className="Dashboard-card-description">exchanged in last 24h</div>
            </div>
            <div className="Dashboard-card">
               <div className="Dashboard-card-title">XDX Price</div>
               <div className="Dashboard-card-content">${formatAmount(xdxPriceFromAvalanche, USD_DECIMALS, 2, true)}</div>
               <div className="Dashboard-card-description">Last traded price of XDX</div>
            </div>
            <div className="Dashboard-card">
               <div className="Dashboard-card-title">XLX Price</div>
               <div className="Dashboard-card-content">${formatAmount(xlxPrice, USD_DECIMALS, 3, true)}</div>
               <div className="Dashboard-card-description">Last traded price of XDX</div>
            </div>
          </div>
          <div className="DashboardV2-token-cards">
            <div className="section-title-block">
              <div className="section-title-icon"></div>
              <div className="section-title-content">
                <div className="Page-title">
                  <Trans>XLX Index Composition</Trans>
                </div>
                <div className="Page-description">
                  Platform and XLX index tokens.
                </div>
              </div>
            </div>
            <div className="token-table-wrapper App-card">
              <table className="token-table">
                <thead>
                  <tr>
                    <th>
                      <Trans>TOKEN</Trans>
                    </th>
                    <th>
                      <Trans>PRICE</Trans>
                    </th>
                    <th>
                      <Trans>POOL</Trans>
                    </th>
                    <th>
                      <Trans>WEIGHT</Trans>
                    </th>
                    <th>
                      <Trans>UTILIZATION</Trans>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTokens.map((token) => {
                    const tokenInfo = infoTokens[token.address];
                    let utilization = bigNumberify(0);
                    if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                      utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                    }
                    let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
                    if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                      maxUsdgAmount = tokenInfo.maxUsdgAmount;
                    }
                    const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_40.svg");

                    return (
                      <tr key={token.symbol}>
                        <td>
                          <div className="token-symbol-wrapper">
                            <div className="App-card-title-info">
                              <div className="App-card-title-info-icon">
                                <img src={tokenImage} alt={token.symbol} width="20px" />
                              </div>
                              <div className="App-card-title-info-text">
                                <div className="App-card-info-title">{token.name}</div>
                                <div className="App-card-info-subtitle">{token.symbol}</div>
                              </div>
                              <div>
                                <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</td>
                        <td>
                          <TooltipComponent
                            handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  <StatsTooltipRow
                                    label={t`Pool Amount`}
                                    value={`${formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 0, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <StatsTooltipRow
                                    label={t`Target Min Amount`}
                                    value={`${formatKeyAmount(tokenInfo, "bufferAmount", token.decimals, 0, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <StatsTooltipRow
                                    label={t`Max ${tokenInfo.symbol} Capacity`}
                                    value={formatAmount(maxUsdgAmount, 18, 0, true)}
                                    showDollar={true}
                                  />
                                </>
                              );
                            }}
                          />
                        </td>
                        <td>{getWeightText(tokenInfo)}</td>
                        <td>{formatAmount(utilization, 2, 2, false)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="token-grid">
              {visibleTokens.map((token) => {
                const tokenInfo = infoTokens[token.address];
                let utilization = bigNumberify(0);
                if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                  utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                }
                let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
                if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                  maxUsdgAmount = tokenInfo.maxUsdgAmount;
                }

                const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_24.svg");
                return (
                  <div className="App-card" key={token.symbol}>
                    <div className="App-card-title">
                      <div className="mobile-token-card">
                        <img src={tokenImage} alt={token.symbol} width="20px" />
                        <div className="token-symbol-text">{token.symbol}</div>
                        <div>
                          <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                        </div>
                      </div>
                    </div>
                    <div className="App-card-divider"></div>
                    <div className="App-card-content">
                      <div className="App-card-row">
                        <div className="label">
                          <Trans>Price</Trans>
                        </div>
                        <div>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">
                          <Trans>Pool</Trans>
                        </div>
                        <div>
                          <TooltipComponent
                            handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                            position="right-bottom"
                            renderContent={() => {
                              return (
                                <>
                                  <StatsTooltipRow
                                    label={t`Pool Amount`}
                                    value={`${formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 0, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <StatsTooltipRow
                                    label={t`Target Min Amount`}
                                    value={`${formatKeyAmount(tokenInfo, "bufferAmount", token.decimals, 0, true)} ${
                                      token.symbol
                                    }`}
                                    showDollar={false}
                                  />
                                  <StatsTooltipRow
                                    label={t`Max ${tokenInfo.symbol} Capacity`}
                                    value={formatAmount(maxUsdgAmount, 18, 0, true)}
                                  />
                                </>
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">
                          <Trans>Weight</Trans>
                        </div>
                        <div>{getWeightText(tokenInfo)}</div>
                      </div>
                      <div className="App-card-row">
                        <div className="label">
                          <Trans>Utilization</Trans>
                        </div>
                        <div>{formatAmount(utilization, 2, 2, false)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
