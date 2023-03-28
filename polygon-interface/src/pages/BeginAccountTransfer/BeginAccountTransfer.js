import React, { useState } from "react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";

import { getContract } from "config/contracts";

import Modal from "components/Modal/Modal";
import Footer from "components/Footer/Footer";

import Token from "abis/Token.json";
import Vester from "abis/Vester.json";
import RewardTracker from "abis/RewardTracker.json";
import RewardRouter from "abis/RewardRouter.json";

import { FaCheck, FaTimes } from "react-icons/fa";

import { Trans, t } from "@lingui/macro";

import "./BeginAccountTransfer.css";
import { callContract, contractFetcher } from "lib/contracts";
import { approveTokens } from "domain/tokens";
import { useChainId } from "lib/chains";

function ValidationRow({ isValid, children }) {
  return (
    <div className="ValidationRow">
      <div className="ValidationRow-icon-container">
        {isValid && <FaCheck className="ValidationRow-icon" />}
        {!isValid && <FaTimes className="ValidationRow-icon" />}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function BeginAccountTransfer(props) {
  const { setPendingTxns } = props;
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();

  const [receiver, setReceiver] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isTransferSubmittedModalVisible, setIsTransferSubmittedModalVisible] = useState(false);
  let parsedReceiver = ethers.constants.AddressZero;
  if (ethers.utils.isAddress(receiver)) {
    parsedReceiver = receiver;
  }

  const xdxAddress = getContract(chainId, "XDX");
  const xdxVesterAddress = getContract(chainId, "XDXVester");
  const xlxVesterAddress = getContract(chainId, "XLXVester");

  const rewardRouterAddress = getContract(chainId, "RewardRouter");

  const { data: xdxVesterBalance } = useSWR([active, chainId, xdxVesterAddress, "balanceOf", account], {
    fetcher: contractFetcher(library, Token),
  });

  const { data: xlxVesterBalance } = useSWR([active, chainId, xlxVesterAddress, "balanceOf", account], {
    fetcher: contractFetcher(library, Token),
  });

  const stakedXDXTrackerAddress = getContract(chainId, "StakedXDXTracker");
  const { data: cumulativeXDXRewards } = useSWR(
    [active, chainId, stakedXDXTrackerAddress, "cumulativeRewards", parsedReceiver],
    {
      fetcher: contractFetcher(library, RewardTracker),
    }
  );

  const stakedXLXTrackerAddress = getContract(chainId, "StakedXLXTracker");
  const { data: cumulativeXLXRewards } = useSWR(
    [active, chainId, stakedXLXTrackerAddress, "cumulativeRewards", parsedReceiver],
    {
      fetcher: contractFetcher(library, RewardTracker),
    }
  );

  const { data: transferredCumulativeXDXRewards } = useSWR(
    [active, chainId, xdxVesterAddress, "transferredCumulativeRewards", parsedReceiver],
    {
      fetcher: contractFetcher(library, Vester),
    }
  );

  const { data: transferredCumulativeXLXRewards } = useSWR(
    [active, chainId, xlxVesterAddress, "transferredCumulativeRewards", parsedReceiver],
    {
      fetcher: contractFetcher(library, Vester),
    }
  );

  const { data: pendingReceiver } = useSWR([active, chainId, rewardRouterAddress, "pendingReceivers", account], {
    fetcher: contractFetcher(library, RewardRouter),
  });

  const { data: xdxAllowance } = useSWR([active, chainId, xdxAddress, "allowance", account, stakedXDXTrackerAddress], {
    fetcher: contractFetcher(library, Token),
  });

  const { data: xdxStaked } = useSWR(
    [active, chainId, stakedXDXTrackerAddress, "depositBalances", account, xdxAddress],
    {
      fetcher: contractFetcher(library, RewardTracker),
    }
  );

  const needApproval = xdxAllowance && xdxStaked && xdxStaked.gt(xdxAllowance);

  const hasVestedXDX = xdxVesterBalance && xdxVesterBalance.gt(0);
  const hasVestedXLX = xlxVesterBalance && xlxVesterBalance.gt(0);
  const hasStakedXDX =
    (cumulativeXDXRewards && cumulativeXDXRewards.gt(0)) ||
    (transferredCumulativeXDXRewards && transferredCumulativeXDXRewards.gt(0));
  const hasStakedXLX =
    (cumulativeXLXRewards && cumulativeXLXRewards.gt(0)) ||
    (transferredCumulativeXLXRewards && transferredCumulativeXLXRewards.gt(0));
  const hasPendingReceiver = pendingReceiver && pendingReceiver !== ethers.constants.AddressZero;

  const getError = () => {
    if (!account) {
      return t`Wallet is not connected`;
    }
    if (hasVestedXDX) {
      return t`Vested $XDX not withdrawn`;
    }
    if (hasVestedXLX) {
      return t`Vested $XLX not withdrawn`;
    }
    if (!receiver || receiver.length === 0) {
      return t`Enter Receiver Address`;
    }
    if (!ethers.utils.isAddress(receiver)) {
      return t`Invalid Receiver Address`;
    }
    if (hasStakedXDX || hasStakedXLX) {
      return t`Invalid Receiver`;
    }
    if ((parsedReceiver || "").toString().toLowerCase() === (account || "").toString().toLowerCase()) {
      return t`Self-transfer not supported`;
    }

    if (
      (parsedReceiver || "").length > 0 &&
      (parsedReceiver || "").toString().toLowerCase() === (pendingReceiver || "").toString().toLowerCase()
    ) {
      return t`Transfer already initiated`;
    }
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isTransferring) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (needApproval) {
      return t`Approve $XDX`;
    }
    if (isApproving) {
      return t`Approving...`;
    }
    if (isTransferring) {
      return t`Transferring`;
    }

    return t`Begin Transfer`;
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

    setIsTransferring(true);
    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());

    callContract(chainId, contract, "signalTransfer", [parsedReceiver], {
      sentMsg: t`Transfer submitted!`,
      failMsg: t`Transfer failed.`,
      setPendingTxns,
    })
      .then(async (res) => {
        setIsTransferSubmittedModalVisible(true);
      })
      .finally(() => {
        setIsTransferring(false);
      });
  };

  const completeTransferLink = `/complete_account_transfer/${account}/${parsedReceiver}`;
  const pendingTransferLink = `/complete_account_transfer/${account}/${pendingReceiver}`;

  return (
    <div className="BeginAccountTransfer Page page-layout">
      <Modal
        isVisible={isTransferSubmittedModalVisible}
        setIsVisible={setIsTransferSubmittedModalVisible}
        label={t`Transfer Submitted`}
      >
        <Trans>Your transfer has been initiated.</Trans>
        <br />
        <br />
        <Link className="App-cta" to={completeTransferLink}>
          <Trans>Continue</Trans>
        </Link>
      </Modal>
      <div className="Page-title-section">
        <div className="Page-title">
          <Trans>Transfer Account</Trans>
        </div>
        <div className="Page-description">
          <Trans>
            Please only use this for full account transfers.
            <br />
            This will transfer all your $XDX, esXDX, $XLX and Multiplier Points to your new account.
            <br />
            Transfers are only supported if the receiving account has not staked $XDX or $XLX tokens before.
            <br />
            Transfers are one-way, you will not be able to transfer staked tokens back to the sending account.
          </Trans>
        </div>
        {hasPendingReceiver && (
          <div className="Page-description">
            <Trans>
              You have a <Link to={pendingTransferLink}>pending transfer</Link> to {pendingReceiver}.
            </Trans>
          </div>
        )}
      </div>
      <div className="Page-content">
        <div className="input-form">
          <div className="input-row">
            <label className="input-label">
              <Trans>Receiver Address</Trans>
            </label>
            <div>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="text-input"
              />
            </div>
          </div>
          <div className="BeginAccountTransfer-validations">
            <ValidationRow isValid={!hasVestedXDX}>
              <Trans>Sender has withdrawn all tokens from $XDX Vesting Vault</Trans>
            </ValidationRow>
            <ValidationRow isValid={!hasVestedXLX}>
              <Trans>Sender has withdrawn all tokens from $XLX Vesting Vault</Trans>
            </ValidationRow>
            <ValidationRow isValid={!hasStakedXDX}>
              <Trans>Receiver has not staked $XDX tokens before</Trans>
            </ValidationRow>
            <ValidationRow isValid={!hasStakedXLX}>
              <Trans>Receiver has not staked $XLX tokens before</Trans>
            </ValidationRow>
          </div>
          <div className="input-row">
            <button
              className="App-cta Exchange-swap-button"
              disabled={!isPrimaryEnabled()}
              onClick={() => onClickPrimary()}
            >
              {getPrimaryText()}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
