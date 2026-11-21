import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

async function main() {
  console.log("========================================================================");
  console.log("⚡ UPGRADING ELZORAMAIN & ROLLING OVER $39 UNDISTRIBUTED POOL TO WEEK #2");
  console.log("========================================================================");

  const { ethers } = await network.create({
    network: "bscMainnet",
  });

  const [deployer] = await ethers.getSigners();
  console.log("Operator / Deployer:", deployer.address);

  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log("Operator BNB Balance:", ethers.formatEther(bnbBalance), "BNB");

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("3", "gwei");
  console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // Step 1: Pre-check balances
  const preAbi = [
    "function weeklyPoolBalance(uint256) view returns (uint256)",
    "function getCurrentWeeklyEpoch() view returns (uint256)",
  ];
  const preContract = new ethers.Contract(PROXY_ADDRESS, preAbi, deployer);
  const curEpoch = await preContract.getCurrentWeeklyEpoch();
  const pool0Pre = await preContract.weeklyPoolBalance(0);
  const pool2Pre = await preContract.weeklyPoolBalance(2);
  console.log("\nCurrent Weekly Epoch:", curEpoch.toString());
  console.log("Pre-rollover Epoch 0 balance:", ethers.formatEther(pool0Pre), "USDT");
  console.log("Pre-rollover Epoch 2 balance:", ethers.formatEther(pool2Pre), "USDT");

  if (pool0Pre === 0n) {
    console.log("⚠️ Epoch 0 balance is already 0! Nothing to rollover.");
    return;
  }

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

  // Step 4: Execute Rollover from Epoch 0 to Epoch 2
  console.log("\n--- STEP 3: EXECUTING ROLLOVER OF $39 USDT (EPOCH 0 -> EPOCH 2) ---");
  const rolloverTx = await proxyAsMain.rolloverWeeklyPool(0, 2, { gasPrice });
  console.log("Rollover Tx sent:", rolloverTx.hash);
  await rolloverTx.wait();
  console.log("✅ Rollover executed successfully!");

  // Step 5: Verify Post-rollover Balances
  console.log("\n--- STEP 4: VERIFYING POST-ROLLOVER ON-CHAIN BALANCES ---");
  const pool0Post = await proxyAsMain.weeklyPoolBalance(0);
  const pool1Post = await proxyAsMain.weeklyPoolBalance(1);
  const pool2Post = await proxyAsMain.weeklyPoolBalance(2);

  console.log("Post-rollover Epoch 0 balance:", ethers.formatEther(pool0Post), "USDT");
  console.log("Post-rollover Epoch 1 balance:", ethers.formatEther(pool1Post), "USDT");
  console.log("Post-rollover Epoch 2 balance:", ethers.formatEther(pool2Post), "USDT");

  console.log("\n🎉 ALL TASKS COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("❌ Execution failed:", err);
  process.exit(1);
});
