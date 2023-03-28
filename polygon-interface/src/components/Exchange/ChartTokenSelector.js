import React, { useState } from "react";
import { Menu } from "@headlessui/react";
import { FaChevronDown } from "react-icons/fa";
import cx from "classnames";
import "./ChartTokenSelector.css";
import { LONG, SHORT, SWAP } from "lib/legacy";
import { getTokens, getWhitelistedTokens } from "config/tokens";

import arrowDownIcon from "img/ic_convert_down.svg";
import arrowUpIcon from "img/ic_convert_up.svg";

export default function ChartTokenSelector(props) {
  const { chainId, selectedToken, onSelectToken, swapOption } = props;

  const isLong = swapOption === LONG;
  const isShort = swapOption === SHORT;
  const isSwap = swapOption === SWAP;
  let options = getTokens(chainId);
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const indexTokens = whitelistedTokens.filter((token) => !token.isStable && !token.isWrapped);
  const shortableTokens = indexTokens.filter((token) => token.isShortable);

  const [selector, setSelector] = useState(false);

  const chooseSelector = () => {
    setSelector(!selector);
  };

  if (isLong) {
    options = indexTokens;
  }
  if (isShort) {
    options = shortableTokens;
  }

  const onSelect = async (token) => {
    onSelectToken(token);
    chooseSelector(false);
  };

  var value = selectedToken;

  return (
    <Menu>
      <button className="tk-select-btn" onClick={chooseSelector}>
        <div className="tk-select-btn-info">
          <img src={value.imageUrl} alt="Icon" width="20px" />
          <span>{value.symbol}-USD</span>
        </div>
        <div>{selector ? <img src={arrowUpIcon} width="15px" /> : <img src={arrowDownIcon} width="15px" />}</div>
      </button>
      {selector && (
        <div>
          {options.map((option, index) => (
            <button
              type="button"
              className="tk-select-drop-btn"
              key={index}
              onClick={() => {
                onSelect(option);
              }}
            >
              <span className="tk-select-drop-btn-info">
                <img src={option.imageUrl} alt="Icon" width="20px" />
                {option.name}
                <span className="">{option.symbol}</span>
              </span>
              <div className="tk-select-drop-btn-price">
                <div className="">{option.minPrice}</div>
                <span className="">{option.maxPrice}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Menu>
  );
}
