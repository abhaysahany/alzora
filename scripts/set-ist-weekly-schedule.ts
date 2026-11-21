import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
// Base Sunday 00:00:00 IST (8 Nov 2026):
// Ensures all weekly epochs close on Saturday 23:59:59 IST (Midnight)
// and new weeks start on Sunday 00:00:00 IST!
const IST_SUNDAY_BASE_UNIX = 1794076200n;

async function main() {
  console.log("=========================================================================");
  console.log("Aligning Smart Contract Weekly Epochs to Indian Standard Time (IST)");
  console.log("Cycle: Saturday 11:59:59 PM IST Close -> Sunday 00:00:00 AM IST Start");
  console.log("=========================================================================");

  const { ethers } = await network.create({
    network: "bscMainnet",
  });

  const [signer] = await ethers.getSigners();
  console.log("Operator / Owner Wallet:", signer.address);

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("3", "gwei");

  const ElzoraMainFactory = await ethers.getContractFactory("ElzoraMain");
  const contract = ElzoraMainFactory.attach(PROXY_ADDRESS) as any;

  const oldStartTime = await contract.systemStartTime();
  const oldEpoch = await contract.getCurrentWeeklyEpoch();
  console.log("\nBefore Update:");
  console.log("systemStartTime:     ", oldStartTime.toString());
  console.log("Current Weekly Epoch:", oldEpoch.toString());

  console.log(`\nExecuting setSystemStartTime(${IST_SUNDAY_BASE_UNIX})...`);
  const tx = await contract.setSystemStartTime(IST_SUNDAY_BASE_UNIX, { gasPrice });
  console.log("Tx sent! Hash:", tx.hash);
  console.log("Waiting for confirmation on BSC Mainnet...");
  const receipt = await tx.wait();
  console.log("✅ Confirmed in block:", receipt?.blockNumber);

  const newStartTime = await contract.systemStartTime();
  const newEpoch = await contract.getCurrentWeeklyEpoch();
  console.log("\nAfter Update:");
  console.log("systemStartTime:     ", newStartTime.toString());
  console.log("Current Weekly Epoch:", newEpoch.toString());
  console.log("Schedule: Every Saturday 11:59:59 PM IST Close -> Sunday 00:00:00 AM IST New Week");
  console.log("\n=========================================================================");
  console.log("✅ Successfully aligned on-chain contract to Saturday Close / Sunday Start IST!");
  console.log("=========================================================================");
}

main().catch((error) => {
  console.error("Update failed:", error);
  process.exitCode = 1;
});
