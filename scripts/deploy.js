const hre = require("hardhat");

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Crypto Arbitrage Pro - Deploy Script");
  console.log("=".repeat(60) + "\n");

  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📍 الشبكة:", hre.network.name);
  console.log("👤 الناشر:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 الرصيد:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.error("❌ لا يوجد رصيد كافي للنشر!");
    console.error("💡 احصل على ETH من faucet:");
    console.error("   https://faucet.quicknode.com/arbitrum/sepolia");
    process.exit(1);
  }

  const contracts = {};

  // 1. Deploy FlashLoanArbitrage
  console.log("📦 [1/4] نشر FlashLoanArbitrage...");
  try {
    const AAVE_POOL_PROVIDER = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"; // Arbitrum
    const FlashLoan = await hre.ethers.getContractFactory("FlashLoanArbitrage");
    const flashLoan = await FlashLoan.deploy(AAVE_POOL_PROVIDER);
    await flashLoan.waitForDeployment();
    contracts.FlashLoanArbitrage = await flashLoan.getAddress();
    console.log("✅ FlashLoanArbitrage:", contracts.FlashLoanArbitrage);
  } catch (error) {
    console.error("❌ خطأ في نشر FlashLoanArbitrage:", error.message);
    process.exit(1);
  }

  // 2. Deploy FlashSwapArbitrage
  console.log("\n📦 [2/4] نشر FlashSwapArbitrage...");
  try {
    const FlashSwap = await hre.ethers.getContractFactory("FlashSwapArbitrage");
    const flashSwap = await FlashSwap.deploy();
    await flashSwap.waitForDeployment();
    contracts.FlashSwapArbitrage = await flashSwap.getAddress();
    console.log("✅ FlashSwapArbitrage:", contracts.FlashSwapArbitrage);
  } catch (error) {
    console.error("❌ خطأ في نشر FlashSwapArbitrage:", error.message);
    process.exit(1);
  }

  // 3. Deploy FlashMintArbitrage
  console.log("\n📦 [3/4] نشر FlashMintArbitrage...");
  try {
    const FlashMint = await hre.ethers.getContractFactory("FlashMintArbitrage");
    const flashMint = await FlashMint.deploy();
    await flashMint.waitForDeployment();
    contracts.FlashMintArbitrage = await flashMint.getAddress();
    console.log("✅ FlashMintArbitrage:", contracts.FlashMintArbitrage);
  } catch (error) {
    console.error("❌ خطأ في نشر FlashMintArbitrage:", error.message);
    process.exit(1);
  }

  // 4. Deploy MultiHopRouter
  console.log("\n📦 [4/4] نشر MultiHopRouter...");
  try {
    const MultiHop = await hre.ethers.getContractFactory("MultiHopRouter");
    const multiHop = await MultiHop.deploy();
    await multiHop.waitForDeployment();
    contracts.MultiHopRouter = await multiHop.getAddress();
    console.log("✅ MultiHopRouter:", contracts.MultiHopRouter);
  } catch (error) {
    console.error("❌ خطأ في نشر MultiHopRouter:", error.message);
    process.exit(1);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 تم نشر جميع العقود بنجاح!");
  console.log("=".repeat(60));
  
  console.log("\n📋 ملخص العقود:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  console.log("\n📝 الخطوات التالية:");
  console.log("1. انسخ العناوين إلى ملف .env:");
  console.log(`   FLASH_LOAN_CONTRACT=${contracts.FlashLoanArbitrage}`);
  console.log(`   FLASH_SWAP_CONTRACT=${contracts.FlashSwapArbitrage}`);
  console.log(`   FLASH_MINT_CONTRACT=${contracts.FlashMintArbitrage}`);
  console.log(`   MULTI_HOP_ROUTER=${contracts.MultiHopRouter}`);
  
  console.log("\n2. اختبر العقود:");
  console.log("   npx hardhat test");
  
  console.log("\n3. تحقق من العقود على Arbiscan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contracts.FlashLoanArbitrage} "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb"`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contracts.FlashSwapArbitrage}`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contracts.FlashMintArbitrage}`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contracts.MultiHopRouter}`);

  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ خطأ:", error);
    process.exit(1);
  });
