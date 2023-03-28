// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../libraries/math/SafeMath.sol";
import "../libraries/token/IERC20.sol";

import "../core/interfaces/IXLXManager.sol";

import "./interfaces/IRewardTracker.sol";
import "./interfaces/IRewardTracker.sol";

// provide a way to transfer staked XLX tokens by unstaking from the sender
// and staking for the receiver
// tests in RewardRouterV2.js
contract StakedXLX {
    using SafeMath for uint256;

    string public constant name = "StakedXLX";
    string public constant symbol = "sXLX";
    uint8 public constant decimals = 18;

    address public xlx;
    IXLXManager public xlxManager;
    address public stakedXLXTracker;
    address public feeXLXTracker;

    mapping (address => mapping (address => uint256)) public allowances;

    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(
        address _xlx,
        IXLXManager _xlxManager,
        address _stakedXLXTracker,
        address _feeXLXTracker
    ) public {
        xlx = _xlx;
        xlxManager = _xlxManager;
        stakedXLXTracker = _stakedXLXTracker;
        feeXLXTracker = _feeXLXTracker;
    }

    function allowance(address _owner, address _spender) external view returns (uint256) {
        return allowances[_owner][_spender];
    }

    function approve(address _spender, uint256 _amount) external returns (bool) {
        _approve(msg.sender, _spender, _amount);
        return true;
    }

    function transfer(address _recipient, uint256 _amount) external returns (bool) {
        _transfer(msg.sender, _recipient, _amount);
        return true;
    }

    function transferFrom(address _sender, address _recipient, uint256 _amount) external returns (bool) {
        uint256 nextAllowance = allowances[_sender][msg.sender].sub(_amount, "StakedXLX: transfer amount exceeds allowance");
        _approve(_sender, msg.sender, nextAllowance);
        _transfer(_sender, _recipient, _amount);
        return true;
    }

    function balanceOf(address _account) external view returns (uint256) {
        return IRewardTracker(feeXLXTracker).depositBalances(_account, xlx);
    }

    function totalSupply() external view returns (uint256) {
        return IERC20(stakedXLXTracker).totalSupply();
    }

    function _approve(address _owner, address _spender, uint256 _amount) private {
        require(_owner != address(0), "StakedXLX: approve from the zero address");
        require(_spender != address(0), "StakedXLX: approve to the zero address");

        allowances[_owner][_spender] = _amount;

        emit Approval(_owner, _spender, _amount);
    }

    function _transfer(address _sender, address _recipient, uint256 _amount) private {
        require(_sender != address(0), "StakedXLX: transfer from the zero address");
        require(_recipient != address(0), "StakedXLX: transfer to the zero address");

        require(
            xlxManager.lastAddedAt(_sender).add(xlxManager.cooldownDuration()) <= block.timestamp,
            "StakedXLX: cooldown duration not yet passed"
        );

        IRewardTracker(stakedXLXTracker).unstakeForAccount(_sender, feeXLXTracker, _amount, _sender);
        IRewardTracker(feeXLXTracker).unstakeForAccount(_sender, xlx, _amount, _sender);

        IRewardTracker(feeXLXTracker).stakeForAccount(_sender, _recipient, xlx, _amount);
        IRewardTracker(stakedXLXTracker).stakeForAccount(_recipient, _recipient, feeXLXTracker, _amount);
    }
}
