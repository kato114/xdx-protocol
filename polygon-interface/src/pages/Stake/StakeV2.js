import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Trans, t } from "@lingui/macro";
import { useWeb3React } from "@web3-react/core";

import Modal from "components/Modal/Modal";
import Checkbox from "components/Checkbox/Checkbox";
import Tooltip from "components/Tooltip/Tooltip";
import Footer from "components/Footer/Footer";

import Vault from "abis/Vault.json";
import ReaderV2 from "abis/ReaderV2.json";
import Vester from "abis/Vester.json";
import RewardRouter from "abis/RewardRouter.json";
import RewardReader from "abis/RewardReader.json";
import Token from "abis/Token.json";
import XLXManager from "abis/XLXManager.json";

import { ethers } from "ethers";
import {
  XLX_DECIMALS,
  USD_DECIMALS,
  BASIS_POINTS_DIVISOR,
  PLACEHOLDER_ACCOUNT,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  getVestingData,
  getStakingData,
  getProcessedData,
  getPageTitle,
} from "lib/legacy";
import { useXDXPrice, useTotalXDXStaked, useTotalXDXSupply } from "domain/legacy";
import { ARBITRUM, getChainName, getConstant } from "config/chains";

import useSWR from "swr";

import { getContract } from "config/contracts";

import "./StakeV2.css";
import SEO from "components/Common/SEO";
import StatsTooltip from "components/StatsTooltip/StatsTooltip";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import { getServerUrl } from "config/backend";
import { callContract, contractFetcher } from "lib/contracts";
import { useLocalStorageSerializeKey } from "lib/localStorage";
import { helperToast } from "lib/helperToast";
import { approveTokens } from "domain/tokens";
import { bigNumberify, expandDecimals, formatAmount, formatAmountFree, formatKeyAmount, parseValue } from "lib/numbers";
import { useChainId } from "lib/chains";
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";

const { AddressZero } = ethers.constants;

function StakeModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    maxAmount,
    value,
    setValue,
    active,
    account,
    library,
    stakingTokenSymbol,
    stakingTokenAddress,
    farmAddress,
    rewardRouterAddress,
    stakeMethodName,
    setPendingTxns,
  } = props;
  const [isStaking, setIsStaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const { data: tokenAllowance } = useSWR(
    active && stakingTokenAddress && [active, chainId, stakingTokenAddress, "allowance", account, farmAddress],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  let amount = parseValue(value, 18);
  const needApproval = farmAddress !== AddressZero && tokenAllowance && amount && amount.gt(tokenAllowance);

  const getError = () => {
    if (!amount || amount.eq(0)) {
      return t`Enter an amount`;
    }
    if (maxAmount && amount.gt(maxAmount)) {
      return t`Max amount exceeded`;
    }
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: stakingTokenAddress,
        spender: farmAddress,
        chainId,
      });
      return;
    }

    setIsStaking(true);
    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(chainId, contract, stakeMethodName, [amount], {
      sentMsg: t`Stake submitted!`,
      failMsg: t`Stake failed.`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsStaking(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isStaking) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isApproving) {
      return t`Approving ${stakingTokenSymbol}...`;
    }
    if (needApproval) {
      return t`Approve ${stakingTokenSymbol}`;
    }
    if (isStaking) {
      return t`Staking...`;
    }
    return t`Stake`;
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div className="Exchange-swap-section">
          <div className="Exchange-swap-section-top">
            <div className="muted">
              <div className="Exchange-swap-usd">
                <Trans>Stake</Trans>
              </div>
            </div>
            <div className="muted align-right clickable" onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}>
              <Trans>Max: {formatAmount(maxAmount, 18, 4, true)}</Trans>
            </div>
          </div>
          <div className="Exchange-swap-section-bottom">
            <div>
              <input
                type="number"
                placeholder="0.0"
                className="Exchange-swap-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="PositionEditor-token-symbol">{stakingTokenSymbol}</div>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function UnstakeModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    maxAmount,
    value,
    setValue,
    library,
    unstakingTokenSymbol,
    rewardRouterAddress,
    unstakeMethodName,
    multiplierPointsAmount,
    reservedAmount,
    bonusXDXInFeeXDX,
    setPendingTxns,
  } = props;
  const [isUnstaking, setIsUnstaking] = useState(false);

  let amount = parseValue(value, 18);
  let burnAmount;

  if (
    multiplierPointsAmount &&
    multiplierPointsAmount.gt(0) &&
    amount &&
    amount.gt(0) &&
    bonusXDXInFeeXDX &&
    bonusXDXInFeeXDX.gt(0)
  ) {
    burnAmount = multiplierPointsAmount.mul(amount).div(bonusXDXInFeeXDX);
  }

  const shouldShowReductionAmount = true;
  let rewardReductionBasisPoints;
  if (burnAmount && bonusXDXInFeeXDX) {
    rewardReductionBasisPoints = burnAmount.mul(BASIS_POINTS_DIVISOR).div(bonusXDXInFeeXDX);
  }

  const getError = () => {
    if (!amount) {
      return t`Enter an amount`;
    }
    if (amount.gt(maxAmount)) {
      return t`Max amount exceeded`;
    }
  };

  const onClickPrimary = () => {
    setIsUnstaking(true);
    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(chainId, contract, unstakeMethodName, [amount], {
      sentMsg: t`Unstake submitted!`,
      failMsg: t`Unstake failed.`,
      successMsg: t`Unstake completed!`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsUnstaking(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isUnstaking) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isUnstaking) {
      return t`Unstaking...`;
    }
    return t`Unstake`;
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div className="Exchange-swap-section">
          <div className="Exchange-swap-section-top">
            <div className="muted">
              <div className="Exchange-swap-usd">
                <Trans>Unstake</Trans>
              </div>
            </div>
            <div className="muted align-right clickable" onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}>
              <Trans>Max: {formatAmount(maxAmount, 18, 4, true)}</Trans>
            </div>
          </div>
          <div className="Exchange-swap-section-bottom">
            <div>
              <input
                type="number"
                placeholder="0.0"
                className="Exchange-swap-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="PositionEditor-token-symbol">{unstakingTokenSymbol}</div>
          </div>
        </div>
        {reservedAmount && reservedAmount.gt(0) && (
          <div className="Modal-note">
            You have {formatAmount(reservedAmount, 18, 2, true)} tokens reserved for vesting.
          </div>
        )}
        {burnAmount && burnAmount.gt(0) && rewardReductionBasisPoints && rewardReductionBasisPoints.gt(0) && (
          <div className="Modal-note">
            Unstaking will burn&nbsp;
            <a href="https://xdx.gitbook.io/xdx/rewards" target="_blank" rel="noopener noreferrer">
              {formatAmount(burnAmount, 18, 4, true)} Multiplier Points
            </a>
            .&nbsp;
            {shouldShowReductionAmount && (
              <span>Boost Percentage: -{formatAmount(rewardReductionBasisPoints, 2, 2)}%.</span>
            )}
          </div>
        )}
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function VesterDepositModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    maxAmount,
    value,
    setValue,
    balance,
    vestedAmount,
    averageStakedAmount,
    maxVestableAmount,
    library,
    stakeTokenLabel,
    reserveAmount,
    maxReserveAmount,
    vesterAddress,
    setPendingTxns,
  } = props;
  const [isDepositing, setIsDepositing] = useState(false);

  let amount = parseValue(value, 18);

  let nextReserveAmount = reserveAmount;

  let nextDepositAmount = vestedAmount;
  if (amount) {
    nextDepositAmount = vestedAmount.add(amount);
  }

  let additionalReserveAmount = bigNumberify(0);
  if (amount && averageStakedAmount && maxVestableAmount && maxVestableAmount.gt(0)) {
    nextReserveAmount = nextDepositAmount.mul(averageStakedAmount).div(maxVestableAmount);
    if (nextReserveAmount.gt(reserveAmount)) {
      additionalReserveAmount = nextReserveAmount.sub(reserveAmount);
    }
  }

  const getError = () => {
    if (!amount || amount.eq(0)) {
      return t`Enter an amount`;
    }
    if (maxAmount && amount.gt(maxAmount)) {
      return t`Max amount exceeded`;
    }
    if (nextReserveAmount.gt(maxReserveAmount)) {
      return t`Insufficient staked tokens`;
    }
  };

  const onClickPrimary = () => {
    setIsDepositing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());

    callContract(chainId, contract, "deposit", [amount], {
      sentMsg: t`Deposit submitted!`,
      failMsg: t`Deposit failed!`,
      successMsg: t`Deposited!`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsDepositing(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isDepositing) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isDepositing) {
      return t`Depositing...`;
    }
    return t`Deposit`;
  };

  return (
    <SEO title={getPageTitle("Earn")}>
      <div className="StakeModal">
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title} className="non-scrollable">
          <div className="Exchange-swap-section">
            <div className="Exchange-swap-section-top">
              <div className="muted">
                <div className="Exchange-swap-usd">
                  <Trans>Deposit</Trans>
                </div>
              </div>
              <div
                className="muted align-right clickable"
                onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}
              >
                <Trans>Max: {formatAmount(maxAmount, 18, 4, true)}</Trans>
              </div>
            </div>
            <div className="Exchange-swap-section-bottom">
              <div>
                <input
                  type="number"
                  placeholder="0.0"
                  className="Exchange-swap-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="PositionEditor-token-symbol">esXDX</div>
            </div>
          </div>
          <div className="VesterDepositModal-info-rows">
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                <Trans>Wallet</Trans>
              </div>
              <div className="align-right">{formatAmount(balance, 18, 2, true)} esXDX</div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                <Trans>Vault Capacity</Trans>
              </div>
              <div className="align-right">
                <Tooltip
                  handle={`${formatAmount(nextDepositAmount, 18, 2, true)} / ${formatAmount(
                    maxVestableAmount,
                    18,
                    2,
                    true
                  )}`}
                  position="right-bottom"
                  renderContent={() => {
                    return (
                      <div>
                        <p className="text-white">
                          <Trans>Vault Capacity for your Account:</Trans>
                        </p>
                        <StatsTooltipRow
                          showDollar={false}
                          label={t`Deposited`}
                          value={`${formatAmount(vestedAmount, 18, 2, true)} esXDX`}
                        />
                        <StatsTooltipRow
                          showDollar={false}
                          label={t`Max Capacity`}
                          value={`${formatAmount(maxVestableAmount, 18, 2, true)} esXDX`}
                        />
                      </div>
                    );
                  }}
                />
              </div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                <Trans>Reserve Amount</Trans>
              </div>
              <div className="align-right">
                <Tooltip
                  handle={`${formatAmount(
                    reserveAmount && reserveAmount.gte(additionalReserveAmount)
                      ? reserveAmount
                      : additionalReserveAmount,
                    18,
                    2,
                    true
                  )} / ${formatAmount(maxReserveAmount, 18, 2, true)}`}
                  position="right-bottom"
                  renderContent={() => {
                    return (
                      <>
                        <StatsTooltipRow
                          label={t`Current Reserved`}
                          value={formatAmount(reserveAmount, 18, 2, true)}
                          showDollar={false}
                        />
                        <StatsTooltipRow
                          label={t`Additional reserve required`}
                          value={formatAmount(additionalReserveAmount, 18, 2, true)}
                          showDollar={false}
                        />
                        {amount && nextReserveAmount.gt(maxReserveAmount) && (
                          <>
                            <br />
                            <Trans>
                              You need a total of at least {formatAmount(nextReserveAmount, 18, 2, true)}{" "}
                              {stakeTokenLabel} to vest {formatAmount(amount, 18, 2, true)} esXDX.
                            </Trans>
                          </>
                        )}
                      </>
                    );
                  }}
                />
              </div>
            </div>
          </div>
          <div className="Exchange-swap-button-container">
            <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
            </button>
          </div>
        </Modal>
      </div>
    </SEO>
  );
}

function VesterWithdrawModal(props) {
  const { isVisible, setIsVisible, chainId, title, library, vesterAddress, setPendingTxns } = props;
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const onClickPrimary = () => {
    setIsWithdrawing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());

    callContract(chainId, contract, "withdraw", [], {
      sentMsg: t`Withdraw submitted.`,
      failMsg: t`Withdraw failed.`,
      successMsg: t`Withdrawn!`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsWithdrawing(false);
      });
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <Trans>
          <div>
            This will withdraw and unreserve all tokens as well as pause vesting.
            <br />
            <br />
            esXDX tokens that have been converted to $XDX will remain as $XDX tokens.
            <br />
            <br />
            To claim $XDX tokens without withdrawing, use the "Claim" button under the Total Rewards section.
            <br />
            <br />
          </div>
        </Trans>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={isWithdrawing}>
            {!isWithdrawing && "Confirm Withdraw"}
            {isWithdrawing && "Confirming..."}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function CompoundModal(props) {
  const {
    isVisible,
    setIsVisible,
    rewardRouterAddress,
    active,
    account,
    library,
    chainId,
    setPendingTxns,
    totalVesterRewards,
    nativeTokenSymbol,
    wrappedTokenSymbol,
  } = props;
  const [isCompounding, setIsCompounding] = useState(false);
  const [shouldClaimXDX, setShouldClaimXDX] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-xdx"],
    true
  );
  const [shouldStakeXDX, setShouldStakeXDX] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-stake-xdx"],
    true
  );
  const [shouldClaimEsXDX, setShouldClaimEsXDX] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-es-xdx"],
    true
  );
  const [shouldStakeEsXDX, setShouldStakeEsXDX] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-stake-es-xdx"],
    true
  );
  const [shouldStakeMultiplierPoints, setShouldStakeMultiplierPoints] = useState(true);
  const [shouldClaimWeth, setShouldClaimWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-weth"],
    true
  );
  const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-convert-weth"],
    true
  );

  const xdxAddress = getContract(chainId, "XDX");
  const stakedXDXTrackerAddress = getContract(chainId, "StakedXDXTracker");

  const [isApproving, setIsApproving] = useState(false);

  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, xdxAddress, "allowance", account, stakedXDXTrackerAddress],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const needApproval = shouldStakeXDX && tokenAllowance && totalVesterRewards && totalVesterRewards.gt(tokenAllowance);

  const isPrimaryEnabled = () => {
    return !isCompounding && !isApproving && !isCompounding;
  };

  const getPrimaryText = () => {
    if (isApproving) {
      return t`Approving $XDX...`;
    }
    if (needApproval) {
      return t`Approve $XDX`;
    }
    if (isCompounding) {
      return t`Compounding...`;
    }
    return t`Compound`;
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: xdxAddress,
        spender: stakedXDXTrackerAddress,
        chainId,
      });
      return;
    }

    setIsCompounding(true);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(
      chainId,
      contract,
      "handleRewards",
      [
        shouldClaimXDX || shouldStakeXDX,
        shouldStakeXDX,
        shouldClaimEsXDX || shouldStakeEsXDX,
        shouldStakeEsXDX,
        shouldStakeMultiplierPoints,
        shouldClaimWeth || shouldConvertWeth,
        shouldConvertWeth,
      ],
      {
        sentMsg: t`Compound submitted!`,
        failMsg: t`Compound failed.`,
        successMsg: t`Compound completed!`,
        setPendingTxns,
      }
    )
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsCompounding(false);
      });
  };

  const toggleShouldStakeXDX = (value) => {
    if (value) {
      setShouldClaimXDX(true);
    }
    setShouldStakeXDX(value);
  };

  const toggleShouldStakeEsXDX = (value) => {
    if (value) {
      setShouldClaimEsXDX(true);
    }
    setShouldStakeEsXDX(value);
  };

  const toggleConvertWeth = (value) => {
    if (value) {
      setShouldClaimWeth(true);
    }
    setShouldConvertWeth(value);
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={t`Compound Rewards`}>
        <div className="CompoundModal-menu">
          <div>
            <Checkbox
              isChecked={shouldStakeMultiplierPoints}
              setIsChecked={setShouldStakeMultiplierPoints}
              disabled={true}
            >
              <Trans>Stake Multiplier Points</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimXDX} setIsChecked={setShouldClaimXDX} disabled={shouldStakeXDX}>
              <Trans>Claim $XDX Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldStakeXDX} setIsChecked={toggleShouldStakeXDX}>
              <Trans>Stake $XDX Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimEsXDX} setIsChecked={setShouldClaimEsXDX} disabled={shouldStakeEsXDX}>
              <Trans>Claim esXDX Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldStakeEsXDX} setIsChecked={toggleShouldStakeEsXDX}>
              <Trans>Stake esXDX Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimWeth} setIsChecked={setShouldClaimWeth} disabled={shouldConvertWeth}>
              <Trans>Claim {wrappedTokenSymbol} Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldConvertWeth} setIsChecked={toggleConvertWeth}>
              <Trans>
                Convert {wrappedTokenSymbol} to {nativeTokenSymbol}
              </Trans>
            </Checkbox>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ClaimModal(props) {
  const {
    isVisible,
    setIsVisible,
    rewardRouterAddress,
    library,
    chainId,
    setPendingTxns,
    nativeTokenSymbol,
    wrappedTokenSymbol,
  } = props;
  const [isClaiming, setIsClaiming] = useState(false);
  const [shouldClaimXDX, setShouldClaimXDX] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-xdx"],
    true
  );
  const [shouldClaimEsXDX, setShouldClaimEsXDX] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-es-xdx"],
    true
  );
  const [shouldClaimWeth, setShouldClaimWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-weth"],
    true
  );
  const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-convert-weth"],
    true
  );

  const isPrimaryEnabled = () => {
    return !isClaiming;
  };

  const getPrimaryText = () => {
    if (isClaiming) {
      return t`Claiming...`;
    }
    return t`Claim`;
  };

  const onClickPrimary = () => {
    setIsClaiming(true);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(
      chainId,
      contract,
      "handleRewards",
      [
        shouldClaimXDX,
        false, // shouldStakeXDX
        shouldClaimEsXDX,
        false, // shouldStakeEsXDX
        false, // shouldStakeMultiplierPoints
        shouldClaimWeth,
        shouldConvertWeth,
      ],
      {
        sentMsg: t`Claim submitted.`,
        failMsg: t`Claim failed.`,
        successMsg: t`Claim completed!`,
        setPendingTxns,
      }
    )
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsClaiming(false);
      });
  };

  const toggleConvertWeth = (value) => {
    if (value) {
      setShouldClaimWeth(true);
    }
    setShouldConvertWeth(value);
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={t`Claim Rewards`}>
        <div className="CompoundModal-menu">
          <div>
            <Checkbox isChecked={shouldClaimXDX} setIsChecked={setShouldClaimXDX}>
              <Trans>Claim $XDX Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimEsXDX} setIsChecked={setShouldClaimEsXDX}>
              <Trans>Claim esXDX Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimWeth} setIsChecked={setShouldClaimWeth} disabled={shouldConvertWeth}>
              <Trans>Claim {wrappedTokenSymbol} Rewards</Trans>
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldConvertWeth} setIsChecked={toggleConvertWeth}>
              <Trans>
                Convert {wrappedTokenSymbol} to {nativeTokenSymbol}
              </Trans>
            </Checkbox>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function StakeV2({ setPendingTxns, connectWallet }) {
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();

  const chainName = getChainName(chainId);

  const hasInsurance = true;

  const [isStakeModalVisible, setIsStakeModalVisible] = useState(false);
  const [stakeModalTitle, setStakeModalTitle] = useState("");
  const [stakeModalMaxAmount, setStakeModalMaxAmount] = useState(undefined);
  const [stakeValue, setStakeValue] = useState("");
  const [stakingTokenSymbol, setStakingTokenSymbol] = useState("");
  const [stakingTokenAddress, setStakingTokenAddress] = useState("");
  const [stakingFarmAddress, setStakingFarmAddress] = useState("");
  const [stakeMethodName, setStakeMethodName] = useState("");

  const [isUnstakeModalVisible, setIsUnstakeModalVisible] = useState(false);
  const [unstakeModalTitle, setUnstakeModalTitle] = useState("");
  const [unstakeModalMaxAmount, setUnstakeModalMaxAmount] = useState(undefined);
  const [unstakeModalReservedAmount, setUnstakeModalReservedAmount] = useState(undefined);
  const [unstakeValue, setUnstakeValue] = useState("");
  const [unstakingTokenSymbol, setUnstakingTokenSymbol] = useState("");
  const [unstakeMethodName, setUnstakeMethodName] = useState("");

  const [isVesterDepositModalVisible, setIsVesterDepositModalVisible] = useState(false);
  const [vesterDepositTitle, setVesterDepositTitle] = useState("");
  const [vesterDepositStakeTokenLabel, setVesterDepositStakeTokenLabel] = useState("");
  const [vesterDepositMaxAmount, setVesterDepositMaxAmount] = useState("");
  const [vesterDepositBalance, setVesterDepositBalance] = useState("");
  const [vesterDepositEscrowedBalance, setVesterDepositEscrowedBalance] = useState("");
  const [vesterDepositVestedAmount, setVesterDepositVestedAmount] = useState("");
  const [vesterDepositAverageStakedAmount, setVesterDepositAverageStakedAmount] = useState("");
  const [vesterDepositMaxVestableAmount, setVesterDepositMaxVestableAmount] = useState("");
  const [vesterDepositValue, setVesterDepositValue] = useState("");
  const [vesterDepositReserveAmount, setVesterDepositReserveAmount] = useState("");
  const [vesterDepositMaxReserveAmount, setVesterDepositMaxReserveAmount] = useState("");
  const [vesterDepositAddress, setVesterDepositAddress] = useState("");

  const [isVesterWithdrawModalVisible, setIsVesterWithdrawModalVisible] = useState(false);
  const [vesterWithdrawTitle, setVesterWithdrawTitle] = useState(false);
  const [vesterWithdrawAddress, setVesterWithdrawAddress] = useState("");

  const [isCompoundModalVisible, setIsCompoundModalVisible] = useState(false);
  const [isClaimModalVisible, setIsClaimModalVisible] = useState(false);

  const rewardRouterAddress = getContract(chainId, "RewardRouter");
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

  const stakedXDXDistributorAddress = getContract(chainId, "StakedXDXDistributor");
  const stakedXLXDistributorAddress = getContract(chainId, "StakedXLXDistributor");

  const xdxVesterAddress = getContract(chainId, "XDXVester");
  const xlxVesterAddress = getContract(chainId, "XLXVester");

  const vesterAddresses = [xdxVesterAddress, xlxVesterAddress];

  const excludedEsXDXAccounts = [stakedXDXDistributorAddress, stakedXLXDistributorAddress];

  const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");
  const wrappedTokenSymbol = getConstant(chainId, "wrappedTokenSymbol");

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
    [
      `StakeV2:walletBalances:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: contractFetcher(library, ReaderV2, [walletTokens]),
    }
  );

  const { data: depositBalances } = useSWR(
    [
      `StakeV2:depositBalances:${active}`,
      chainId,
      rewardReaderAddress,
      "getDepositBalances",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: contractFetcher(library, RewardReader, [depositTokens, rewardTrackersForDepositBalances]),
    }
  );

  const { data: stakingInfo } = useSWR(
    [`StakeV2:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const { data: stakedXDXSupply } = useSWR(
    [`StakeV2:stakedXDXSupply:${active}`, chainId, xdxAddress, "balanceOf", stakedXDXTrackerAddress],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const { data: aums } = useSWR([`StakeV2:getAums:${active}`, chainId, xlxManagerAddress, "getAums"], {
    fetcher: contractFetcher(library, XLXManager),
  });

  const { data: nativeTokenPrice } = useSWR(
    [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: contractFetcher(library, Vault),
    }
  );

  const { data: esXDXSupply } = useSWR(
    [`StakeV2:esXDXSupply:${active}`, chainId, readerAddress, "getTokenSupply", esXDXAddress],
    {
      fetcher: contractFetcher(library, ReaderV2, [excludedEsXDXAccounts]),
    }
  );
  const { data: vestingInfo } = useSWR(
    [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: contractFetcher(library, ReaderV2, [vesterAddresses]),
    }
  );

  const { xdxPrice, xdxPriceFromArbitrum, xdxPriceFromAvalanche } = useXDXPrice(
    chainId,
    { arbitrum: chainId === ARBITRUM ? library : undefined },
    active
  );

  let { total: totalXDXSupply } = useTotalXDXSupply();

  let { avax: avaxXDXStaked, arbitrum: arbitrumXDXStaked, total: totalXDXStaked } = useTotalXDXStaked();

  // const xdxSupplyUrl = getServerUrl(chainId, "/xdx_supply");
  // const { data: xdxSupply } = useSWR([xdxSupplyUrl], {
  //   fetcher: (...args) => fetch(...args).then((res) => res.text()),
  // });

  const { data: xdxSupply } = useSWR([`StakeV2:xdxSupply:${active}`, chainId, xdxAddress, "balanceOf", account], {
    fetcher: contractFetcher(library, Token),
  });

  const isXDXTransferEnabled = true;

  let esXDXSupplyUsd;
  if (esXDXSupply && xdxPrice) {
    esXDXSupplyUsd = esXDXSupply.mul(xdxPrice).div(expandDecimals(1, 18));
  }

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

  let hasMultiplierPoints = false;
  let multiplierPointsAmount;
  if (processedData && processedData.bonusXDXTrackerRewards && processedData.bnXDXInFeeXDX) {
    multiplierPointsAmount = processedData.bonusXDXTrackerRewards.add(processedData.bnXDXInFeeXDX);
    if (multiplierPointsAmount.gt(0)) {
      hasMultiplierPoints = true;
    }
  }
  let totalRewardTokens;
  if (processedData && processedData.bnXDXInFeeXDX && processedData.bonusXDXInFeeXDX) {
    totalRewardTokens = processedData.bnXDXInFeeXDX.add(processedData.bonusXDXInFeeXDX);
  }

  let totalRewardTokensAndXLX;
  if (totalRewardTokens && processedData && processedData.xlxBalance) {
    totalRewardTokensAndXLX = totalRewardTokens.add(processedData.xlxBalance);
  }

  const bonusXDXInFeeXDX = processedData ? processedData.bonusXDXInFeeXDX : undefined;

  let stakedXDXSupplyUsd;
  if (!totalXDXStaked.isZero() && xdxPrice) {
    stakedXDXSupplyUsd = totalXDXStaked.mul(xdxPrice).div(expandDecimals(1, 18));
  }

  let totalSupplyUsd;
  if (totalXDXSupply && !totalXDXSupply.isZero() && xdxPrice) {
    totalSupplyUsd = totalXDXSupply.mul(xdxPrice).div(expandDecimals(1, 18));
  }

  let maxUnstakeableXDX = bigNumberify(0);
  if (
    totalRewardTokens &&
    vestingData &&
    vestingData.xdxVesterPairAmount &&
    multiplierPointsAmount &&
    processedData.bonusXDXInFeeXDX
  ) {
    const availableTokens = totalRewardTokens.sub(vestingData.xdxVesterPairAmount);
    const stakedTokens = processedData.bonusXDXInFeeXDX;
    const divisor = multiplierPointsAmount.add(stakedTokens);
    if (divisor.gt(0)) {
      maxUnstakeableXDX = availableTokens.mul(stakedTokens).div(divisor);
    }
  }

  const showStakeXDXModal = () => {
    if (!isXDXTransferEnabled) {
      helperToast.error(t`$XDX transfers not yet enabled`);
      return;
    }

    setIsStakeModalVisible(true);
    setStakeModalTitle(t`Stake $XDX`);
    setStakeModalMaxAmount(processedData.xdxBalance);
    setStakeValue("");
    setStakingTokenSymbol("$XDX");
    setStakingTokenAddress(xdxAddress);
    setStakingFarmAddress(stakedXDXTrackerAddress);
    setStakeMethodName("stakeXDX");
  };

  const showStakeEsXDXModal = () => {
    setIsStakeModalVisible(true);
    setStakeModalTitle(t`Stake esXDX`);
    setStakeModalMaxAmount(processedData.esXDXBalance);
    setStakeValue("");
    setStakingTokenSymbol("esXDX");
    setStakingTokenAddress(esXDXAddress);
    setStakingFarmAddress(AddressZero);
    setStakeMethodName("stakeEsXDX");
  };

  const showXDXVesterDepositModal = () => {
    let remainingVestableAmount = vestingData.xdxVester.maxVestableAmount.sub(vestingData.xdxVester.vestedAmount);
    if (processedData.esXDXBalance.lt(remainingVestableAmount)) {
      remainingVestableAmount = processedData.esXDXBalance;
    }

    setIsVesterDepositModalVisible(true);
    setVesterDepositTitle(t`$XDX Vault`);
    setVesterDepositStakeTokenLabel("staked $XDX + esXDX + Multiplier Points");
    setVesterDepositMaxAmount(remainingVestableAmount);
    setVesterDepositBalance(processedData.esXDXBalance);
    setVesterDepositEscrowedBalance(vestingData.xdxVester.escrowedBalance);
    setVesterDepositVestedAmount(vestingData.xdxVester.vestedAmount);
    setVesterDepositMaxVestableAmount(vestingData.xdxVester.maxVestableAmount);
    setVesterDepositAverageStakedAmount(vestingData.xdxVester.averageStakedAmount);
    setVesterDepositReserveAmount(vestingData.xdxVester.pairAmount);
    setVesterDepositMaxReserveAmount(totalRewardTokens);
    setVesterDepositValue("");
    setVesterDepositAddress(xdxVesterAddress);
  };

  const showXLXVesterDepositModal = () => {
    let remainingVestableAmount = vestingData.xlxVester.maxVestableAmount.sub(vestingData.xlxVester.vestedAmount);
    if (processedData.esXDXBalance.lt(remainingVestableAmount)) {
      remainingVestableAmount = processedData.esXDXBalance;
    }

    setIsVesterDepositModalVisible(true);
    setVesterDepositTitle(t`$XLX Vault`);
    setVesterDepositStakeTokenLabel("staked $XLX");
    setVesterDepositMaxAmount(remainingVestableAmount);
    setVesterDepositBalance(processedData.esXDXBalance);
    setVesterDepositEscrowedBalance(vestingData.xlxVester.escrowedBalance);
    setVesterDepositVestedAmount(vestingData.xlxVester.vestedAmount);
    setVesterDepositMaxVestableAmount(vestingData.xlxVester.maxVestableAmount);
    setVesterDepositAverageStakedAmount(vestingData.xlxVester.averageStakedAmount);
    setVesterDepositReserveAmount(vestingData.xlxVester.pairAmount);
    setVesterDepositMaxReserveAmount(processedData.xlxBalance);
    setVesterDepositValue("");
    setVesterDepositAddress(xlxVesterAddress);
  };

  const showXDXVesterWithdrawModal = () => {
    if (!vestingData || !vestingData.xdxVesterVestedAmount || vestingData.xdxVesterVestedAmount.eq(0)) {
      helperToast.error(t`You have not deposited any tokens for vesting.`);
      return;
    }

    setIsVesterWithdrawModalVisible(true);
    setVesterWithdrawTitle(t`Withdraw from $XDX Vault`);
    setVesterWithdrawAddress(xdxVesterAddress);
  };

  const showXLXVesterWithdrawModal = () => {
    if (!vestingData || !vestingData.xlxVesterVestedAmount || vestingData.xlxVesterVestedAmount.eq(0)) {
      helperToast.error(t`You have not deposited any tokens for vesting.`);
      return;
    }

    setIsVesterWithdrawModalVisible(true);
    setVesterWithdrawTitle(t`Withdraw from $XLX Vault`);
    setVesterWithdrawAddress(xlxVesterAddress);
  };

  const showUnstakeXDXModal = () => {
    if (!isXDXTransferEnabled) {
      helperToast.error(t`$XDX transfers not yet enabled`);
      return;
    }
    setIsUnstakeModalVisible(true);
    setUnstakeModalTitle(t`Unstake $XDX`);
    let maxAmount = processedData.xdxInStakedXDX;
    if (
      processedData.xdxInStakedXDX &&
      vestingData &&
      vestingData.xdxVesterPairAmount.gt(0) &&
      maxUnstakeableXDX &&
      maxUnstakeableXDX.lt(processedData.xdxInStakedXDX)
    ) {
      maxAmount = maxUnstakeableXDX;
    }
    setUnstakeModalMaxAmount(maxAmount);
    setUnstakeModalReservedAmount(vestingData.xdxVesterPairAmount);
    setUnstakeValue("");
    setUnstakingTokenSymbol("$XDX");
    setUnstakeMethodName("unstakeXDX");
  };

  const showUnstakeEsXDXModal = () => {
    setIsUnstakeModalVisible(true);
    setUnstakeModalTitle(t`Unstake esXDX`);
    let maxAmount = processedData.esXDXInStakedXDX;
    if (
      processedData.esXDXInStakedXDX &&
      vestingData &&
      vestingData.xdxVesterPairAmount.gt(0) &&
      maxUnstakeableXDX &&
      maxUnstakeableXDX.lt(processedData.esXDXInStakedXDX)
    ) {
      maxAmount = maxUnstakeableXDX;
    }
    setUnstakeModalMaxAmount(maxAmount);
    setUnstakeModalReservedAmount(vestingData.xdxVesterPairAmount);
    setUnstakeValue("");
    setUnstakingTokenSymbol("esXDX");
    setUnstakeMethodName("unstakeEsXDX");
  };

  const renderMultiplierPointsLabel = useCallback(() => {
    return t`Multiplier Points APR`;
  }, []);

  const renderMultiplierPointsValue = useCallback(() => {
    return (
      <Tooltip
        handle={`100.00%`}
        position="right-bottom"
        renderContent={() => {
          return (
            <Trans>
              Boost your rewards with Multiplier Points.&nbsp;
              <a
                href="https://xdx.gitbook.io/xdx/rewards#multiplier-points"
                rel="noreferrer"
                target="_blank"
              >
                More info
              </a>
              .
            </Trans>
          );
        }}
      />
    );
  }, []);

  let earnMsg;
  if (totalRewardTokensAndXLX && totalRewardTokensAndXLX.gt(0)) {
    let xdxAmountStr;
    if (processedData.xdxInStakedXDX && processedData.xdxInStakedXDX.gt(0)) {
      xdxAmountStr = formatAmount(processedData.xdxInStakedXDX, 18, 2, true) + " $XDX";
    }
    let esXDXAmountStr;
    if (processedData.esXDXInStakedXDX && processedData.esXDXInStakedXDX.gt(0)) {
      esXDXAmountStr = formatAmount(processedData.esXDXInStakedXDX, 18, 2, true) + " esXDX";
    }
    let mpAmountStr;
    if (processedData.bonusXDXInFeeXDX && processedData.bnXDXInFeeXDX.gt(0)) {
      mpAmountStr = formatAmount(processedData.bnXDXInFeeXDX, 18, 2, true) + " MP";
    }
    let xlxStr;
    if (processedData.xlxBalance && processedData.xlxBalance.gt(0)) {
      xlxStr = formatAmount(processedData.xlxBalance, 18, 2, true) + " $XLX";
    }
    const amountStr = [xdxAmountStr, esXDXAmountStr, mpAmountStr, xlxStr].filter((s) => s).join(", ");
    earnMsg = (
      <div>
        <Trans>
          You are earning {nativeTokenSymbol} rewards with {formatAmount(totalRewardTokensAndXLX, 18, 2, true)} tokens.
          <br />
          Tokens: {amountStr}.
        </Trans>
      </div>
    );
  }

  return (
    <div className="default-container page-layout">
      <StakeModal
        isVisible={isStakeModalVisible}
        setIsVisible={setIsStakeModalVisible}
        chainId={chainId}
        title={stakeModalTitle}
        maxAmount={stakeModalMaxAmount}
        value={stakeValue}
        setValue={setStakeValue}
        active={active}
        account={account}
        library={library}
        stakingTokenSymbol={stakingTokenSymbol}
        stakingTokenAddress={stakingTokenAddress}
        farmAddress={stakingFarmAddress}
        rewardRouterAddress={rewardRouterAddress}
        stakeMethodName={stakeMethodName}
        hasMultiplierPoints={hasMultiplierPoints}
        setPendingTxns={setPendingTxns}
        nativeTokenSymbol={nativeTokenSymbol}
        wrappedTokenSymbol={wrappedTokenSymbol}
      />
      <UnstakeModal
        setPendingTxns={setPendingTxns}
        isVisible={isUnstakeModalVisible}
        setIsVisible={setIsUnstakeModalVisible}
        chainId={chainId}
        title={unstakeModalTitle}
        maxAmount={unstakeModalMaxAmount}
        reservedAmount={unstakeModalReservedAmount}
        value={unstakeValue}
        setValue={setUnstakeValue}
        library={library}
        unstakingTokenSymbol={unstakingTokenSymbol}
        rewardRouterAddress={rewardRouterAddress}
        unstakeMethodName={unstakeMethodName}
        multiplierPointsAmount={multiplierPointsAmount}
        bonusXDXInFeeXDX={bonusXDXInFeeXDX}
      />
      <VesterDepositModal
        isVisible={isVesterDepositModalVisible}
        setIsVisible={setIsVesterDepositModalVisible}
        chainId={chainId}
        title={vesterDepositTitle}
        stakeTokenLabel={vesterDepositStakeTokenLabel}
        maxAmount={vesterDepositMaxAmount}
        balance={vesterDepositBalance}
        escrowedBalance={vesterDepositEscrowedBalance}
        vestedAmount={vesterDepositVestedAmount}
        averageStakedAmount={vesterDepositAverageStakedAmount}
        maxVestableAmount={vesterDepositMaxVestableAmount}
        reserveAmount={vesterDepositReserveAmount}
        maxReserveAmount={vesterDepositMaxReserveAmount}
        value={vesterDepositValue}
        setValue={setVesterDepositValue}
        library={library}
        vesterAddress={vesterDepositAddress}
        setPendingTxns={setPendingTxns}
      />
      <VesterWithdrawModal
        isVisible={isVesterWithdrawModalVisible}
        setIsVisible={setIsVesterWithdrawModalVisible}
        vesterAddress={vesterWithdrawAddress}
        chainId={chainId}
        title={vesterWithdrawTitle}
        library={library}
        setPendingTxns={setPendingTxns}
      />
      <CompoundModal
        active={active}
        account={account}
        setPendingTxns={setPendingTxns}
        isVisible={isCompoundModalVisible}
        setIsVisible={setIsCompoundModalVisible}
        rewardRouterAddress={rewardRouterAddress}
        totalVesterRewards={processedData.totalVesterRewards}
        wrappedTokenSymbol={wrappedTokenSymbol}
        nativeTokenSymbol={nativeTokenSymbol}
        library={library}
        chainId={chainId}
      />
      <ClaimModal
        active={active}
        account={account}
        setPendingTxns={setPendingTxns}
        isVisible={isClaimModalVisible}
        setIsVisible={setIsClaimModalVisible}
        rewardRouterAddress={rewardRouterAddress}
        totalVesterRewards={processedData.totalVesterRewards}
        wrappedTokenSymbol={wrappedTokenSymbol}
        nativeTokenSymbol={nativeTokenSymbol}
        library={library}
        chainId={chainId}
      />
      <div className="section-title-block">
        <div className="section-title-icon"></div>
        <div className="section-title-content">
          <div className="Page-title">
            <Trans>Earn</Trans>
          </div>
          <div className="Page-description">
            <Trans>Stake $XDX and $XLX to earn rewards.</Trans>
          </div>
          {earnMsg && <div className="Page-description">{earnMsg}</div>}
        </div>
      </div>
      
      <div className="DashboardV2-cards">
        <div className="Dashboard-card">
            <div className="Dashboard-card-title">Wallet</div>
            <div className="Dashboard-card-content">${formatKeyAmount(processedData, "xdxBalanceUsd", USD_DECIMALS, 2, true)}</div>
            <div className="Dashboard-card-description">Your XDX Balance</div>
        </div>
        <div className="Dashboard-card">
            <div className="Dashboard-card-title">Staked</div>
            <div className="Dashboard-card-content">${formatKeyAmount(processedData, "xdxInStakedXDXUsd", USD_DECIMALS, 2, true)}</div>
            <div className="Dashboard-card-description">Your Staked XDX</div>
        </div>
        <div className="Dashboard-card">
            <div className="Dashboard-card-title">AVAX Rewards</div>
            <div className="Dashboard-card-content">${formatKeyAmount(processedData, "totalNativeTokenRewardsUsd", USD_DECIMALS, 2, true)}</div>
            <div className="Dashboard-card-description">AVAX rewards to date</div>
        </div>
        <div className="Dashboard-card">
            <div className="Dashboard-card-title">XDX Rewards</div>
            <div className="Dashboard-card-content">${formatKeyAmount(processedData, "totalVesterRewardsUsd", USD_DECIMALS, 2, true)}</div>
            <div className="Dashboard-card-description">XDX rewards to date</div>
        </div>
        <div className="Dashboard-card">
            <div className="Dashboard-card-title">EsXDX Rewards</div>
            <div className="Dashboard-card-content">${formatKeyAmount(processedData, "totalEsXDXRewardsUsd", USD_DECIMALS, 2, true)}</div>
            <div className="Dashboard-card-description">Escrowed rewards to date</div>
        </div>
      </div>
      <div className="StakeV2-content">
        <div className="StakeV2-cards">
          <div className="App-card StakeV2-xdx-card">
            <div className="App-card-title">$XDX</div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  <Trans>Price</Trans>
                </div>
                <div>
                  {!xdxPrice && "..."}
                  {xdxPrice && (
                    <Tooltip
                      position="right-bottom"
                      className="nowrap"
                      handle={"$" + formatAmount(xdxPrice, USD_DECIMALS, 2, true)}
                      renderContent={() => (
                        <>
                          <StatsTooltipRow
                            label={t`Price on Avalanche`}
                            value={formatAmount(xdxPriceFromAvalanche, USD_DECIMALS, 2, true)}
                          />
                          {/* <StatsTooltipRow
                            label={t`Price on Arbitrum`}
                            value={formatAmount(xdxPriceFromArbitrum, USD_DECIMALS, 2, true)}
                          /> */}
                        </>
                      )}
                    />
                  )}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Wallet</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "xdxBalance", 18, 2, true)} $XDX ($
                  {formatKeyAmount(processedData, "xdxBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "xdxInStakedXDX", 18, 2, true)} $XDX ($
                  {formatKeyAmount(processedData, "xdxInStakedXDXUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>APR</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`${formatKeyAmount(processedData, "xdxAprTotalWithBoost", 2, 2, true)}%`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <StatsTooltipRow
                            label="Escrowed $XDX APR"
                            showDollar={false}
                            value={`${formatKeyAmount(processedData, "xdxAprForEsXDX", 2, 2, true)}%`}
                          />
                          {(!processedData.xdxBoostAprForNativeToken ||
                            processedData.xdxBoostAprForNativeToken.eq(0)) && (
                            <StatsTooltipRow
                              label={`${nativeTokenSymbol} APR`}
                              showDollar={false}
                              value={`${formatKeyAmount(processedData, "xdxAprForNativeToken", 2, 2, true)}%`}
                            />
                          )}
                          {processedData.xdxBoostAprForNativeToken && processedData.xdxBoostAprForNativeToken.gt(0) && (
                            <div>
                              <br />

                              <StatsTooltipRow
                                label={`${nativeTokenSymbol} Base APR`}
                                showDollar={false}
                                value={`${formatKeyAmount(processedData, "xdxAprForNativeToken", 2, 2, true)}%`}
                              />
                              <StatsTooltipRow
                                label={`${nativeTokenSymbol} Boosted APR`}
                                showDollar={false}
                                value={`${formatKeyAmount(processedData, "xdxBoostAprForNativeToken", 2, 2, true)}%`}
                              />
                              <div className="Tooltip-divider" />
                              <StatsTooltipRow
                                label={`${nativeTokenSymbol} Total APR`}
                                showDollar={false}
                                value={`${formatKeyAmount(
                                  processedData,
                                  "xdxAprForNativeTokenWithBoost",
                                  2,
                                  2,
                                  true
                                )}%`}
                              />

                              <br />

                              <Trans>The Boosted APR is from your staked Multiplier Points.</Trans>
                            </div>
                          )}
                          <div>
                            <br />
                            <Trans>
                              APRs are updated weekly on Wednesday and will depend on the fees collected for the week.
                            </Trans>
                          </div>
                        </>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Rewards</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`$${formatKeyAmount(processedData, "totalXDXRewardsUsd", USD_DECIMALS, 2, true)}`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <StatsTooltipRow
                            label={`${nativeTokenSymbol} (${wrappedTokenSymbol})`}
                            value={`${formatKeyAmount(
                              processedData,
                              "feeXDXTrackerRewards",
                              18,
                              4
                            )} ($${formatKeyAmount(processedData, "feeXDXTrackerRewardsUsd", USD_DECIMALS, 2, true)})`}
                            showDollar={false}
                          />
                          <StatsTooltipRow
                            label="Escrowed $XDX"
                            value={`${formatKeyAmount(
                              processedData,
                              "stakedXDXTrackerRewards",
                              18,
                              4
                            )} ($${formatKeyAmount(
                              processedData,
                              "stakedXDXTrackerRewardsUsd",
                              USD_DECIMALS,
                              2,
                              true
                            )})`}
                            showDollar={false}
                          />
                        </>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">{renderMultiplierPointsLabel()}</div>
                <div>{renderMultiplierPointsValue()}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Boost Percentage</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`${formatAmount(processedData.boostBasisPoints, 2, 2, false)}%`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <div>
                          <Trans>
                            You are earning {formatAmount(processedData.boostBasisPoints, 2, 2, false)}% more{" "}
                            {nativeTokenSymbol} rewards using{" "}
                            {formatAmount(processedData.bnXDXInFeeXDX, 18, 4, 2, true)} Staked Multiplier Points.
                          </Trans>
                          <br />
                          <br />
                          <Trans>Use the "Compound" button to stake your Multiplier Points.</Trans>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Staked</Trans>
                </div>
                <div>
                  {!totalXDXStaked && "..."}

                  {/* {totalXDXStaked && (
                    <Tooltip
                      position="right-bottom"
                      className="nowrap"
                      handle={
                        formatAmount(totalXDXStaked, 18, 0, true) +
                        " $XDX" +
                        ` ($${formatAmount(stakedXDXSupplyUsd, USD_DECIMALS, 0, true)})`
                      }
                      renderContent={() => (
                        <StatsTooltip
                          showDollar={false}
                          title={t`Staked`}
                          avaxValue={avaxXDXStaked}
                          arbitrumValue={arbitrumXDXStaked}
                          total={totalXDXStaked}
                          decimalsForConversion={18}
                          symbol="$XDX"
                        />
                      )}
                    />
                  )} */}
                  {formatAmount(totalXDXStaked, 18, 0, true) +
                    " $XDX" +
                    ` ($${formatAmount(stakedXDXSupplyUsd, USD_DECIMALS, 0, true)})`}
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Supply</Trans>
                </div>
                {!totalXDXSupply && "..."}
                {totalXDXSupply && (
                  <div>
                    {formatAmount(totalXDXSupply, 18, 0, true)} $XDX ($
                    {formatAmount(totalSupplyUsd, USD_DECIMALS, 0, true)})
                  </div>
                )}
              </div>
              <div className="App-card-divider" />
              <div className="App-card-options">
                <Link className="App-button-option App-card-option" to="/buy_xdx">
                  <Trans>Buy $XDX</Trans>
                </Link>
                {active && (
                  <button className="App-button-option App-card-option" onClick={() => showStakeXDXModal()}>
                    <Trans>Stake</Trans>
                  </button>
                )}
                {active && (
                  <button className="App-button-option App-card-option" onClick={() => showUnstakeXDXModal()}>
                    <Trans>Unstake</Trans>
                  </button>
                )}
                {active && (
                  <Link className="App-button-option App-card-option" to="/begin_account_transfer">
                    <Trans>Transfer Account</Trans>
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="App-card primary StakeV2-total-rewards-card">
            <div className="App-card-title">
              <Trans>Total Rewards</Trans>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  {nativeTokenSymbol} ({wrappedTokenSymbol})
                </div>
                <div>
                  {formatKeyAmount(processedData, "totalNativeTokenRewards", 18, 4, true)} ($
                  {formatKeyAmount(processedData, "totalNativeTokenRewardsUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">$XDX</div>
                <div>
                  {formatKeyAmount(processedData, "totalVesterRewards", 18, 4, true)} ($
                  {formatKeyAmount(processedData, "totalVesterRewardsUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Escrowed $XDX</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "totalEsXDXRewards", 18, 4, true)} ($
                  {formatKeyAmount(processedData, "totalEsXDXRewardsUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Multiplier Points</Trans>
                </div>
                <div>{formatKeyAmount(processedData, "bonusXDXTrackerRewards", 18, 4, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Staked Multiplier Points</Trans>
                </div>
                <div>{formatKeyAmount(processedData, "bnXDXInFeeXDX", 18, 4, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total</Trans>
                </div>
                <div>${formatKeyAmount(processedData, "totalRewardsUsd", USD_DECIMALS, 2, true)}</div>
              </div>
              <div className="App-card-bottom-placeholder">
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {active && (
                    <button className="App-button-option App-card-option">
                      <Trans>Compound</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-button-option App-card-option">
                      <Trans>Claim</Trans>
                    </button>
                  )}
                  {!active && (
                    <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>
              <div className="App-card-bottom">
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {active && (
                    <button
                      className="App-button-option App-card-option"
                      onClick={() => setIsCompoundModalVisible(true)}
                    >
                      <Trans>Compound</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-button-option App-card-option" onClick={() => setIsClaimModalVisible(true)}>
                      <Trans>Claim</Trans>
                    </button>
                  )}
                  {!active && (
                    <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                      <Trans>Connect Wallet</Trans>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title">$XLX ({chainName})</div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  <Trans>Price</Trans>
                </div>
                <div>${formatKeyAmount(processedData, "xlxPrice", USD_DECIMALS, 3, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Wallet</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "xlxBalance", XLX_DECIMALS, 2, true)} $XLX ($
                  {formatKeyAmount(processedData, "xlxBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "xlxBalance", XLX_DECIMALS, 2, true)} $XLX ($
                  {formatKeyAmount(processedData, "xlxBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>APR</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`${formatKeyAmount(processedData, "xlxAprTotal", 2, 2, true)}%`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <StatsTooltipRow
                            label={`${nativeTokenSymbol} (${wrappedTokenSymbol}) APR`}
                            value={`${formatKeyAmount(processedData, "xlxAprForNativeToken", 2, 2, true)}%`}
                            showDollar={false}
                          />
                          <StatsTooltipRow
                            label="Escrowed $XDX APR"
                            value={`${formatKeyAmount(processedData, "xlxAprForEsXDX", 2, 2, true)}%`}
                            showDollar={false}
                          />
                          <br />

                          <Trans>
                            APRs are updated weekly on Wednesday and will depend on the fees collected for the week.
                          </Trans>
                        </>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Rewards</Trans>
                </div>
                <div>
                  <Tooltip
                    handle={`$${formatKeyAmount(processedData, "totalXLXRewardsUsd", USD_DECIMALS, 2, true)}`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <StatsTooltipRow
                            label={`${nativeTokenSymbol} (${wrappedTokenSymbol})`}
                            value={`${formatKeyAmount(
                              processedData,
                              "feeXLXTrackerRewards",
                              18,
                              4
                            )} ($${formatKeyAmount(processedData, "feeXLXTrackerRewardsUsd", USD_DECIMALS, 2, true)})`}
                            showDollar={false}
                          />
                          <StatsTooltipRow
                            label="Escrowed $XDX"
                            value={`${formatKeyAmount(
                              processedData,
                              "stakedXLXTrackerRewards",
                              18,
                              4
                            )} ($${formatKeyAmount(
                              processedData,
                              "stakedXLXTrackerRewardsUsd",
                              USD_DECIMALS,
                              2,
                              true
                            )})`}
                            showDollar={false}
                          />
                        </>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "xlxSupply", 18, 2, true)} $XLX ($
                  {formatKeyAmount(processedData, "xlxSupplyUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Supply</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "xlxSupply", 18, 2, true)} $XLX ($
                  {formatKeyAmount(processedData, "xlxSupplyUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-options">
                <Link className="App-button-option App-card-option" to="/buy_xlx">
                  <Trans>Buy $XLX</Trans>
                </Link>
                <Link className="App-button-option App-card-option" to="/buy_xlx#redeem">
                  <Trans>Sell $XLX</Trans>
                </Link>
                {/* {hasInsurance && (
                  <a
                    className="App-button-option App-card-option"
                    href="https://app.insurace.io/Insurance/Cart?id=124&referrer=545066382753150189457177837072918687520318754040"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Trans>Purchase Insurance</Trans>
                  </a>
                )} */}
              </div>
            </div>
          </div>
          <div className="App-card">
            <div className="App-card-title">
              <Trans>Escrowed $XDX</Trans>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  <Trans>Price</Trans>
                </div>
                <div>${formatAmount(xdxPrice, USD_DECIMALS, 2, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Wallet</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "esXDXBalance", 18, 2, true)} esXDX ($
                  {formatKeyAmount(processedData, "esXDXBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "esXDXInStakedXDX", 18, 2, true)} esXDX ($
                  {formatKeyAmount(processedData, "esXDXInStakedXDXUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>APR</Trans>
                </div>
                <div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(processedData, "xdxAprTotalWithBoost", 2, 2, true)}%`}
                      position="right-bottom"
                      renderContent={() => {
                        return (
                          <>
                            <StatsTooltipRow
                              label={`${nativeTokenSymbol} (${wrappedTokenSymbol}) Base APR`}
                              value={`${formatKeyAmount(processedData, "xdxAprForNativeToken", 2, 2, true)}%`}
                              showDollar={false}
                            />
                            {processedData.bnXDXInFeeXDX && processedData.bnXDXInFeeXDX.gt(0) && (
                              <StatsTooltipRow
                                label={`${nativeTokenSymbol} (${wrappedTokenSymbol}) Boosted APR`}
                                value={`${formatKeyAmount(processedData, "xdxBoostAprForNativeToken", 2, 2, true)}%`}
                                showDollar={false}
                              />
                            )}
                            <StatsTooltipRow
                              label="Escrowed $XDX APR"
                              value={`${formatKeyAmount(processedData, "xdxAprForEsXDX", 2, 2, true)}%`}
                              showDollar={false}
                            />
                          </>
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">{renderMultiplierPointsLabel()}</div>
                <div>{renderMultiplierPointsValue()}</div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Staked</Trans>
                </div>
                <div>
                  {formatKeyAmount(processedData, "stakedEsXDXSupply", 18, 0, true)} esXDX ($
                  {formatKeyAmount(processedData, "stakedEsXDXSupplyUsd", USD_DECIMALS, 0, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Total Supply</Trans>
                </div>
                <div>
                  {formatAmount(esXDXSupply, 18, 0, true)} esXDX (${formatAmount(esXDXSupplyUsd, USD_DECIMALS, 0, true)}
                  )
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-options">
                {active && (
                  <button className="App-button-option App-card-option" onClick={() => showStakeEsXDXModal()}>
                    <Trans>Stake</Trans>
                  </button>
                )}
                {active && (
                  <button className="App-button-option App-card-option" onClick={() => showUnstakeEsXDXModal()}>
                    <Trans>Unstake</Trans>
                  </button>
                )}
                {!active && (
                  <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                    <Trans> Connect Wallet</Trans>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="Tab-title-section">
          <div className="Page-title">
            <Trans>Vest</Trans>
          </div>
          <div className="Page-description">
            <Trans>
              Convert esXDX tokens to $XDX tokens.
              <br />
              Please read the{" "}
              <a
                href="https://xdx.gitbook.io/xdx/how-it-works/rewards"
                target="_blank"
                rel="noopener noreferrer"
              >
                vesting details
              </a>{" "}
              before using the vaults.
            </Trans>
          </div>
        </div>
        <div>
          <div className="StakeV2-cards">
            <div className="App-card StakeV2-xdx-card">
              <div className="App-card-title">
                <Trans>$XDX Vault</Trans>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Staked Tokens</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={formatAmount(totalRewardTokens, 18, 2, true)}
                      position="right-bottom"
                      renderContent={() => {
                        return (
                          <>
                            <StatsTooltipRow
                              showDollar={false}
                              label="$XDX"
                              value={formatAmount(processedData.xdxInStakedXDX, 18, 2, true)}
                            />

                            <StatsTooltipRow
                              showDollar={false}
                              label="esXDX"
                              value={formatAmount(processedData.esXDXInStakedXDX, 18, 2, true)}
                            />
                            <StatsTooltipRow
                              showDollar={false}
                              label="Multiplier Points"
                              value={formatAmount(processedData.bnXDXInFeeXDX, 18, 2, true)}
                            />
                          </>
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Reserved for Vesting</Trans>
                  </div>
                  <div>
                    {formatKeyAmount(vestingData, "xdxVesterPairAmount", 18, 2, true)} /{" "}
                    {formatAmount(totalRewardTokens, 18, 2, true)}
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Vesting Status</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "xdxVesterClaimSum", 18, 4, true)} / ${formatKeyAmount(
                        vestingData,
                        "xdxVesterVestedAmount",
                        18,
                        4,
                        true
                      )}`}
                      position="right-bottom"
                      renderContent={() => {
                        return (
                          <div>
                            <Trans>
                              {formatKeyAmount(vestingData, "xdxVesterClaimSum", 18, 4, true)} tokens have been
                              converted to $XDX from the{" "}
                              {formatKeyAmount(vestingData, "xdxVesterVestedAmount", 18, 4, true)} esXDX deposited for
                              vesting.
                            </Trans>
                          </div>
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Claimable</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "xdxVesterClaimable", 18, 4, true)} $XDX`}
                      position="right-bottom"
                      renderContent={() => (
                        <Trans>
                          {formatKeyAmount(vestingData, "xdxVesterClaimable", 18, 4, true)} $XDX tokens can be claimed,
                          use the options under the Total Rewards section to claim them.
                        </Trans>
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {!active && (
                    <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                      <Trans>Connect Wallet</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-button-option App-card-option" onClick={() => showXDXVesterDepositModal()}>
                      <Trans>Deposit</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-button-option App-card-option" onClick={() => showXDXVesterWithdrawModal()}>
                      <Trans>Withdraw</Trans>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="App-card StakeV2-xdx-card">
              <div className="App-card-title">
                <Trans>$XLX Vault</Trans>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Staked Tokens</Trans>
                  </div>
                  <div>{formatAmount(processedData.xlxBalance, 18, 2, true)} $XLX</div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Reserved for Vesting</Trans>
                  </div>
                  <div>
                    {formatKeyAmount(vestingData, "xlxVesterPairAmount", 18, 2, true)} /{" "}
                    {formatAmount(processedData.xlxBalance, 18, 2, true)}
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Vesting Status</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "xlxVesterClaimSum", 18, 4, true)} / ${formatKeyAmount(
                        vestingData,
                        "xlxVesterVestedAmount",
                        18,
                        4,
                        true
                      )}`}
                      position="right-bottom"
                      renderContent={() => {
                        return (
                          <div>
                            <Trans>
                              {formatKeyAmount(vestingData, "xlxVesterClaimSum", 18, 4, true)} tokens have been
                              converted to $XDX from the{" "}
                              {formatKeyAmount(vestingData, "xlxVesterVestedAmount", 18, 4, true)} esXDX deposited for
                              vesting.
                            </Trans>
                          </div>
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Claimable</Trans>
                  </div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "xlxVesterClaimable", 18, 4, true)} $XDX`}
                      position="right-bottom"
                      renderContent={() => (
                        <Trans>
                          {formatKeyAmount(vestingData, "xlxVesterClaimable", 18, 4, true)} $XDX tokens can be claimed,
                          use the options under the Total Rewards section to claim them.
                        </Trans>
                      )}
                    />
                  </div>
                </div>
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {!active && (
                    <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                      <Trans>Connect Wallet</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-button-option App-card-option" onClick={() => showXLXVesterDepositModal()}>
                      <Trans>Deposit</Trans>
                    </button>
                  )}
                  {active && (
                    <button className="App-button-option App-card-option" onClick={() => showXLXVesterWithdrawModal()}>
                      <Trans>Withdraw</Trans>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
