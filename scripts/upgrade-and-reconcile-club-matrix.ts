import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

interface ClubBacklogRelease {
  id: number;
  wallet: string;
  amount: number;
  reason: string;
}

interface ClubMemberSync {
  id: number;
  wallet: string;
  currentRank: number;
  starterProgress: number;
  starterDone: boolean;
  leaderProgress: number;
  leaderDone: boolean;
}

const CLUB_RELEASES: ClubBacklogRelease[] = [
  { id: 1, wallet: "0xE60746348b128D3D99546d78E646946599a0311e", amount: 26.0, reason: "Leader Net Profit (Rank 2 completed with 4 Starters at L2)" },
  { id: 2, wallet: "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6", amount: 36.0, reason: "Starter ($10) + Leader ($26) Net Profits (Ranks 1 & 2 completed)" },
  { id: 3, wallet: "0x95F73C4763D78BC26F8D16CfFf43b40174E48f0C", amount: 10.0, reason: "Starter Net Profit (Rank 1 completed with IDs 6, 7)" },
  { id: 6, wallet: "0x9A137cDE2f22532E4df01bdB57C8260841065Bc1", amount: 10.0, reason: "Starter Net Profit (Rank 1 completed with IDs 12, 13)" },
  { id: 7, wallet: "0xb840EC936875Aa343d7E1186a45fEd54660624c8", amount: 10.0, reason: "Starter Net Profit (Rank 1 completed with IDs 14, 15)" },
];

const CLUB_SYNCS: ClubMemberSync[] = [
  { id: 1, wallet: "0xE60746348b128D3D99546d78E646946599a0311e", currentRank: 3, starterProgress: 2, starterDone: true, leaderProgress: 4, leaderDone: true },
  { id: 2, wallet: "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6", currentRank: 3, starterProgress: 2, starterDone: true, leaderProgress: 4, leaderDone: true },
  { id: 3, wallet: "0x95F73C4763D78BC26F8D16CfFf43b40174E48f0C", currentRank: 2, starterProgress: 2, starterDone: true, leaderProgress: 0, leaderDone: false },
  { id: 4, wallet: "0xe97215Fcc9af1A9aF63fE66D1fB5d83A51ce258D", currentRank: 2, starterProgress: 2, starterDone: true, leaderProgress: 0, leaderDone: false },
  { id: 5, wallet: "0xAa623b52691c34640bDDD0A6Ea2492a942c957f5", currentRank: 2, starterProgress: 2, starterDone: true, leaderProgress: 0, leaderDone: false },
  { id: 6, wallet: "0x9A137cDE2f22532E4df01bdB57C8260841065Bc1", currentRank: 2, starterProgress: 2, starterDone: true, leaderProgress: 0, leaderDone: false },
  { id: 7, wallet: "0xb840EC936875Aa343d7E1186a45fEd54660624c8", currentRank: 2, starterProgress: 2, starterDone: true, leaderProgress: 0, leaderDone: false },
  { id: 8, wallet: "0x6B7951Ef13153A16AB0aa4Ce6F4922C9Ad7a7960", currentRank: 2, starterProgress: 2, starterDone: true, leaderProgress: 0, leaderDone: false },
  { id: 9, wallet: "0x51cD4585422CDD9b6A110c93Fb2b22e527FbF907", currentRank: 2, starterProgress: 2, starterDone: true, leaderProgress: 0, leaderDone: false },
  { id: 10, wallet: "0x05526902Ac21E9C651112dD06229C2C7D2CcfbcD", currentRank: 2, starterProgress: 2, starterDone: true, leaderProgress: 0, leaderDone: false },
  { id: 11, wallet: "0x3C86119420e9694967fEf9dEBc96f0DBAB461b4F", currentRank: 2, starterProgress: 2, starterDone: true, leaderProgress: 0, leaderDone: false },
  { id: 12, wallet: "0xf963263abf71475a3aBc98Ac496523D437b39995", currentRank: 1, starterProgress: 1, starterDone: false, leaderProgress: 0, leaderDone: false },
];

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("=========================================================================");
  console.log("🚀 UPGRADE & RECONCILE 8 CLUB MATRICES ON BSC MAINNET");
  console.log("=========================================================================");
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("BNB Balance:            ", ethers.formatEther(balance), "BNB");

  const feeData = await ethers.provider.getFeeData();
  const minGasPrice = ethers.parseUnits("1.1", "gwei");
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > minGasPrice
      ? feeData.gasPrice
      : minGasPrice;
  console.log("Using Gas Price:        ", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // Step 1: Deploy new implementation
  console.log("\n--- STEP 1: DEPLOYING NEW IMPLEMENTATION ---");
  const newImpl = await ethers.deployContract("ElzoraMain", [], { gasPrice });
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  console.log(">> ✅ New Implementation deployed at:", newImplAddress);

  // Step 2: Upgrade Proxy
  console.log("\n--- STEP 2: UPGRADING PROXY ---");
  const proxyAsMain = await ethers.getContractAt("ElzoraMain", PROXY_ADDRESS, deployer);
  const upgradeTx = await proxyAsMain.upgradeToAndCall(newImplAddress, "0x", { gasPrice });
  console.log(">> Upgrade Tx Submitted:", upgradeTx.hash);
  await upgradeTx.wait();
  console.log(">> ✅ Proxy Upgraded Successfully!");

  // Step 3: Release Club Backlog Incomes
  console.log("\n--- STEP 3: RELEASING CLUB MATRIX BACKLOG INCOMES ---");
  for (const item of CLUB_RELEASES) {
    const amountUnits = ethers.parseUnits(item.amount.toFixed(2), 18);
    console.log(`Releasing $${item.amount.toFixed(2)} USDT club profit to ID #${item.id} (${item.wallet}) [${item.reason}]...`);
    const tx = await proxyAsMain.issueBacklogClubIncome(item.wallet, amountUnits, { gasPrice });
    await tx.wait();
    console.log(`  -> ✅ Done. Tx: ${tx.hash}`);
  }

  // Step 4: Set Overpaid Deduction for ID #12 ($10.00)
  console.log("\n--- STEP 4: SETTING PENDING DEDUCTION FOR OVERPAID ID #12 ---");
  const id12Deduction = ethers.parseUnits("10.00", 18);
  const tx12 = await proxyAsMain.setPendingIncomeDeduction("0xf963263abf71475a3aBc98Ac496523D437b39995", id12Deduction, { gasPrice });
  await tx12.wait();
  console.log("  -> ✅ ID #12 Deduction Set ($10.00 USDT). Tx:", tx12.hash);

  // Step 5: Synchronize Club Member States & Progress
  console.log("\n--- STEP 5: SYNCHRONIZING MEMBER CLUB RANKS & COUNTERS ---");
  for (const m of CLUB_SYNCS) {
    console.log(`Syncing ID #${m.id} (${m.wallet}) -> Rank: ${m.currentRank}, Starter: ${m.starterProgress}/2 (${m.starterDone}), Leader: ${m.leaderProgress}/4 (${m.leaderDone})...`);
    const tx = await proxyAsMain.setMemberClubState(
      m.wallet,
      m.currentRank,
      m.starterProgress,
      m.starterDone,
      m.leaderProgress,
      m.leaderDone,
      { gasPrice }
    );
    await tx.wait();
    console.log(`  -> ✅ Synced. Tx: ${tx.hash}`);
  }

  // Step 6: Verification
  console.log("\n=========================================================================");
  console.log("🎉 ALL OPERATIONS COMPLETED! VERIFYING CLUB ON-CHAIN STATUS...");
  console.log("=========================================================================");

  for (let i = 1; i <= 12; i++) {
    const addr = await proxyAsMain.globalMatrixUsers(i);
    const u = await proxyAsMain.getUser(addr);
    const inc = await proxyAsMain.getIncomeBreakdown(addr);
    const p0 = await proxyAsMain.getUserClubProgress(addr, 0);
    const c0 = await proxyAsMain.userRankCompleted(addr, 0);
    const p1 = await proxyAsMain.getUserClubProgress(addr, 1);
    const c1 = await proxyAsMain.userRankCompleted(addr, 1);

    const rankName = Number(u.currentRank) === 3 ? "Achiever" : Number(u.currentRank) === 2 ? "Leader" : "Starter";

    console.log(
      `ID #${String(i).padEnd(2)}: ` +
      `Rank: ${rankName.padEnd(8)} (Tier ${u.currentRank}) | ` +
      `Starter: ${p0}/2 (${c0 ? "DONE" : "InProg"}) | ` +
      `Leader: ${p1}/4 (${c1 ? "DONE" : "InProg"}) | ` +
      `Club Income: $${Number(ethers.formatUnits(inc.clubIncome, 18)).toFixed(2)}`
    );
  }

  console.log("\n>> UPDATE .env WITH NEW IMPLEMENTATION ADDRESS:");
  console.log(`IMPLEMENTATION_ADDRESS="${newImplAddress}"`);
}

main().catch((error) => {
  console.error("Execution failed:", error);
  process.exitCode = 1;
});
