import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
const ID2_WALLET = "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6"; // Member ID 68169 (Global #2)

async function main() {
  console.log("=========================================================================");
  console.log("Setting Pending Deduction & Rank State for ID #2 (Spillover Starter)");
  console.log("=========================================================================");

  const { ethers } = await network.create({
    network: "bscMainnet",
  });

  const [deployer] = await ethers.getSigners();
  console.log("Operator / Deployer:", deployer.address);

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("3", "gwei");

  const ElzoraMainFactory = await ethers.getContractFactory("ElzoraMain");
  const contract = ElzoraMainFactory.attach(PROXY_ADDRESS) as any;

  // 1. Set Pending Deduction ($26.00 USDT for Leader profit paid in advance)
  console.log("\nStep 1: Setting $26.00 USDT pending deduction for ID #2...");
  const dedAmount = ethers.parseUnits("26.00", 18);
  const tx1 = await contract.setPendingIncomeDeduction(ID2_WALLET, dedAmount, { gasPrice });
  console.log("Tx sent:", tx1.hash);
  await tx1.wait();
  console.log("✅ Tx confirmed!");

  // 2. Set Member Club State: Rank 2 (Leader in progress, Starter completed via spillover)
  console.log("\nStep 2: Syncing ID #2 Club State to Rank 2 (Starter completed 2/2 via spillover, Leader 0/4)...");
  const tx2 = await contract.setMemberClubState(
    ID2_WALLET,
    2,     // currentRank: 2 (Leader in progress)
    2,     // starterProgress: 2
    true,  // starterCompleted: true
    0,     // leaderProgress: 0 (needs 4 Starters in team)
    false, // leaderCompleted: false
    { gasPrice }
  );
  console.log("Tx sent:", tx2.hash);
  await tx2.wait();
  console.log("✅ Tx confirmed!");

  // 3. Verify on-chain state
  console.log("\nStep 3: Verifying ID #2 on-chain state...");
  const u = await contract.getUser(ID2_WALLET);
  const inc = await contract.getIncomeBreakdown(ID2_WALLET);
  const ded = await contract.pendingIncomeDeduction(ID2_WALLET);
  const p0 = await contract.getUserClubProgress(ID2_WALLET, 0);
  const c0 = await contract.userRankCompleted(ID2_WALLET, 0);
  const p1 = await contract.getUserClubProgress(ID2_WALLET, 1);
  const c1 = await contract.userRankCompleted(ID2_WALLET, 1);

  console.log("--------------------------------------------------");
  console.log("ID #2 Address:       ", ID2_WALLET);
  console.log("Current Rank:        ", u.currentRank.toString(), "(2 = Leader in Progress / Spillover Starter)");
  console.log("Starter Progress:    ", p0.toString(), "/ 2, Completed:", c0);
  console.log("Leader Progress:     ", p1.toString(), "/ 4, Completed:", c1);
  console.log("Total Earned:        ", ethers.formatUnits(u.totalIncomeEarned, 18), "USDT");
  console.log("Pending Deduction:   ", ethers.formatUnits(ded, 18), "USDT ($26.00 Active Recovery)");
  console.log("--------------------------------------------------");
  console.log("🎉 ID #2 Successfully Reconciled with $26.00 Pending Deduction!");
}

main().catch((error) => {
  console.error("Execution failed:", error);
  process.exitCode = 1;
});
