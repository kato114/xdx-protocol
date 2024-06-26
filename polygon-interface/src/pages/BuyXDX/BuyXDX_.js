import React, { useCallback } from "react";
import Footer from "components/Footer/Footer";
import "./BuyXDX.css";

import { useWeb3React } from "@web3-react/core";

import Synapse from "img/ic_synapse.svg";
import Multiswap from "img/ic_multiswap.svg";
import Hop from "img/ic_hop.svg";
import Banxa from "img/ic_banxa.svg";
import Binance from "img/ic_binance_logo.svg";
import avax30Icon from "img/ic_avax_30.svg";
import xdxArbitrum from "img/ic_xdx_arbitrum.svg";
import xdxAvax from "img/ic_xdx_avax.svg";
import ohmArbitrum from "img/ic_olympus_arbitrum.svg";

import { Trans } from "@lingui/macro";
import Button from "components/Common/Button";
import { ARBITRUM, AVALANCHE } from "config/chains";
import { switchNetwork } from "lib/wallets";
import { useChainId } from "lib/chains";
import ExternalLink from "components/ExternalLink/ExternalLink";

export default function BuyXDX() {
  const { chainId } = useChainId();
  const { active } = useWeb3React();

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
    <div className="BuyXDXXLX default-container page-layout">
      <div className="BuyXDXXLX-container">
        {chainId === ARBITRUM && (
          <div className="section-title-block">
            <div className="section-title-content">
              <div className="Page-title">
                <Trans>Buy / Transfer ETH</Trans>
              </div>
              <div className="Page-description">
                <Trans>ETH is needed on Arbitrum to purchase $XDX.</Trans>
                <br />
                {/* <Trans>
                  To purchase $XDX on <span onClick={() => onNetworkSelect(AVALANCHE)}>Avalanche</span>, please change
                  your network.
                </Trans> */}
              </div>
            </div>
          </div>
        )}
        {chainId === ARBITRUM && (
          <div className="BuyXDXXLX-panel">
            <div className="App-card no-height">
              <div className="App-card-title">
                <Trans>Buy ETH</Trans>
              </div>
              <div className="App-card-divider" />
              <div className="App-card-content">
                <div className="BuyXDXXLX-description">
                  <Trans>
                    You can buy ETH directly on <ExternalLink href="https://arbitrum.io/">Arbitrum</ExternalLink> using
                    Banxa:
                  </Trans>
                </div>
                <div className="direct-purchase-options">
                  <Button
                    href="https://xdx.banxa.com?coinType=ETH&fiatType=USD&fiatAmount=500&blockchain=arbitrum"
                    imgSrc={Banxa}
                  >
                    <Trans>Banxa</Trans>
                  </Button>
                </div>
              </div>
            </div>
            <div className="App-card no-height">
              <div className="App-card-title">
                <Trans>Transfer ETH</Trans>
              </div>
              <div className="App-card-divider" />
              <div className="App-card-content">
                <div className="BuyXDXXLX-description">
                  <Trans>You can transfer ETH from other networks to Arbitrum using any of the below options:</Trans>
                </div>
                <div className="bridge-options">
                  <Button
                    href="https://synapseprotocol.com/?inputCurrency=ETH&outputCurrency=ETH&outputChain=42161"
                    align="left"
                    imgSrc={Synapse}
                  >
                    <Trans>Synapse</Trans>
                  </Button>
                  <Button href="https://app.multichain.org/#/router" align="left" imgSrc={Multiswap}>
                    <Trans>Multiswap</Trans>
                  </Button>
                  <Button
                    href="https://app.hop.exchange/send?token=ETH&sourceNetwork=ethereum&destNetwork=arbitrum"
                    align="left"
                    imgSrc={Hop}
                  >
                    <Trans>Hop</Trans>
                  </Button>
                  <Button href="https://binance.com/" align="left" imgSrc={Binance}>
                    <Trans>Binance</Trans>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {chainId === AVALANCHE && (
          <div className="section-title-block">
            <div className="section-title-content">
              <div className="Page-title">
                <Trans>Buy / Transfer AVAX</Trans>
              </div>
              <div className="Page-description">
                <Trans>Avax is needed on Avalanche to purchase $XDX.</Trans>
                <br />
                {/* <Trans>
                  To purchase $XDX on <span onClick={() => onNetworkSelect(ARBITRUM)}>Arbitrum</span>, please change your
                  network.
                </Trans> */}
              </div>
            </div>
          </div>
        )}
        {chainId === AVALANCHE && (
          <div className="BuyXDXXLX-panel">
            <div className="App-card no-height">
              <div className="App-card-title">
                <Trans>Buy AVAX</Trans>
              </div>
              <div className="App-card-divider" />
              <div className="App-card-content">
                <div className="BuyXDXXLX-description">
                  <Trans>
                    You can buy AVAX directly on <ExternalLink href="https://www.avax.network/">Avalanche</ExternalLink>{" "}
                    using Banxa:
                  </Trans>
                </div>
                <div className="direct-purchase-options">
                  <Button
                    href="https://xdx.banxa.com?coinType=AVAX&fiatType=USD&fiatAmount=500&blockchain=avalanche"
                    imgSrc={Banxa}
                  >
                    <Trans>Banxa</Trans>
                  </Button>
                </div>
              </div>
            </div>
            <div className="App-card no-height">
              <div className="App-card-title">
                <Trans>Transfer AVAX</Trans>
              </div>
              <div className="App-card-divider" />
              <div className="App-card-content">
                <div className="BuyXDXXLX-description">
                  <Trans>You can transfer AVAX to Avalanche using any of the below options.</Trans> <br />
                  <br />
                  <Trans>
                    Using the Avalanche or Synapse bridges, you can also transfer any other supported cryptocurrency,
                    and receive free AVAX to pay for the network's fees.
                  </Trans>
                </div>
                <div className="bridge-options">
                  <Button align="left" href="https://bridge.avax.network/" imgSrc={avax30Icon}>
                    <Trans>Avalanche</Trans>
                  </Button>
                  <Button align="left" href="https://synapseprotocol.com/" imgSrc={Synapse}>
                    <Trans>Synapse</Trans>
                  </Button>
                  <Button align="left" href="https://app.multichain.org/" imgSrc={Multiswap}>
                    <Trans>Multiswap</Trans>
                  </Button>
                  <Button align="left" href="https://binance.com" imgSrc={Binance}>
                    <Trans>Binance</Trans>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {chainId === AVALANCHE && (
          <div className="BuyXDXXLX-panel">
            <div className="buy-card">
              <div className="section-title-content">
                <div className="card-title">
                  <Trans>Buy $XDX</Trans>
                </div>
              </div>
              <div className="App-card no-height">
                <div className="App-card-content no-title">
                  <div className="BuyXDXXLX-description better-rates-description">
                    <Trans>
                      After you have ETH, set your network to{" "}
                      <ExternalLink href="https://arbitrum.io/bridge-tutorial/">Arbitrum</ExternalLink> then click the
                      button below:
                    </Trans>
                  </div>
                  <div className="direct-purchase-options">
                    <Button
                      size="xl"
                      imgSrc={xdxAvax}
                      href="http://test.hurricaneswap.com/#/swap"
                    >
                      <Trans>Purchase $XDX</Trans>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {chainId === ARBITRUM && (
          <div className="BuyXDXXLX-panel">
            <div className="buy-card">
              <div className="section-title-content">
                <div className="card-title">
                  <Trans>Buy $XDX</Trans>
                </div>
              </div>
              <div className="App-card no-height">
                <div className="App-card-content no-title">
                  <div className="BuyXDXXLX-description better-rates-description">
                    <Trans>
                      After you have ETH, set your network to{" "}
                      <ExternalLink href="https://arbitrum.io/bridge-tutorial/">Arbitrum</ExternalLink> then click the
                      button below:
                    </Trans>
                  </div>
                  <div className="buy-xdx">
                    <Button
                      size="xl"
                      imgSrc={xdxArbitrum}
                      href="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a"
                    >
                      <Trans>Purchase $XDX</Trans>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="buy-card">
              <div className="section-title-content">
                <div className="card-title">
                  <Trans>Buy $XDX Bonds</Trans>
                </div>
              </div>
              <div className="App-card no-height">
                <div className="App-card-content no-title">
                  <div className="BuyXDXXLX-description">
                    <Trans>$XDX bonds can be bought on Olympus Pro with a discount and a small vesting period:</Trans>
                  </div>
                  <div className="buy-xdx">
                    <Button size="xl" imgSrc={ohmArbitrum} href="https://pro.olympusdao.finance/#/partners/XDX">
                      <Trans>Olympus Pro</Trans>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
