import React from "react";

import useSWR from "swr";

import {
  PLACEHOLDER_ACCOUNT,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  getVestingData,
  getStakingData,
  getProcessedData,
} from "lib/legacy";

import Vault from "abis/Vault.json";
import ReaderV2 from "abis/ReaderV2.json";
import RewardReader from "abis/RewardReader.json";
import Token from "abis/Token.json";
import XLXManager from "abis/XLXManager.json";

import { useWeb3React } from "@web3-react/core";

import { useXDXPrice } from "domain/legacy";

import { getContract } from "config/contracts";
import { contractFetcher } from "lib/contracts";
import { formatKeyAmount } from "lib/numbers";

export default function APRLabel({ chainId, label }) {
  let { active } = useWeb3React();

  const rewardReaderAddress = getContract(chainId, "RewardReader");
  const readerAddress = getContract(chainId, "Reader");

  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const xdxAddress = getContract(chainId, "XDX");
  const esXDXAddress = getContract(chainId, "ES_XDX");
  const bnXDXAddress = getContract(chainId, "BN_XDX");
  const xlxAddress = getContract(chainId, "XLX");

  const stakedXDXTrackerAddress = getContract(chainId, "StakedXDXTracker");
  const bonusXDXTrackerAddress = getContract(chainId, "BonusXDXTracker");
  const feeXDXTrackerAddress = getContract(chainId, "FeeXDXTracker");

  const stakedXLXTrackerAddress = getContract(chainId, "StakedXLXTracker");
  const feeXLXTrackerAddress = getContract(chainId, "FeeXLXTracker");

  const xlxManagerAddress = getContract(chainId, "XLXManager");

  const xdxVesterAddress = getContract(chainId, "XDXVester");
  const xlxVesterAddress = getContract(chainId, "XLXVester");

  const vesterAddresses = [xdxVesterAddress, xlxVesterAddress];

  const walletTokens = [xdxAddress, esXDXAddress, xlxAddress, stakedXDXTrackerAddress];
  const depositTokens = [
    xdxAddress,
    esXDXAddress,
    stakedXDXTrackerAddress,
    bonusXDXTrackerAddress,
    bnXDXAddress,
    xlxAddress,
  ];
  const rewardTrackersForDepositBalances = [
    stakedXDXTrackerAddress,
    stakedXDXTrackerAddress,
    bonusXDXTrackerAddress,
    feeXDXTrackerAddress,
    feeXDXTrackerAddress,
    feeXLXTrackerAddress,
  ];
  const rewardTrackersForStakingInfo = [
    stakedXDXTrackerAddress,
    bonusXDXTrackerAddress,
    feeXDXTrackerAddress,
    stakedXLXTrackerAddress,
    feeXLXTrackerAddress,
  ];

  const { data: walletBalances } = useSWR(
    [`StakeV2:walletBalances:${active}`, chainId, readerAddress, "getTokenBalancesWithSupplies", PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(undefined, ReaderV2, [walletTokens]),
    }
  );

  const { data: depositBalances } = useSWR(
    [`StakeV2:depositBalances:${active}`, chainId, rewardReaderAddress, "getDepositBalances", PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(undefined, RewardReader, [depositTokens, rewardTrackersForDepositBalances]),
    }
  );

  const { data: stakingInfo } = useSWR(
    [`StakeV2:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(undefined, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const { data: stakedXDXSupply } = useSWR(
    [`StakeV2:stakedXDXSupply:${active}`, chainId, xdxAddress, "balanceOf", stakedXDXTrackerAddress],
    {
      fetcher: contractFetcher(undefined, Token),
    }
  );

  const { data: aums } = useSWR([`StakeV2:getAums:${active}`, chainId, xlxManagerAddress, "getAums"], {
    fetcher: contractFetcher(undefined, XLXManager),
  });

  const { data: nativeTokenPrice } = useSWR(
    [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: contractFetcher(undefined, Vault),
    }
  );

  const { data: vestingInfo } = useSWR(
    [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(undefined, ReaderV2, [vesterAddresses]),
    }
  );

  const { xdxPrice } = useXDXPrice(chainId, {}, active);

  // const xdxSupplyUrl = getServerUrl(chainId, "/xdx_supply");
  // const { data: xdxSupply } = useSWR([xdxSupplyUrl], {
  //   fetcher: (...args) => fetch(...args).then((res) => res.text()),
  // });

  const { data: xdxSupply } = useSWR([`APRLabel:xdxSupply:${active}`, chainId, xdxAddress, "totalSupply"], {
    fetcher: contractFetcher(undefined, Token),
  });

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  const { balanceData, supplyData } = getBalanceAndSupplyData(walletBalances);
  const depositBalanceData = getDepositBalanceData(depositBalances);
  const stakingData = getStakingData(stakingInfo);
  const vestingData = getVestingData(vestingInfo);

  const processedData = getProcessedData(
    balanceData,
    supplyData,
    depositBalanceData,
    stakingData,
    vestingData,
    aum,
    nativeTokenPrice,
    stakedXDXSupply,
    xdxPrice,
    xdxSupply
  );
  return <>{`${formatKeyAmount(processedData, label, 2, 2, true)}%`}</>;
}
