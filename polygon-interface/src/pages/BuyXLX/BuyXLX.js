import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";

import XLXSwap from "components/XLX/XLXSwap";
import buyXLXIcon from "img/ic_buy_xlx.svg";
import Footer from "components/Footer/Footer";
import "./BuyXLX.css";

import { Trans } from "@lingui/macro";
import { getNativeToken } from "config/tokens";
import { useChainId } from "lib/chains";
import ExternalLink from "components/ExternalLink/ExternalLink";
import { t } from "@lingui/macro";

export default function BuyXLX(props) {
  const { chainId } = useChainId();
  const history = useHistory();
  const [isBuying, setIsBuying] = useState(true);
  const nativeTokenSymbol = getNativeToken(chainId).symbol;

  useEffect(() => {
    const hash = history.location.hash.replace("#", "");
    const buying = hash === "redeem" ? false : true;
    setIsBuying(buying);
  }, [history.location.hash]);

  return (
    <div className="default-container page-layout">
      <div className="section-title-block">
        <div className="section-title-icon">
          <img src={buyXLXIcon} alt={t`Buy $XLX Icon`} />
        </div>
        <div className="section-title-content">
          <div className="Page-title">
            <Trans>Buy / Sell $XLX</Trans>
          </div>
          <div className="Page-description">
            {/* <Trans> */}
            Purchase{" "}
            <ExternalLink href="https://xdx.gitbook.io/xdx/tokenomics/xlx">$XLX tokens</ExternalLink> to
            earn {nativeTokenSymbol} fees from swaps and leverages trading.
            {/* </Trans> */}
            <br />
            <Trans>
              Note that there is a minimum holding time of 15 minutes after a purchase.
            </Trans>
          </div>
        </div>
      </div>
      <XLXSwap {...props} isBuying={isBuying} setIsBuying={setIsBuying} />
      <Footer />
    </div>
  );
}
