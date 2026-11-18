import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
const ID2_WALLET = "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6";

async function main() {
  console.log("========================================================================");
  console.log("⚡ RESETTING ID #2 MILESTONE STATE & UPGRADING IMPLEMENTATION");
  console.log("========================================================================");

  const { ethers } = await network.create({
    network: "bscMainnet",
  });

  const [deployer] = await ethers.getSigners();
  console.log("Operator / Deployer:", deployer.address);

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("3", "gwei");
  console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // Step 1: Deploy new Implementation
  console.log("\n--- STEP 1: DEPLOYING NEW ELZORAMAIN IMPLEMENTATION ---");
  const ElzoraMainFactory = await ethers.getContractFactory("ElzoraMain");
  const newImpl = await ElzoraMainFactory.deploy({ gasPrice });
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  console.log("✅ New Implementation deployed at:", newImplAddress);

  // Step 2: Upgrade Proxy
  console.log("\n--- STEP 2: UPGRADING UUPS PROXY ---");
  const proxyAsMain = ElzoraMainFactory.attach(PROXY_ADDRESS) as any;
  const upgradeTx = await proxyAsMain.upgradeToAndCall(newImplAddress, "0x", { gasPrice });
  console.log("Upgrade Tx sent:", upgradeTx.hash);
  await upgradeTx.wait();
  console.log("✅ UUPS Proxy successfully upgraded to new implementation!");

  // Step 3: Reset ID #2 Milestone State
  console.log("\n--- STEP 3: RESETTING ID #2 MILESTONE STATE TO 0 ---");
  const resetTx = await proxyAsMain.setMemberMilestoneState(ID2_WALLET, 0, 0, false, { gasPrice });
  console.log("Reset Milestone Tx sent:", resetTx.hash);
  await resetTx.wait();
  console.log("✅ ID #2 Milestone 0 claim status and completed count reset to 0!");

  // Step 4: Verify Final State
  console.log("\n--- STEP 4: VERIFYING ID #2 ON-CHAIN STATE ---");
  const u = await proxyAsMain.getUser(ID2_WALLET);
  const claimed0 = await proxyAsMain.hasClaimedMilestone(ID2_WALLET, 0);
  const ded = await proxyAsMain.pendingIncomeDeduction(ID2_WALLET);

  console.log("Completed Lifetime Milestones:", u.completedLifetimeMilestones.toString());
  console.log("Milestone 0 Claimed Status:   ", claimed0);
  console.log("Pending Deduction Balance:    ", ethers.formatUnits(ded, 18), "USDT");

  console.log("\n🎉 ALL TASKS COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
