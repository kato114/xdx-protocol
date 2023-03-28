import React from "react";
import { FiUsers } from "react-icons/fi";
import { GrLineChart } from "react-icons/gr";
import { AiOutlinePieChart, AiOutlineBank } from "react-icons/ai";
import { BsCoin } from "react-icons/bs";
import { TiDocumentText } from "react-icons/ti";

import { SidebarLink } from "./SidebarLink";
import "./Sidebar.css";
import ExternalLink from "components/ExternalLink/ExternalLink";

type Props = {
  small?: boolean;
  redirectPopupTimestamp: number;
  showRedirectModal: (to: string) => void;
};

export function Sidebar({
  small,
  redirectPopupTimestamp,
  showRedirectModal,
}: Props) {
  return (
    <div className="Sidebar">
      <div className="Sidebar-link">
        <SidebarLink
          to="/trade"
          redirectPopupTimestamp={redirectPopupTimestamp}
          showRedirectModal={showRedirectModal}
        >
          <GrLineChart/> <span>Trade </span>
        </SidebarLink>
      </div>
      <div className="Sidebar-link">
        <SidebarLink
          to="/dashboard"
          redirectPopupTimestamp={redirectPopupTimestamp}
          showRedirectModal={showRedirectModal}
        >
          <AiOutlinePieChart/> <span>Dashboard </span>
        </SidebarLink>
      </div>
      <div className="Sidebar-link">
        <SidebarLink to="/earn" redirectPopupTimestamp={redirectPopupTimestamp} showRedirectModal={showRedirectModal}>
          <BsCoin/> <span>Earn </span>
        </SidebarLink>
      </div>
      <div className="Sidebar-link">
        <SidebarLink to="/buy" redirectPopupTimestamp={redirectPopupTimestamp} showRedirectModal={showRedirectModal}>
          <AiOutlineBank/> <span>Buy </span>
        </SidebarLink>
      </div>
      <div className="Sidebar-link">
        <SidebarLink
          to="/referrals"
          redirectPopupTimestamp={redirectPopupTimestamp}
          showRedirectModal={showRedirectModal}
        >
          <FiUsers/> <span>Referrals </span>
        </SidebarLink>
      </div>
      <div className="Sidebar-link">
        <ExternalLink href="https://xdx.gitbook.io/xdx/">
          <TiDocumentText/> <span>Doc </span>
        </ExternalLink>
      </div>
    </div>
  );
}
