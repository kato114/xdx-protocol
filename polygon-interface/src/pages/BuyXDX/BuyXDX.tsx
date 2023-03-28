import React, { useCallback } from "react";
import Footer from "components/Footer/Footer";
import "./BuyXDX.css";
import { useWeb3React } from "@web3-react/core";
import { Trans, t } from "@lingui/macro";
import Button from "components/Common/Button";
import { ARBITRUM, AVALANCHE, getChainName, getConstant } from "config/chains";
import { switchNetwork } from "lib/wallets";
import { useChainId } from "lib/chains";
import Card from "components/Common/Card";
import { importImage } from "lib/legacy";
import ExternalLink from "components/ExternalLink/ExternalLink";

import Banxa from "img/ic_banxa.svg";
import Uniswap from "img/ic_uni_arbitrum.svg";
import Traderjoe from "img/ic_traderjoe.png";
import Bungee from "img/ic_bungee.png";
import O3 from "img/ic_o3.png";
import Binance from "img/ic_binance.svg";
import ohmArbitrum from "img/ic_olympus_arbitrum.svg";
import { CENTRALISED_EXCHANGES, DECENTRALISED_AGGRIGATORS, EXTERNAL_LINKS, TRANSFER_EXCHANGES } from "./constants";

export default function BuyXDX() {
  const { chainId } = useChainId();
  const isArbitrum = chainId === ARBITRUM;
  const { active } = useWeb3React();
  const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");
  const externalLinks = EXTERNAL_LINKS[chainId];

  const onNetworkSelect = useCallback(
    (value) => {
      if (value === chainId) {
        return;
      }
      return switchNetwork(value, active);
    },
    [chainId, active]
  );

  return (
    <div className="BuyXDXXLX default-container">
        {isArbitrum ? (
          <div className="section-title-block mt-top">
            <div className="section-title-content">
              <div className="Page-title">
                <Trans>Buy / Transfer ETH</Trans>
              </div>
              <div className="Page-description">
                <Trans>ETH is needed on Avalanche to purchase XDX.</Trans>
              </div>
            </div>
          </div>
        ) : (
          <div className="section-title-block mt-top">
            <div className="section-title-content">
              <div className="Page-title">
                <Trans>Buy / Transfer AVAX</Trans>
              </div>
              <div className="Page-description">
                <Trans>Avax is needed on Avalanche to purchase XDX.</Trans>
              </div>
            </div>
          </div>
        )}

        <div className="cards-row">
          <Card title={t`Buy ${nativeTokenSymbol}`}>
            <div className="App-card-content">
              <div className="BuyXDXXLX-description">
                {isArbitrum ? (
                  <Trans>
                    You can buy ETH directly on{" "}
                    <ExternalLink href={externalLinks.networkWebsite}>Arbitrum</ExternalLink> using these options:
                  </Trans>
                ) : (
                  <Trans>
                    You can buy AVAX directly on{" "}
                    <ExternalLink href={externalLinks.networkWebsite}>Avalanche</ExternalLink> using these options:
                  </Trans>
                )}
              </div>
              <div className="buttons-group">
                <Button href={externalLinks.bungee} imgSrc={Bungee}>
                  Bungee
                </Button>
                <Button href={externalLinks.o3} imgSrc={O3}>
                  O3
                </Button>
                <Button href={externalLinks.banxa} imgSrc={Banxa}>
                  Banxa
                </Button>
              </div>
            </div>
          </Card>
          <Card title={t`Transfer ${nativeTokenSymbol}`}>
            <div className="App-card-content">
              {isArbitrum ? (
                <div className="BuyXDXXLX-description">
                  <Trans>You can transfer ETH from other networks to Arbitrum using any of the below options:</Trans>
                </div>
              ) : (
                <div className="BuyXDXXLX-description">
                  <Trans>You can transfer AVAX from other networks to Avalanche using any of the below options:</Trans>
                </div>
              )}
              <div className="buttons-group">
                {TRANSFER_EXCHANGES.filter((e) => e.networks.includes(chainId)).map((exchange) => {
                  const icon = importImage(exchange.icon) || "";
                  return (
                    <Button key={exchange.name} href={exchange.link} imgSrc={icon}>
                      {exchange.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
        <div className="BuyXDXXLX-container mt-top">
          <div className="section-title-block">
            <div className="section-title-content">
              <div className="Page-title">
                <Trans>Buy $XDX</Trans>
              </div>
              <div className="Page-description">
                <Trans>Choose to buy from decentralized or centralized exchanges.</Trans>
                <br />
              </div>
            </div>
          </div>
          <div className="cards-row">
            <DecentralisedExchanges chainId={chainId} externalLinks={externalLinks} />
            {/* <CentralisedExchanges chainId={chainId} externalLinks={externalLinks} /> */}
          </div>
      </div>
      <Footer />
    </div>
  );
}

function DecentralisedExchanges({ chainId, externalLinks }) {
  const isArbitrum = chainId === ARBITRUM;
  return (
    <Card title={t`Buy $XDX from a Decentralized Exchange`}>
      <div className="App-card-content">
        <div className="exchange-info-group">
          <div className="buttons-group col-1">
            <Button imgSrc={Traderjoe} href={externalLinks.buyXDX.traderjoe}>
              <Trans>TraderJoe</Trans>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CentralisedExchanges({ chainId, externalLinks }) {
  return (
    <Card title={t`Buy $XDX from centralized services`}>
      <div className="App-card-content">
        <div className="exchange-info-group">
          <div className="BuyXDXXLX-description"></div>
          <div className="buttons-group">
          </div>
        </div>

        <div className="exchange-info-group">
          <div className="BuyXDXXLX-description"></div>
          <div className="buttons-group col-2">
          </div>
        </div>
      </div>
    </Card>
  );
}
