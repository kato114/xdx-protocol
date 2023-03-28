// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../libraries/math/SafeMath.sol";
import "../libraries/token/IERC20.sol";
import "../libraries/token/SafeERC20.sol";
import "../libraries/utils/ReentrancyGuard.sol";
import "../libraries/utils/Address.sol";

import "./interfaces/IRewardTracker.sol";
import "./interfaces/IVester.sol";
import "../tokens/interfaces/IMintable.sol";
import "../tokens/interfaces/IWETH.sol";
import "../core/interfaces/IXLXManager.sol";
import "../access/Governable.sol";

contract RewardRouterV2 is ReentrancyGuard, Governable {
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

    address public xdxVester;
    address public xlxVester;

    mapping (address => address) public pendingReceivers;

    event StakeXDX(address account, address token, uint256 amount);
    event UnstakeXDX(address account, address token, uint256 amount);

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
        address _xlxManager,
        address _xdxVester,
        address _xlxVester
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

        xdxVester = _xdxVester;
        xlxVester = _xlxVester;
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
        _unstakeXDX(msg.sender, xdx, _amount, true);
    }

    function unstakeEsXDX(uint256 _amount) external nonReentrant {
        _unstakeXDX(msg.sender, esXDX, _amount, true);
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

    function handleRewards(
        bool _shouldClaimXDX,
        bool _shouldStakeXDX,
        bool _shouldClaimEsXDX,
        bool _shouldStakeEsXDX,
        bool _shouldStakeMultiplierPoints,
        bool _shouldClaimWeth,
        bool _shouldConvertWethToEth
    ) external nonReentrant {
        address account = msg.sender;

        uint256 xdxAmount = 0;
        if (_shouldClaimXDX) {
            uint256 xdxAmount0 = IVester(xdxVester).claimForAccount(account, account);
            uint256 xdxAmount1 = IVester(xlxVester).claimForAccount(account, account);
            xdxAmount = xdxAmount0.add(xdxAmount1);
        }

        if (_shouldStakeXDX && xdxAmount > 0) {
            _stakeXDX(account, account, xdx, xdxAmount);
        }

        uint256 esXDXAmount = 0;
        if (_shouldClaimEsXDX) {
            uint256 esXDXAmount0 = IRewardTracker(stakedXDXTracker).claimForAccount(account, account);
            uint256 esXDXAmount1 = IRewardTracker(stakedXLXTracker).claimForAccount(account, account);
            esXDXAmount = esXDXAmount0.add(esXDXAmount1);
        }

        if (_shouldStakeEsXDX && esXDXAmount > 0) {
            _stakeXDX(account, account, esXDX, esXDXAmount);
        }

        if (_shouldStakeMultiplierPoints) {
            uint256 bnXDXAmount = IRewardTracker(bonusXDXTracker).claimForAccount(account, account);
            if (bnXDXAmount > 0) {
                IRewardTracker(feeXDXTracker).stakeForAccount(account, account, bnXDX, bnXDXAmount);
            }
        }

        if (_shouldClaimWeth) {
            if (_shouldConvertWethToEth) {
                uint256 weth0 = IRewardTracker(feeXDXTracker).claimForAccount(account, address(this));
                uint256 weth1 = IRewardTracker(feeXLXTracker).claimForAccount(account, address(this));

                uint256 wethAmount = weth0.add(weth1);
                IWETH(weth).withdraw(wethAmount);

                payable(account).sendValue(wethAmount);
            } else {
                IRewardTracker(feeXDXTracker).claimForAccount(account, account);
                IRewardTracker(feeXLXTracker).claimForAccount(account, account);
            }
        }
    }

    function batchCompoundForAccounts(address[] memory _accounts) external nonReentrant onlyGov {
        for (uint256 i = 0; i < _accounts.length; i++) {
            _compound(_accounts[i]);
        }
    }

    function signalTransfer(address _receiver) external nonReentrant {
        require(IERC20(xdxVester).balanceOf(msg.sender) == 0, "RewardRouter: sender has vested tokens");
        require(IERC20(xlxVester).balanceOf(msg.sender) == 0, "RewardRouter: sender has vested tokens");

        _validateReceiver(_receiver);
        pendingReceivers[msg.sender] = _receiver;
    }

    function acceptTransfer(address _sender) external nonReentrant {
        require(IERC20(xdxVester).balanceOf(_sender) == 0, "RewardRouter: sender has vested tokens");
        require(IERC20(xlxVester).balanceOf(_sender) == 0, "RewardRouter: sender has vested tokens");

        address receiver = msg.sender;
        require(pendingReceivers[_sender] == receiver, "RewardRouter: transfer not signalled");
        delete pendingReceivers[_sender];

        _validateReceiver(receiver);
        _compound(_sender);

        uint256 stakedXDX = IRewardTracker(stakedXDXTracker).depositBalances(_sender, xdx);
        if (stakedXDX > 0) {
            _unstakeXDX(_sender, xdx, stakedXDX, false);
            _stakeXDX(_sender, receiver, xdx, stakedXDX);
        }

        uint256 stakedEsXDX = IRewardTracker(stakedXDXTracker).depositBalances(_sender, esXDX);
        if (stakedEsXDX > 0) {
            _unstakeXDX(_sender, esXDX, stakedEsXDX, false);
            _stakeXDX(_sender, receiver, esXDX, stakedEsXDX);
        }

        uint256 stakedBnXDX = IRewardTracker(feeXDXTracker).depositBalances(_sender, bnXDX);
        if (stakedBnXDX > 0) {
            IRewardTracker(feeXDXTracker).unstakeForAccount(_sender, bnXDX, stakedBnXDX, _sender);
            IRewardTracker(feeXDXTracker).stakeForAccount(_sender, receiver, bnXDX, stakedBnXDX);
        }

        uint256 esXDXBalance = IERC20(esXDX).balanceOf(_sender);
        if (esXDXBalance > 0) {
            IERC20(esXDX).transferFrom(_sender, receiver, esXDXBalance);
        }

        uint256 xlxAmount = IRewardTracker(feeXLXTracker).depositBalances(_sender, xlx);
        if (xlxAmount > 0) {
            IRewardTracker(stakedXLXTracker).unstakeForAccount(_sender, feeXLXTracker, xlxAmount, _sender);
            IRewardTracker(feeXLXTracker).unstakeForAccount(_sender, xlx, xlxAmount, _sender);

            IRewardTracker(feeXLXTracker).stakeForAccount(_sender, receiver, xlx, xlxAmount);
            IRewardTracker(stakedXLXTracker).stakeForAccount(receiver, receiver, feeXLXTracker, xlxAmount);
        }

        IVester(xdxVester).transferStakeValues(_sender, receiver);
        IVester(xlxVester).transferStakeValues(_sender, receiver);
    }

    function _validateReceiver(address _receiver) private view {
        require(IRewardTracker(stakedXDXTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: stakedXDXTracker.averageStakedAmounts > 0");
        require(IRewardTracker(stakedXDXTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: stakedXDXTracker.cumulativeRewards > 0");

        require(IRewardTracker(bonusXDXTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: bonusXDXTracker.averageStakedAmounts > 0");
        require(IRewardTracker(bonusXDXTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: bonusXDXTracker.cumulativeRewards > 0");

        require(IRewardTracker(feeXDXTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: feeXDXTracker.averageStakedAmounts > 0");
        require(IRewardTracker(feeXDXTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: feeXDXTracker.cumulativeRewards > 0");

        require(IVester(xdxVester).transferredAverageStakedAmounts(_receiver) == 0, "RewardRouter: xdxVester.transferredAverageStakedAmounts > 0");
        require(IVester(xdxVester).transferredCumulativeRewards(_receiver) == 0, "RewardRouter: xdxVester.transferredCumulativeRewards > 0");

        require(IRewardTracker(stakedXLXTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: stakedXLXTracker.averageStakedAmounts > 0");
        require(IRewardTracker(stakedXLXTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: stakedXLXTracker.cumulativeRewards > 0");

        require(IRewardTracker(feeXLXTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: feeXLXTracker.averageStakedAmounts > 0");
        require(IRewardTracker(feeXLXTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: feeXLXTracker.cumulativeRewards > 0");

        require(IVester(xlxVester).transferredAverageStakedAmounts(_receiver) == 0, "RewardRouter: xdxVester.transferredAverageStakedAmounts > 0");
        require(IVester(xlxVester).transferredCumulativeRewards(_receiver) == 0, "RewardRouter: xdxVester.transferredCumulativeRewards > 0");

        require(IERC20(xdxVester).balanceOf(_receiver) == 0, "RewardRouter: xdxVester.balance > 0");
        require(IERC20(xlxVester).balanceOf(_receiver) == 0, "RewardRouter: xlxVester.balance > 0");
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

        emit StakeXDX(_account, _token, _amount);
    }

    function _unstakeXDX(address _account, address _token, uint256 _amount, bool _shouldReduceBnXDX) private {
        require(_amount > 0, "RewardRouter: invalid _amount");

        uint256 balance = IRewardTracker(stakedXDXTracker).stakedAmounts(_account);

        IRewardTracker(feeXDXTracker).unstakeForAccount(_account, bonusXDXTracker, _amount, _account);
        IRewardTracker(bonusXDXTracker).unstakeForAccount(_account, stakedXDXTracker, _amount, _account);
        IRewardTracker(stakedXDXTracker).unstakeForAccount(_account, _token, _amount, _account);

        if (_shouldReduceBnXDX) {
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
        }

        emit UnstakeXDX(_account, _token, _amount);
    }
}
