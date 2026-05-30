// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPoolAddressesProvider {
    function getPool() external view returns (address);
}

interface IPool {
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

interface IFlashLoanSimpleReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

abstract contract FlashLoanSimpleReceiverBase is IFlashLoanSimpleReceiver {
    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    IPool public immutable POOL;

    constructor(IPoolAddressesProvider provider) {
        ADDRESSES_PROVIDER = provider;
        POOL = IPool(provider.getPool());
    }
}

struct SwapParams {
    address router;
    address tokenIn;
    address tokenOut;
    uint256 amountIn;
    uint256 minAmountOut;
    bytes extraData;
}

struct ArbRoute {
    SwapParams[] swaps;
    address profitToken;
    uint256 minProfit;
}

contract FlashLoanArbitrage is FlashLoanSimpleReceiverBase, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public operator;
    bool public paused;

    event ArbitrageExecuted(
        address indexed token,
        uint256 loanAmount,
        uint256 profit,
        uint256 premium
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OperatorUpdated(address indexed operator);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator || msg.sender == owner, "Not operator");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    constructor(
        IPoolAddressesProvider _addressProvider
    ) FlashLoanSimpleReceiverBase(_addressProvider) {
        owner = msg.sender;
        operator = msg.sender;
    }

    function executeArbitrage(
        address asset,
        uint256 amount,
        ArbRoute calldata route
    ) external onlyOperator whenNotPaused nonReentrant {
        bytes memory params = abi.encode(route);
        POOL.flashLoanSimple(address(this), asset, amount, params, 0);
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Caller must be pool");
        require(initiator == address(this), "Initiator must be this contract");

        ArbRoute memory route = abi.decode(params, (ArbRoute));

        uint256 currentAmount = amount;

        for (uint256 i = 0; i < route.swaps.length; i++) {
            currentAmount = _executeSwap(route.swaps[i], currentAmount);
        }

        uint256 amountOwed = amount + premium;
        uint256 balance = IERC20(asset).balanceOf(address(this));
        require(balance >= amountOwed, "Insufficient balance to repay");

        uint256 profit = balance - amountOwed;
        require(profit >= route.minProfit, "Profit below minimum");

        IERC20(asset).forceApprove(address(POOL), amountOwed);

        if (profit > 0) {
            IERC20(asset).safeTransfer(owner, profit);
        }

        emit ArbitrageExecuted(asset, amount, profit, premium);

        return true;
    }

    function _executeSwap(
        SwapParams memory swap,
        uint256 amountIn
    ) internal returns (uint256) {
        IERC20(swap.tokenIn).forceApprove(swap.router, amountIn);

        uint256 balanceBefore = IERC20(swap.tokenOut).balanceOf(address(this));

        (bool success, ) = swap.router.call(swap.extraData);
        require(success, "Swap failed");

        uint256 balanceAfter = IERC20(swap.tokenOut).balanceOf(address(this));
        uint256 amountOut = balanceAfter - balanceBefore;

        require(amountOut >= swap.minAmountOut, "Slippage exceeded");

        return amountOut;
    }

    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
        emit OperatorUpdated(_operator);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner, amount);
    }

    function rescueETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
