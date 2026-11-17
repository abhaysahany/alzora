import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
const TARGET_USER = "0xd3BadAa69584CCA5139e876Fac49E68B4B07635C"; // Member ID 96144 (Global #17)

async function main() {
  console.log("=========================================================================");
  console.log("Reconciling ID #17 (0xd3BadAa69584CCA5139e876Fac49E68B4B07635C)");
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

  // Step 1: Release $10.00 Club Net Profit
  console.log("\nStep 1: Releasing $10.00 USDT Starter Club profit...");
  const amountUnits = ethers.parseUnits("10.00", 18);
  const tx1 = await contract.issueBacklogClubIncome(TARGET_USER, amountUnits, { gasPrice });
  console.log("Tx sent:", tx1.hash);
  await tx1.wait();
  console.log("✅ Tx confirmed!");

  // Step 2: Set Member Club State (Rank 2: Leader, Starter 2/2 completed)
  console.log("\nStep 2: Updating Club Rank to Leader (Rank 2) with Starter 2/2 completed...");
  const tx2 = await contract.setMemberClubState(
    TARGET_USER,
    2,    // currentRank: 2 (Leader)
    2,    // starterProgress: 2
    true, // starterCompleted: true
    0,    // leaderProgress: 0
    false,// leaderCompleted: false
    { gasPrice }
  );
  console.log("Tx sent:", tx2.hash);
  await tx2.wait();
  console.log("✅ Tx confirmed!");

  // Step 3: Verify on-chain
  console.log("\nStep 3: Verifying ID #17 on-chain state...");
  const u = await contract.getUser(TARGET_USER);
  const inc = await contract.getIncomeBreakdown(TARGET_USER);
  const p0 = await contract.getUserClubProgress(TARGET_USER, 0);
  const c0 = await contract.userRankCompleted(TARGET_USER, 0);
  const p1 = await contract.getUserClubProgress(TARGET_USER, 1);
  const c1 = await contract.userRankCompleted(TARGET_USER, 1);

  console.log("--------------------------------------------------");
  console.log("User Address:      ", TARGET_USER);
  console.log("Current Rank:      ", u.currentRank.toString(), "(2 = Leader)");
  console.log("Starter Progress:  ", p0.toString(), "/ 2, Completed:", c0);
  console.log("Leader Progress:   ", p1.toString(), "/ 4, Completed:", c1);
  console.log("Club Income:       ", ethers.formatUnits(inc.clubIncome, 18), "USDT");
  console.log("Direct Income:     ", ethers.formatUnits(inc.directIncome, 18), "USDT");
  console.log("Total Earned:      ", ethers.formatUnits(u.totalIncomeEarned, 18), "USDT");
  console.log("--------------------------------------------------");
  console.log("🎉 ID #17 Successfully Reconciled!");
}

main().catch((error) => {
  console.error("Execution failed:", error);
  process.exitCode = 1;
});
