// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../libraries/math/SafeMath.sol";
import "../libraries/token/IERC20.sol";
import "../libraries/token/SafeERC20.sol";
import "../libraries/utils/ReentrancyGuard.sol";
import "../libraries/utils/Address.sol";

import "./interfaces/IRewardTracker.sol";
import "../tokens/interfaces/IMintable.sol";
import "../tokens/interfaces/IWETH.sol";
import "../core/interfaces/IXLXManager.sol";
import "../access/Governable.sol";

contract RewardRouter is ReentrancyGuard, Governable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using Address for address payable;

    bool public isInitialized;

    address public weth;

    address public xdx;
    address public esXDX;
    address public bnXDX;

    address public xlx; // XDX Liquidity Provider token

    address public stakedXDXTracker;
    address public bonusXDXTracker;
    address public feeXDXTracker;

    address public stakedXLXTracker;
    address public feeXLXTracker;

    address public xlxManager;

    event StakeXDX(address account, uint256 amount);
    event UnstakeXDX(address account, uint256 amount);

    event StakeXLX(address account, uint256 amount);
    event UnstakeXLX(address account, uint256 amount);

    receive() external payable {
        require(msg.sender == weth, "Router: invalid sender");
    }

    function initialize(
        address _weth,
        address _xdx,
        address _esXDX,
        address _bnXDX,
        address _xlx,
        address _stakedXDXTracker,
        address _bonusXDXTracker,
        address _feeXDXTracker,
        address _feeXLXTracker,
        address _stakedXLXTracker,
        address _xlxManager
    ) external onlyGov {
        require(!isInitialized, "RewardRouter: already initialized");
        isInitialized = true;

        weth = _weth;

        xdx = _xdx;
        esXDX = _esXDX;
        bnXDX = _bnXDX;

        xlx = _xlx;

        stakedXDXTracker = _stakedXDXTracker;
        bonusXDXTracker = _bonusXDXTracker;
        feeXDXTracker = _feeXDXTracker;

        feeXLXTracker = _feeXLXTracker;
        stakedXLXTracker = _stakedXLXTracker;

        xlxManager = _xlxManager;
    }

    // to help users who accidentally send their tokens to this contract
    function withdrawToken(address _token, address _account, uint256 _amount) external onlyGov {
        IERC20(_token).safeTransfer(_account, _amount);
    }

    function batchStakeXDXForAccount(address[] memory _accounts, uint256[] memory _amounts) external nonReentrant onlyGov {
        address _xdx = xdx;
        for (uint256 i = 0; i < _accounts.length; i++) {
            _stakeXDX(msg.sender, _accounts[i], _xdx, _amounts[i]);
        }
    }

    function stakeXDXForAccount(address _account, uint256 _amount) external nonReentrant onlyGov {
        _stakeXDX(msg.sender, _account, xdx, _amount);
    }

    function stakeXDX(uint256 _amount) external nonReentrant {
        _stakeXDX(msg.sender, msg.sender, xdx, _amount);
    }

    function stakeEsXDX(uint256 _amount) external nonReentrant {
        _stakeXDX(msg.sender, msg.sender, esXDX, _amount);
    }

    function unstakeXDX(uint256 _amount) external nonReentrant {
        _unstakeXDX(msg.sender, xdx, _amount);
    }

    function unstakeEsXDX(uint256 _amount) external nonReentrant {
        _unstakeXDX(msg.sender, esXDX, _amount);
    }

    function mintAndStakeXLX(address _token, uint256 _amount, uint256 _minUsdg, uint256 _minXLX) external nonReentrant returns (uint256) {
        require(_amount > 0, "RewardRouter: invalid _amount");

        address account = msg.sender;
        uint256 xlxAmount = IXLXManager(xlxManager).addLiquidityForAccount(account, account, _token, _amount, _minUsdg, _minXLX);
        IRewardTracker(feeXLXTracker).stakeForAccount(account, account, xlx, xlxAmount);
        IRewardTracker(stakedXLXTracker).stakeForAccount(account, account, feeXLXTracker, xlxAmount);

        emit StakeXLX(account, xlxAmount);

        return xlxAmount;
    }

    function mintAndStakeXLXETH(uint256 _minUsdg, uint256 _minXLX) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "RewardRouter: invalid msg.value");

        IWETH(weth).deposit{value: msg.value}();
        IERC20(weth).approve(xlxManager, msg.value);

        address account = msg.sender;
        uint256 xlxAmount = IXLXManager(xlxManager).addLiquidityForAccount(address(this), account, weth, msg.value, _minUsdg, _minXLX);

        IRewardTracker(feeXLXTracker).stakeForAccount(account, account, xlx, xlxAmount);
        IRewardTracker(stakedXLXTracker).stakeForAccount(account, account, feeXLXTracker, xlxAmount);

        emit StakeXLX(account, xlxAmount);

        return xlxAmount;
    }

    function unstakeAndRedeemXLX(address _tokenOut, uint256 _xlxAmount, uint256 _minOut, address _receiver) external nonReentrant returns (uint256) {
        require(_xlxAmount > 0, "RewardRouter: invalid _xlxAmount");

        address account = msg.sender;
        IRewardTracker(stakedXLXTracker).unstakeForAccount(account, feeXLXTracker, _xlxAmount, account);
        IRewardTracker(feeXLXTracker).unstakeForAccount(account, xlx, _xlxAmount, account);
        uint256 amountOut = IXLXManager(xlxManager).removeLiquidityForAccount(account, _tokenOut, _xlxAmount, _minOut, _receiver);

        emit UnstakeXLX(account, _xlxAmount);

        return amountOut;
    }

    function unstakeAndRedeemXLXETH(uint256 _xlxAmount, uint256 _minOut, address payable _receiver) external nonReentrant returns (uint256) {
        require(_xlxAmount > 0, "RewardRouter: invalid _xlxAmount");

        address account = msg.sender;
        IRewardTracker(stakedXLXTracker).unstakeForAccount(account, feeXLXTracker, _xlxAmount, account);
        IRewardTracker(feeXLXTracker).unstakeForAccount(account, xlx, _xlxAmount, account);
        uint256 amountOut = IXLXManager(xlxManager).removeLiquidityForAccount(account, weth, _xlxAmount, _minOut, address(this));

        IWETH(weth).withdraw(amountOut);

        _receiver.sendValue(amountOut);

        emit UnstakeXLX(account, _xlxAmount);

        return amountOut;
    }

    function claim() external nonReentrant {
        address account = msg.sender;

        IRewardTracker(feeXDXTracker).claimForAccount(account, account);
        IRewardTracker(feeXLXTracker).claimForAccount(account, account);

        IRewardTracker(stakedXDXTracker).claimForAccount(account, account);
        IRewardTracker(stakedXLXTracker).claimForAccount(account, account);
    }

    function claimEsXDX() external nonReentrant {
        address account = msg.sender;

        IRewardTracker(stakedXDXTracker).claimForAccount(account, account);
        IRewardTracker(stakedXLXTracker).claimForAccount(account, account);
    }

    function claimFees() external nonReentrant {
        address account = msg.sender;

        IRewardTracker(feeXDXTracker).claimForAccount(account, account);
        IRewardTracker(feeXLXTracker).claimForAccount(account, account);
    }

    function compound() external nonReentrant {
        _compound(msg.sender);
    }

    function compoundForAccount(address _account) external nonReentrant onlyGov {
        _compound(_account);
    }

    function batchCompoundForAccounts(address[] memory _accounts) external nonReentrant onlyGov {
        for (uint256 i = 0; i < _accounts.length; i++) {
            _compound(_accounts[i]);
        }
    }

    function _compound(address _account) private {
        _compoundXDX(_account);
        _compoundXLX(_account);
    }

    function _compoundXDX(address _account) private {
        uint256 esXDXAmount = IRewardTracker(stakedXDXTracker).claimForAccount(_account, _account);
        if (esXDXAmount > 0) {
            _stakeXDX(_account, _account, esXDX, esXDXAmount);
        }

        uint256 bnXDXAmount = IRewardTracker(bonusXDXTracker).claimForAccount(_account, _account);
        if (bnXDXAmount > 0) {
            IRewardTracker(feeXDXTracker).stakeForAccount(_account, _account, bnXDX, bnXDXAmount);
        }
    }

    function _compoundXLX(address _account) private {
        uint256 esXDXAmount = IRewardTracker(stakedXLXTracker).claimForAccount(_account, _account);
        if (esXDXAmount > 0) {
            _stakeXDX(_account, _account, esXDX, esXDXAmount);
        }
    }

    function _stakeXDX(address _fundingAccount, address _account, address _token, uint256 _amount) private {
        require(_amount > 0, "RewardRouter: invalid _amount");

        IRewardTracker(stakedXDXTracker).stakeForAccount(_fundingAccount, _account, _token, _amount);
        IRewardTracker(bonusXDXTracker).stakeForAccount(_account, _account, stakedXDXTracker, _amount);
        IRewardTracker(feeXDXTracker).stakeForAccount(_account, _account, bonusXDXTracker, _amount);

        emit StakeXDX(_account, _amount);
    }

    function _unstakeXDX(address _account, address _token, uint256 _amount) private {
        require(_amount > 0, "RewardRouter: invalid _amount");

        uint256 balance = IRewardTracker(stakedXDXTracker).stakedAmounts(_account);

        IRewardTracker(feeXDXTracker).unstakeForAccount(_account, bonusXDXTracker, _amount, _account);
        IRewardTracker(bonusXDXTracker).unstakeForAccount(_account, stakedXDXTracker, _amount, _account);
        IRewardTracker(stakedXDXTracker).unstakeForAccount(_account, _token, _amount, _account);

        uint256 bnXDXAmount = IRewardTracker(bonusXDXTracker).claimForAccount(_account, _account);
        if (bnXDXAmount > 0) {
            IRewardTracker(feeXDXTracker).stakeForAccount(_account, _account, bnXDX, bnXDXAmount);
        }

        uint256 stakedBnXDX = IRewardTracker(feeXDXTracker).depositBalances(_account, bnXDX);
        if (stakedBnXDX > 0) {
            uint256 reductionAmount = stakedBnXDX.mul(_amount).div(balance);
            IRewardTracker(feeXDXTracker).unstakeForAccount(_account, bnXDX, reductionAmount, _account);
            IMintable(bnXDX).burn(_account, reductionAmount);
        }

        emit UnstakeXDX(_account, _amount);
    }
}
