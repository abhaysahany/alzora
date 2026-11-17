import { network } from "hardhat";

/**
 * RECONCILIATION SCRIPT FOR MAINNET BINARY PAYOUTS
 * 
 * Underpaid Members (Release backlog binary matching):
 * - ID #1 (Root): 8 pairs expected ($16), $14 paid -> Release 1 pair ($2.00)
 * - ID #2: 7 pairs expected ($14), $8 paid -> Release 3 pairs ($6.00)
 * - ID #3: 3 pairs expected ($6), $2 paid -> Release 2 pairs ($4.00)
 * - ID #17 (0xd3bada...): 1 pair expected ($2), $0 paid -> Release 1 pair ($2.00)
 * 
 * Overpaid Members (Set pending deduction to recoup from future earnings):
 * - ID #4: Excess paid -> Set pending deduction
 * - ID #6: $8 paid, $6 expected -> Set pending deduction of $2.00
 */

const ELZORA_PROXY = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

interface UnderpaidAdjustment {
  id: number;
  wallet: string;
  expectedPairs: number;
  paidAmount: number;
  missingPairs: number;
  releaseAmount: number;
}

interface OverpaidAdjustment {
  id: number;
  wallet: string;
  expectedAmount: number;
  paidAmount: number;
  deductionAmount: number;
}

const UNDERPAID_LIST: UnderpaidAdjustment[] = [
  { id: 1, wallet: "0xE60746348b128D3D99546d78E646946599a0311e", expectedPairs: 8, paidAmount: 14, missingPairs: 1, releaseAmount: 2.0 },
  { id: 2, wallet: "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6", expectedPairs: 7, paidAmount: 8, missingPairs: 3, releaseAmount: 6.0 },
  { id: 3, wallet: "0x95F73C4763D78BC26F8D16CfFf43b40174E48f0C", expectedPairs: 3, paidAmount: 2, missingPairs: 2, releaseAmount: 4.0 },
  // ID 17 does NOT qualify (has not fulfilled Left & Right direct condition under its own binary team)
];

const OVERPAID_LIST: OverpaidAdjustment[] = [
  { id: 4, wallet: "0xe97215Fcc9af1A9aF63fE66D1fB5d83A51ce258D", expectedAmount: 6, paidAmount: 10, deductionAmount: 4.0 },
  { id: 6, wallet: "0x9A137cDE2f22532E4df01bdB57C8260841065Bc1", expectedAmount: 6, paidAmount: 8, deductionAmount: 2.0 },
];

async function main() {
  const { ethers } = await network.create();
  const [signer] = await ethers.getSigners();
  console.log("Reconciling Binary Payouts with Signer:", signer.address);

  const elzora = await ethers.getContractAt("ElzoraMain", ELZORA_PROXY, signer);

  // 1. Release Backlog Binary Matching Income to Underpaid IDs
  console.log("\n--- STEP 1: RELEASING BACKLOG BINARY MATCHING ---");
  for (const item of UNDERPAID_LIST) {
    console.log(`Releasing ${item.missingPairs} pair(s) ($${item.releaseAmount} USDT) to ID #${item.id} (${item.wallet})...`);
    const tx = await elzora.issueBacklogBinaryIncome(item.wallet, item.missingPairs);
    await tx.wait();
    console.log(`  -> Released successfully! Tx: ${tx.hash}`);
  }

  // 2. Set Pending Income Deductions for Overpaid IDs
  console.log("\n--- STEP 2: SETTING PENDING DEDUCTIONS ---");
  for (const item of OVERPAID_LIST) {
    const deductionUnits = ethers.parseUnits(item.deductionAmount.toString(), 18);
    console.log(`Setting deduction of $${item.deductionAmount} USDT for ID #${item.id} (${item.wallet})...`);
    const tx = await elzora.setPendingIncomeDeduction(item.wallet, deductionUnits);
    await tx.wait();
    console.log(`  -> Deduction set successfully! Tx: ${tx.hash}`);
  }

  console.log("\nALL RECONCILIATIONS COMPLETED SUCCESSFULLY!");
}

main().catch(console.error);
