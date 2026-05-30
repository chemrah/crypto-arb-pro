// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUniswapV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external payable returns (uint256 amountOut);

    function exactInput(ExactInputParams calldata params)
        external payable returns (uint256 amountOut);
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

struct MultiHopStep {
    uint8 dexType;
    address router;
    bytes swapData;
    address tokenIn;
    address tokenOut;
    uint256 minAmountOut;
}

contract MultiHopRouter {
    using SafeERC20 for IERC20;

    address public owner;

    uint8 public constant DEX_UNISWAP_V2 = 0;
    uint8 public constant DEX_UNISWAP_V3 = 1;
    uint8 public constant DEX_SUSHISWAP = 2;
    uint8 public constant DEX_CURVE = 3;
    uint8 public constant DEX_BALANCER = 4;
    uint8 public constant DEX_CAMELOT = 5;

    event MultiHopExecuted(
        address indexed initiator,
        uint256 amountIn,
        uint256 amountOut,
        uint8 steps
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function executeMultiHop(
        uint256 initialAmount,
        MultiHopStep[] calldata steps
    ) external returns (uint256) {
        uint256 currentAmount = initialAmount;

        for (uint256 i = 0; i < steps.length; i++) {
            currentAmount = _executeStep(steps[i], currentAmount);
        }

        emit MultiHopExecuted(msg.sender, initialAmount, currentAmount, uint8(steps.length));

        return currentAmount;
    }

    function _executeStep(
        MultiHopStep calldata step,
        uint256 amountIn
    ) internal returns (uint256) {
        IERC20(step.tokenIn).forceApprove(step.router, amountIn);

        uint256 balanceBefore = IERC20(step.tokenOut).balanceOf(address(this));

        if (step.dexType == DEX_UNISWAP_V3) {
            _executeV3Swap(step.router, step.swapData, amountIn);
        } else if (step.dexType == DEX_UNISWAP_V2 || step.dexType == DEX_SUSHISWAP || step.dexType == DEX_CAMELOT) {
            _executeV2Swap(step.router, step.swapData, amountIn);
        } else if (step.dexType == DEX_CURVE) {
            _executeCurveSwap(step.router, step.swapData, amountIn);
        } else if (step.dexType == DEX_BALANCER) {
            _executeBalancerSwap(step.router, step.swapData, amountIn);
        } else {
            revert("Unknown DEX type");
        }

        uint256 balanceAfter = IERC20(step.tokenOut).balanceOf(address(this));
        uint256 amountOut = balanceAfter - balanceBefore;

        require(amountOut >= step.minAmountOut, "Slippage exceeded");

        return amountOut;
    }

    function _executeV3Swap(
        address router,
        bytes calldata swapData,
        uint256 amountIn
    ) internal {
        (
            address tokenIn,
            address tokenOut,
            uint24 fee,
            uint256 amountOutMin
        ) = abi.decode(swapData, (address, address, uint24, uint256));

        IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: address(this),
                deadline: block.timestamp + 120,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });

        IUniswapV3Router(router).exactInputSingle(params);
    }

    function _executeV2Swap(
        address router,
        bytes calldata swapData,
        uint256 amountIn
    ) internal {
        (address[] memory path, uint256 amountOutMin) = abi.decode(
            swapData,
            (address[], uint256)
        );

        IUniswapV2Router(router).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 120
        );
    }

    function _executeCurveSwap(
        address router,
        bytes calldata swapData,
        uint256 amountIn
    ) internal {
        (int128 i, int128 j, uint256 minDy) = abi.decode(
            swapData,
            (int128, int128, uint256)
        );

        (bool success, ) = router.call(
            abi.encodeWithSignature(
                "exchange(int128,int128,uint256,uint256)",
                i,
                j,
                amountIn,
                minDy
            )
        );
        require(success, "Curve swap failed");
    }

    function _executeBalancerSwap(
        address router,
        bytes calldata swapData,
        uint256 amountIn
    ) internal {
        (bool success, ) = router.call(swapData);
        require(success, "Balancer swap failed");
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner, amount);
    }

    function rescueETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
