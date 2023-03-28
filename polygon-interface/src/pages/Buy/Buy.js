import React from "react";
import { Trans } from "@lingui/macro";
import Footer from "components/Footer/Footer";
import "./Buy.css";
import TokenCard from "components/TokenCard/TokenCard";
import buyXDXIcon from "img/buy_xdx.svg";
import SEO from "components/Common/SEO";
import { getPageTitle } from "lib/legacy";

export default function BuyXDXXLX() {
  return (
    <SEO title={getPageTitle("Buy $XLX or $XDX")}>
      <div className="BuyXDXXLX page-layout">
        <div className="BuyXDXXLX-container default-container">
          <div className="section-title-block">
            <div className="section-title-icon">
              <img src={buyXDXIcon} alt="buyXDXIcon" />
            </div>
            <div className="section-title-content">
              <div className="Page-title">
                <Trans>Buy $XDX or $XLX</Trans>
              </div>
              <div className="Page-description">
                XDX and XLX can be purchased on the Avalanche Network.
              </div>
            </div>
          </div>
          <TokenCard />
        </div>
        <Footer />
      </div>
    </SEO>
  );
}
