import React from "react";
import cx from "classnames";
import { t } from "@lingui/macro";
import "./Footer.css";
import twitterIcon from "img/ic_twitter.svg";
import discordIcon from "img/ic_discord.svg";
import githubIcon from "img/ic_github.svg";
import mediumIcon from "img/ic_medium.svg";
import { isHomeSite, getAppBaseUrl, shouldShowRedirectModal } from "lib/legacy";

const footerLinks = {
  home: [
    { text: t`Terms and Conditions`, link: "/terms-and-conditions" },
    { text: t`Referral Terms`, link: "https://xdx.gitbook.io/xdx/how-it-works/referrals", external: true },
    { text: t`Media Kit`, link: "https://xdx.gitbook.io/xdx/", external: true },
    // { text: "Jobs", link: "/jobs", isAppLink: true },
  ],
  app: [
    { text: t`Terms and Conditions`, link: "/terms-and-conditions" },
    { text: t`Referral Terms`, link: "/referral-terms" },
    { text: t`Media Kit`, link: "https://xdx.gitbook.io/xdx/", external: true },
    // { text: "Jobs", link: "/jobs" },
  ],
};

const socialLinks = [
  { link: "https://discord.gg/xdx", name: "Discord", icon: discordIcon },
  { link: "https://twitter.com/xdxexchange", name: "Twitter", icon: twitterIcon },
  { link: "https://github.com/xdxprotocol", name: "Github", icon: githubIcon },
  { link: "https://medium.com/@xdxexchange", name: "Medium", icon: mediumIcon },
];

type Props = { showRedirectModal?: (to: string) => void; redirectPopupTimestamp?: () => void };

export default function Footer({ showRedirectModal, redirectPopupTimestamp }: Props) {
  const isHome = isHomeSite();

  return (
    <div className="Footer">
      <div className={cx("Footer-wrapper", { home: isHome })}>
        <div className="Footer-text">
          <p>Audits · Bounties · Guides</p>
        </div>
        <div className="Footer-social-link-block">
          {socialLinks.map((platform) => {
            return (
              <a
                key={platform.name}
                className="App-social-link"
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={platform.icon} alt={platform.name} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
