// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../libraries/token/IERC20.sol";
import "../libraries/math/SafeMath.sol";

import "./interfaces/IXDXIou.sol";

contract XDXIou is IERC20, IXDXIou {
    using SafeMath for uint256;

    mapping (address => uint256) private _balances;
    uint256 public override totalSupply;

    string public name;
    string public symbol;
    uint8 public decimals;

    address public minter;

    constructor (address _minter, string memory _name, string memory _symbol) public {
        name = _name;
        symbol = _symbol;
        minter = _minter;
        decimals = 18;
    }

    function mint(address account, uint256 amount) public override returns (bool) {
        require(msg.sender == minter, "XDXIou: forbidden");
        _mint(account, amount);
        return true;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    // empty implementation, XDXIou tokens are non-transferrable
    function transfer(address /* recipient */, uint256 /* amount */) public override returns (bool) {
        revert("XDXIou: non-transferrable");
    }

    // empty implementation, XDXIou tokens are non-transferrable
    function allowance(address /* owner */, address /* spender */) public view virtual override returns (uint256) {
        return 0;
    }

    // empty implementation, XDXIou tokens are non-transferrable
    function approve(address /* spender */, uint256 /* amount */) public virtual override returns (bool) {
        revert("XDXIou: non-transferrable");
    }

    // empty implementation, XDXIou tokens are non-transferrable
    function transferFrom(address /* sender */, address /* recipient */, uint256 /* amount */) public virtual override returns (bool) {
        revert("XDXIou: non-transferrable");
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "XDXIou: mint to the zero address");

        totalSupply = totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }
}
