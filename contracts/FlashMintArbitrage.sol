// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IDaiFlashMint {
    function flashLoan(
        address receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external;
}

interface IDai {
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
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

interface ICurvePool {
    function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external returns (uint256);
}

struct FlashMintRoute {
    address[] routers;
    address[][] paths;
    uint256[] minAmountsOut;
    uint256 minProfit;
}

contract FlashMintArbitrage is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public operator;
    bool public paused;

    address public constant DAI_FLASH_MINT_MODULE = 0x60744434d6339a6B27d73d9Eda62b6F66a0a04FA;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    address public constant CURVE_3POOL = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;

    uint256 public constant MAX_FLASH_MINT = 500_000_000e18;

    event FlashMintExecuted(
        uint256 amountMinted,
        uint256 profit,
        address profitToken
    );

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

    constructor() {
        owner = msg.sender;
        operator = msg.sender;
    }

    function executeFlashMintArb(
        uint256 amount,
        FlashMintRoute calldata route
    ) external onlyOperator whenNotPaused nonReentrant {
        require(amount <= MAX_FLASH_MINT, "Exceeds max flash mint");

        bytes memory data = abi.encode(route, msg.sender);

        IDaiFlashMint(DAI_FLASH_MINT_MODULE).flashLoan(
            address(this),
            DAI,
            amount,
            data
        );
    }

    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32) {
        require(msg.sender == DAI_FLASH_MINT_MODULE, "Unauthorized caller");
        require(initiator == address(this), "Unauthorized initiator");
        require(token == DAI, "Wrong token");

        (FlashMintRoute memory route, ) = abi.decode(data, (FlashMintRoute, address));

        uint256 currentAmount = amount;

        for (uint256 i = 0; i < route.routers.length; i++) {
            currentAmount = _executeSwap(
                route.routers[i],
                route.paths[i],
                currentAmount,
                route.minAmountsOut[i]
            );
        }

        uint256 amountToRepay = amount + fee;
        address finalToken = route.paths[route.paths.length - 1][route.paths[route.paths.length - 1].length - 1];

        if (finalToken != DAI) {
            currentAmount = _swapToDai(finalToken, currentAmount, amountToRepay);
        }

        uint256 daiBalance = IDai(DAI).balanceOf(address(this));
        require(daiBalance >= amountToRepay, "Cannot repay flash mint");

        uint256 profit = daiBalance - amountToRepay;
        require(profit >= route.minProfit, "Below min profit");

        IDai(DAI).approve(DAI_FLASH_MINT_MODULE, amountToRepay);

        if (profit > 0) {
            IERC20(DAI).safeTransfer(owner, profit);
        }

        emit FlashMintExecuted(amount, profit, DAI);

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }

    function _executeSwap(
        address router,
        address[] memory path,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256) {
        address tokenIn = path[0];
        IERC20(tokenIn).forceApprove(router, amountIn);

        uint[] memory amounts = IUniswapV2Router(router).swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            address(this),
            block.timestamp + 120
        );

        return amounts[amounts.length - 1];
    }

    function _swapToDai(
        address fromToken,
        uint256 amount,
        uint256 minDai
    ) internal returns (uint256) {
        IERC20(fromToken).forceApprove(CURVE_3POOL, amount);

        int128 fromIndex;
        if (fromToken == USDC) {
            fromIndex = 1;
        } else if (fromToken == USDT) {
            fromIndex = 2;
        } else {
            revert("Unsupported token");
        }

        uint256 daiReceived = ICurvePool(CURVE_3POOL).exchange(
            fromIndex,
            0,
            amount,
            minDai
        );

        return daiReceived;
    }

    function executeMultiPathFlashMint(
        uint256 amount,
        address[] calldata routers,
        address[][] calldata paths,
        uint256[] calldata minAmountsOut,
        uint256 minProfit
    ) external onlyOperator whenNotPaused nonReentrant {
        FlashMintRoute memory route = FlashMintRoute({
            routers: routers,
            paths: paths,
            minAmountsOut: minAmountsOut,
            minProfit: minProfit
        });

        bytes memory data = abi.encode(route, msg.sender);

        IDaiFlashMint(DAI_FLASH_MINT_MODULE).flashLoan(
            address(this),
            DAI,
            amount,
            data
        );
    }

    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner, amount);
    }

    function rescueETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
