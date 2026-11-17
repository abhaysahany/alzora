import { network } from "hardhat";

/**
 * Script to reconcile binary pointers and credit backlog binary income
 * for wallet 0xd3badaa69584cca5139e876fac49e68b4b07635c
 * 
 * Usage (when ready to deploy/execute):
 * npx hardhat run scripts/reconcile-user-binary.ts --network bscMainnet
 */
async function main() {
  const { ethers } = await network.create();
  const [signer] = await ethers.getSigners();
  console.log(`Executing with signer: ${signer.address}`);

  const TARGET_USER = "0xd3BadAa69584CCA5139e876Fac49E68B4B07635C";
  const DIRECT_1_LEFT = "0x203459cb064667713A24cFcC1d71618E84fB2BB4";
  const DIRECT_2_RIGHT = "0x53Ed00B890a102A84dC9D35039D9D063Af9107ca";
  const DIRECT_3_LEFT_SPILL = "0xcb090Ce3627fcfFCB1eA345e2a73fd2D54Ebb4ef";

  const ELZORA_MAIN_ADDR = process.env.ELZORA_MAIN_ADDRESS || "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
  const elzora = await ethers.getContractAt("ElzoraMain", ELZORA_MAIN_ADDR);

  console.log(`Target User: ${TARGET_USER}`);
  console.log(`Contract:    ${ELZORA_MAIN_ADDR}`);

  // 1. Prepare Binary Adjustment list
  // Direct 1 is Left child of TARGET_USER
  // Direct 2 is Right child of TARGET_USER
  // Direct 3 is Left child of Direct 1 (Spillover)
  const adjustments = [
    {
      user: TARGET_USER,
      parent: (await elzora.getUser(TARGET_USER)).parent,
      leftChild: DIRECT_1_LEFT,
      rightChild: DIRECT_2_RIGHT,
      position: 2, // Right child of its parent
      leftCarry: 1, // 1 pair matched, 1 Left carry forward
      rightCarry: 0,
      leftTeam: 2,
      rightTeam: 1,
    },
    {
      user: DIRECT_1_LEFT,
      parent: TARGET_USER,
      leftChild: DIRECT_3_LEFT_SPILL,
      rightChild: ethers.ZeroAddress,
      position: 1, // Left
      leftCarry: 1,
      rightCarry: 0,
      leftTeam: 1,
      rightTeam: 0,
    },
    {
      user: DIRECT_2_RIGHT,
      parent: TARGET_USER,
      leftChild: ethers.ZeroAddress,
      rightChild: ethers.ZeroAddress,
      position: 2, // Right
      leftCarry: 0,
      rightCarry: 0,
      leftTeam: 0,
      rightTeam: 0,
    },
    {
      user: DIRECT_3_LEFT_SPILL,
      parent: DIRECT_1_LEFT,
      leftChild: ethers.ZeroAddress,
      rightChild: ethers.ZeroAddress,
      position: 1, // Left
      leftCarry: 0,
      rightCarry: 0,
      leftTeam: 0,
      rightTeam: 0,
    },
  ];

  console.log("\n1. Reconciling Binary Tree pointers...");
  const txReconcile = await (elzora as any).batchReconcileBinaryUsers(adjustments);
  await txReconcile.wait();
  console.log(`Binary pointers updated! Tx: ${txReconcile.hash}`);

  // 2. Issue Backlog Matching Income (1 pair = $2.00 USDT)
  console.log("\n2. Issuing backlog 1:1 binary matching income (1 pair = $2.00 USDT)...");
  const txIncome = await elzora.issueBacklogBinaryIncome(TARGET_USER, 1);
  await txIncome.wait();
  console.log(`Backlog matching income issued! Tx: ${txIncome.hash}`);

  console.log("\nReconciliation completed successfully!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
