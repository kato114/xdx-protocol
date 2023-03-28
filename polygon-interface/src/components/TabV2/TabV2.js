import React from "react";

import cx from "classnames";

import "./TabV2.css";

export default function TabV2(props) {
  const { options, option, setOption, onChange, type = "block", className, optionLabels, icons } = props;
  const onClick = (opt) => {
    if (setOption) {
      setOption(opt);
    }
    if (onChange) {
      onChange(opt);
    }
  };

  return (
    <div className={cx("TabV2", type, className)}>
      {options.map((opt) => {
        const label = optionLabels && optionLabels[opt] ? optionLabels[opt] : opt;
        return (
          <div
            className={cx("TabV2-option", "muted", { active: opt === option })}
            onClick={() => onClick(opt)}
            key={opt}
          >
            {icons && icons[opt] && <img className="TabV2-option-icon" src={icons[opt]} alt={option} />}
            {label}
          </div>
        );
      })}
    </div>
  );
}
