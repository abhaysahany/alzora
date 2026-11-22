import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

async function main() {
  console.log("========================================================================");
  console.log("⚡ DISTRIBUTING $39 UNDISTRIBUTED WEEKLY TO DEFAULT QUALIFIERS (IDs 1, 2, 3)");
  console.log("========================================================================");

  const { ethers } = await network.create({
    network: "bscMainnet",
  });

  const [deployer] = await ethers.getSigners();
  console.log("Operator / Deployer:", deployer.address);

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("3", "gwei");
  console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // Step 1: Pre-check balances of Default Qualifiers
  const erc20Abi = ["function balanceOf(address) view returns (uint256)"];
  const usdtContract = new ethers.Contract(USDT_ADDRESS, erc20Abi, ethers.provider);

  const proxyAbi = [
    "function weeklyPoolBalance(uint256) view returns (uint256)",
    "function globalMatrixUsers(uint256) view returns (address)",
    "function pendingIncomeDeduction(address) view returns (uint256)",
    "function getIncomeBreakdown(address) view returns (tuple(uint256 directIncome, uint256 affiliateIncome, uint256 clubIncome, uint256 matchingIncome, uint256 championIncome, uint256 weeklyIncome, uint256 lifetimeIncome, uint256 globalClubIncome))",
  ];
  const proxyRead = new ethers.Contract(PROXY_ADDRESS, proxyAbi, ethers.provider);

  const u1 = await proxyRead.globalMatrixUsers(1);
  const u2 = await proxyRead.globalMatrixUsers(2);
  const u3 = await proxyRead.globalMatrixUsers(3);

  console.log("\nDefault Qualifiers:");
  console.log("ID 1:", u1, "| USDT:", ethers.formatUnits(await usdtContract.balanceOf(u1), 18));
  console.log("ID 2:", u2, "| USDT:", ethers.formatUnits(await usdtContract.balanceOf(u2), 18), "| Ded:", ethers.formatUnits(await proxyRead.pendingIncomeDeduction(u2), 18));
  console.log("ID 3:", u3, "| USDT:", ethers.formatUnits(await usdtContract.balanceOf(u3), 18));

  const pool2Pre = await proxyRead.weeklyPoolBalance(2);
  console.log("\nEpoch 2 Balance to Distribute:", ethers.formatUnits(pool2Pre, 18), "USDT");

  // Step 2: Deploy new Implementation
  console.log("\n--- STEP 1: DEPLOYING NEW ELZORAMAIN IMPLEMENTATION ---");
  const ElzoraMainFactory = await ethers.getContractFactory("ElzoraMain");
  const newImpl = await ElzoraMainFactory.deploy({ gasPrice });
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  console.log("✅ New Implementation deployed at:", newImplAddress);

  // Step 3: Upgrade Proxy
  console.log("\n--- STEP 2: UPGRADING UUPS PROXY ---");
  const proxyAsMain = ElzoraMainFactory.attach(PROXY_ADDRESS) as any;
  const upgradeTx = await proxyAsMain.upgradeToAndCall(newImplAddress, "0x", { gasPrice });
  console.log("Upgrade Tx sent:", upgradeTx.hash);
  await upgradeTx.wait();
  console.log("✅ UUPS Proxy successfully upgraded to new implementation!");

  // Step 4: Execute Distribution of $39 to Default Qualifiers
  console.log("\n--- STEP 3: EXECUTING DISTRIBUTION OF $39 USDT TO DEFAULT QUALIFIERS ---");
  const distTx = await proxyAsMain.distributeUndistributedWeeklyToDefaultQualifiers(2, { gasPrice });
  console.log("Distribution Tx sent:", distTx.hash);
  await distTx.wait();
  console.log("✅ Distribution executed successfully!");

  // Step 5: Verify Post-distribution State
  console.log("\n--- STEP 4: VERIFYING POST-DISTRIBUTION STATE ---");
  const pool2Post = await proxyAsMain.weeklyPoolBalance(2);
  console.log("Post-distribution Epoch 2 Balance:", ethers.formatUnits(pool2Post, 18), "USDT");

  console.log("\nUpdated Balances & Deductions:");
  console.log("ID 1:", u1, "| USDT:", ethers.formatUnits(await usdtContract.balanceOf(u1), 18), "| Weekly Earned:", ethers.formatUnits((await proxyRead.getIncomeBreakdown(u1)).weeklyIncome, 18));
  console.log("ID 2:", u2, "| USDT:", ethers.formatUnits(await usdtContract.balanceOf(u2), 18), "| Remaining Ded:", ethers.formatUnits(await proxyRead.pendingIncomeDeduction(u2), 18));
  console.log("ID 3:", u3, "| USDT:", ethers.formatUnits(await usdtContract.balanceOf(u3), 18), "| Weekly Earned:", ethers.formatUnits((await proxyRead.getIncomeBreakdown(u3)).weeklyIncome, 18));

  console.log("\n🎉 ALL $39 USDT DISTRIBUTED SUCCESSFULLY TODAY TO DEFAULT QUALIFIERS!");
}

main().catch((err) => {
  console.error("❌ Execution failed:", err);
  process.exit(1);
});
