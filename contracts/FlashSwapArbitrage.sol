// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function getReserves() external view returns (uint112, uint112, uint32);
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address);
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

struct FlashSwapRoute {
    address pair;
    address tokenBorrow;
    uint256 amountBorrow;
    address tokenIntermediate;
    address sellRouter;
    uint256 minProfit;
}

contract FlashSwapArbitrage is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public operator;
    bool public paused;

    address public constant UNISWAP_V2_FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address public constant SUSHISWAP_FACTORY = 0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac;

    event FlashSwapExecuted(
        address indexed tokenBorrow,
        uint256 amountBorrow,
        uint256 profit
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

    function initiateFlashSwap(
        address pair,
        address tokenBorrow,
        uint256 amountBorrow,
        bytes calldata callbackData
    ) external onlyOperator whenNotPaused nonReentrant {
        IUniswapV2Pair uniPair = IUniswapV2Pair(pair);
        address token0 = uniPair.token0();
        address token1 = uniPair.token1();

        uint256 amount0Out = tokenBorrow == token0 ? amountBorrow : 0;
        uint256 amount1Out = tokenBorrow == token1 ? amountBorrow : 0;

        uniPair.swap(amount0Out, amount1Out, address(this), callbackData);
    }

    function executeTriangularFlashSwap(
        address pair,
        uint256 amount0Out,
        uint256 amount1Out,
        address router2,
        address router3,
        address[] calldata path2,
        address[] calldata path3,
        uint256 minProfit
    ) external onlyOperator whenNotPaused nonReentrant {
        bytes memory data = abi.encode(
            msg.sender,
            router2,
            router3,
            path2,
            path3,
            minProfit,
            true
        );

        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), data);
    }

    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external {
        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();

        require(
            IUniswapV2Factory(UNISWAP_V2_FACTORY).getPair(token0, token1) == msg.sender ||
            IUniswapV2Factory(SUSHISWAP_FACTORY).getPair(token0, token1) == msg.sender,
            "Unauthorized pair"
        );

        (
            ,
            address router2,
            address router3,
            address[] memory path2,
            address[] memory path3,
            uint256 minProfit,
            bool isTriangular
        ) = abi.decode(data, (address, address, address, address[], address[], uint256, bool));

        address tokenBorrowed = amount0 > 0 ? token0 : token1;
        uint256 amountBorrowed = amount0 > 0 ? amount0 : amount1;

        if (isTriangular) {
            _executeTriangularArb(
                tokenBorrowed,
                amountBorrowed,
                router2,
                router3,
                path2,
                path3,
                minProfit
            );
        } else {
            _executeSimpleArb(tokenBorrowed, amountBorrowed, data);
        }

        uint256 fee = (amountBorrowed * 3) / 997 + 1;
        uint256 amountToRepay = amountBorrowed + fee;

        IERC20(tokenBorrowed).safeTransfer(msg.sender, amountToRepay);

        uint256 remaining = IERC20(tokenBorrowed).balanceOf(address(this));
        if (remaining > 0) {
            IERC20(tokenBorrowed).safeTransfer(owner, remaining);
        }

        emit FlashSwapExecuted(tokenBorrowed, amountBorrowed, remaining);
    }

    function _executeTriangularArb(
        address tokenBorrowed,
        uint256 amountBorrowed,
        address router2,
        address router3,
        address[] memory path2,
        address[] memory path3,
        uint256 minProfit
    ) internal {
        IERC20(tokenBorrowed).forceApprove(router2, amountBorrowed);

        uint[] memory amounts2 = IUniswapV2Router(router2).swapExactTokensForTokens(
            amountBorrowed,
            0,
            path2,
            address(this),
            block.timestamp + 120
        );

        uint256 intermediateAmount = amounts2[amounts2.length - 1];
        address intermediateToken = path2[path2.length - 1];

        IERC20(intermediateToken).forceApprove(router3, intermediateAmount);

        uint[] memory amounts3 = IUniswapV2Router(router3).swapExactTokensForTokens(
            intermediateAmount,
            0,
            path3,
            address(this),
            block.timestamp + 120
        );

        uint256 finalAmount = amounts3[amounts3.length - 1];
        require(finalAmount > amountBorrowed, "No profit");

        uint256 fee = (amountBorrowed * 3) / 997 + 1;
        require(finalAmount - amountBorrowed - fee >= minProfit, "Below min profit");
    }

    function _executeSimpleArb(
        address tokenBorrowed,
        uint256 amountBorrowed,
        bytes calldata data
    ) internal {
        (
            address sellRouter,
            address[] memory sellPath,
            uint256 minOut
        ) = abi.decode(data[32:], (address, address[], uint256));

        IERC20(tokenBorrowed).forceApprove(sellRouter, amountBorrowed);

        IUniswapV2Router(sellRouter).swapExactTokensForTokens(
            amountBorrowed,
            minOut,
            sellPath,
            address(this),
            block.timestamp + 120
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
