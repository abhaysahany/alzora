import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

interface BinaryRelease {
  id: number;
  wallet: string;
  pairs: number;
  amount: number;
}

interface AffiliateRelease {
  id: number;
  wallet: string;
  amount: number;
}

interface Deduction {
  id: number;
  wallet: string;
  amount: number;
  reason: string;
}

// 1. Binary Matching Backlog to Release
const BINARY_RELEASES: BinaryRelease[] = [
  { id: 1, wallet: "0xE60746348b128D3D99546d78E646946599a0311e", pairs: 1, amount: 2.0 },
  { id: 2, wallet: "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6", pairs: 3, amount: 6.0 },
  { id: 3, wallet: "0x95F73C4763D78BC26F8D16CfFf43b40174E48f0C", pairs: 2, amount: 4.0 },
];

// 2. Affiliate 20-Level Matrix Backlog to Release
const AFFILIATE_RELEASES: AffiliateRelease[] = [
  { id: 2, wallet: "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6", amount: 3.20 },
  { id: 3, wallet: "0x95F73C4763D78BC26F8D16CfFf43b40174E48f0C", amount: 2.40 },
  { id: 7, wallet: "0xb840EC936875Aa343d7E1186a45fEd54660624c8", amount: 0.80 },
];

// 3. Net Pending Deductions (Minus Provision)
const PENDING_DEDUCTIONS: Deduction[] = [
  { id: 4, wallet: "0xe97215Fcc9af1A9aF63fE66D1fB5d83A51ce258D", amount: 5.60, reason: "Binary $4.00 + Affiliate $1.60" },
  { id: 5, wallet: "0xAa623b52691c34640bDDD0A6Ea2492a942c957f5", amount: 0.80, reason: "Affiliate $0.80" },
  { id: 6, wallet: "0x9A137cDE2f22532E4df01bdB57C8260841065Bc1", amount: 1.20, reason: "Binary $2.00 minus Affiliate $0.80 = Net $1.20" },
  { id: 8, wallet: "0x6B7951Ef13153A16AB0aa4Ce6F4922C9Ad7a7960", amount: 0.80, reason: "Affiliate $0.80" },
];

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("=========================================================================");
  console.log("🚀 ELZORA MAINNET UPGRADE & COMPREHENSIVE RECONCILIATION");
  console.log("=========================================================================");
  console.log("Deployer / Admin Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("BNB Balance:            ", ethers.formatEther(balance), "BNB");
  console.log("Target Proxy Address:   ", PROXY_ADDRESS);

  const feeData = await ethers.provider.getFeeData();
  const minGasPrice = ethers.parseUnits("1.1", "gwei");
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > minGasPrice
      ? feeData.gasPrice
      : minGasPrice;
  console.log("Using Gas Price:        ", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // Step 1: Deploy New Implementation
  console.log("\n--- STEP 1: DEPLOYING NEW IMPLEMENTATION CONTRACT ---");
  const newImpl = await ethers.deployContract("ElzoraMain", [], { gasPrice });
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  console.log(">> ✅ New Implementation deployed at:", newImplAddress);

  // Step 2: Upgrade Proxy via UUPS upgradeToAndCall
  console.log("\n--- STEP 2: UPGRADING PROXY VIA UUPS ---");
  const proxyAsMain = await ethers.getContractAt("ElzoraMain", PROXY_ADDRESS, deployer);

  const currentOwner = await proxyAsMain.owner();
  console.log(">> Proxy Owner:         ", currentOwner);
  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`Deployer ${deployer.address} is not owner ${currentOwner}!`);
  }

  const upgradeTx = await proxyAsMain.upgradeToAndCall(newImplAddress, "0x", { gasPrice });
  console.log(">> Upgrade Tx Submitted:", upgradeTx.hash);
  await upgradeTx.wait();
  console.log(">> ✅ Proxy Upgraded Successfully!");

  // Step 3: Release Binary Backlog Incomes
  console.log("\n--- STEP 3: RELEASING BACKLOG BINARY MATCHING INCOMES ---");
  for (const item of BINARY_RELEASES) {
    console.log(`Releasing ${item.pairs} pair(s) ($${item.amount.toFixed(2)} USDT) to ID #${item.id} (${item.wallet})...`);
    const tx = await proxyAsMain.issueBacklogBinaryIncome(item.wallet, item.pairs, { gasPrice });
    await tx.wait();
    console.log(`  -> ✅ Done. Tx: ${tx.hash}`);
  }

  // Step 4: Release Affiliate Backlog Incomes
  console.log("\n--- STEP 4: RELEASING BACKLOG AFFILIATE INCOMES ---");
  for (const item of AFFILIATE_RELEASES) {
    const amountUnits = ethers.parseUnits(item.amount.toFixed(2), 18);
    console.log(`Releasing $${item.amount.toFixed(2)} USDT affiliate income to ID #${item.id} (${item.wallet})...`);
    const tx = await proxyAsMain.issueBacklogAffiliateIncome(item.wallet, amountUnits, { gasPrice });
    await tx.wait();
    console.log(`  -> ✅ Done. Tx: ${tx.hash}`);
  }

  // Step 5: Set Pending Income Deductions
  console.log("\n--- STEP 5: SETTING PENDING DEDUCTIONS (MINUS PROVISION) ---");
  for (const item of PENDING_DEDUCTIONS) {
    const deductionUnits = ethers.parseUnits(item.amount.toFixed(2), 18);
    console.log(`Setting pending deduction of $${item.amount.toFixed(2)} USDT for ID #${item.id} (${item.wallet}) [${item.reason}]...`);
    const tx = await proxyAsMain.setPendingIncomeDeduction(item.wallet, deductionUnits, { gasPrice });
    await tx.wait();
    console.log(`  -> ✅ Done. Tx: ${tx.hash}`);
  }

  // Step 6: Final Verification
  console.log("\n=========================================================================");
  console.log("🎉 ALL OPERATIONS COMPLETED! VERIFYING ON-CHAIN STATUS...");
  console.log("=========================================================================");

  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 17]) {
    const addr = await proxyAsMain.globalMatrixUsers(id);
    const inc = await proxyAsMain.getIncomeBreakdown(addr);
    const ded = await proxyAsMain.pendingIncomeDeduction(addr);
    console.log(
      `ID #${id} (${addr.slice(0, 10)}...): ` +
      `Matching = $${Number(ethers.formatUnits(inc.matchingIncome, 18)).toFixed(2)} | ` +
      `Affiliate = $${Number(ethers.formatUnits(inc.affiliateIncome, 18)).toFixed(2)} | ` +
      `Pending Deduction = $${Number(ethers.formatUnits(ded, 18)).toFixed(2)}`
    );
  }

  console.log("\n>> UPDATE .env WITH NEW IMPLEMENTATION ADDRESS:");
  console.log(`IMPLEMENTATION_ADDRESS="${newImplAddress}"`);
}

main().catch((error) => {
  console.error("Execution failed:", error);
  process.exitCode = 1;
});
