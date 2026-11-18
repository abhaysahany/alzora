import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

// Mapping of 1-based index to wallet address
const WALLETS: Record<number, string> = {
  1: "0xE60746348b128D3D99546d78E646946599a0311e", // Root
  2: "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6",
  3: "0x95F73C4763D78BC26F8D16CfFf43b40174E48f0C",
  4: "0xe97215Fcc9af1A9aF63fE66D1fB5d83A51ce258D",
  5: "0xAa623b52691c34640bDDD0A6Ea2492a942c957f5",
  6: "0x9A137cDE2f22532E4df01bdB57C8260841065Bc1",
  7: "0xb840EC936875Aa343d7E1186a45fEd54660624c8",
  8: "0x6B7951Ef13153A16AB0aa4Ce6F4922C9Ad7a7960",
  9: "0x51cD4585422CDD9b6A110c93Fb2b22e527FbF907",
  10: "0x05526902Ac21E9C651112dD06229C2C7D2CcfbcD",
  11: "0x3C86119420e9694967fEf9dEBc96f0DBAB461b4F",
  12: "0xf963263abf71475a3aBc98Ac496523D437b39995",
  13: "0xdE28fE21C30C95e337b3faEb0c8eB33ea1B00BA2",
  14: "0x94ce154149F4D6b737660320789418E32cfA8660",
  15: "0xC1E6DA0D38aDC6aF2b219f231C8fe7356D166609",
  16: "0xeAdF33D5482078CeA1492430E6cC0aeF9Ffe80eC",
  17: "0xd3BadAa69584CCA5139e876Fac49E68B4B07635C",
  18: "0x9E980EC4316dDF9b09DfF008065E1E3DD81f8A27",
  19: "0xD43eAb21B3538D65F334c10b8C0B48F0AD8CFA04",
  20: "0xe696aE7D9F069ee958637c0bC8BC805F1219207F",
  21: "0x203459cb064667713A24cFcC1d71618E84fB2BB4",
  22: "0x53Ed00B890a102A84dC9D35039D9D063Af9107ca",
  23: "0xcb090Ce3627fcfFCB1eA345e2a73fd2D54Ebb4ef",
  24: "0xa5038286a6553F43B632Ad896Bd5250d76c3f356",
  25: "0x535f5F23345ABED96b88B2833061b14aA3Bf1313",
};

interface NodeConfig {
  id: number;
  parent: number; // 0 = None
  pos: number; // 0 = None, 1 = Left, 2 = Right
  left: number; // 0 = None
  right: number; // 0 = None
  leftTeam: number;
  rightTeam: number;
  leftCarry: number;
  rightCarry: number;
  leftDirect: number;
  rightDirect: number;
}

const TREE_NODES: NodeConfig[] = [
  // ID 1 (Root): 15 Left (IDs 2,4,5,6,7,9,10,11,13,14,18,19,20,24,25), 9 Right (IDs 3,8,12,15,16,17,21,22,23)
  { id: 1, parent: 0, pos: 0, left: 2, right: 3, leftTeam: 15, rightTeam: 9, leftCarry: 6, rightCarry: 0, leftDirect: 2, rightDirect: 2 },
  
  // ID 2: 0 directs, Left child ID 4, Left Team 14, Right Team 0
  { id: 2, parent: 1, pos: 1, left: 4, right: 0, leftTeam: 14, rightTeam: 0, leftCarry: 14, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 3: 0 directs, Right child ID 8, Left Team 0, Right Team 8
  { id: 3, parent: 1, pos: 2, left: 0, right: 8, leftTeam: 0, rightTeam: 8, leftCarry: 0, rightCarry: 8, leftDirect: 0, rightDirect: 0 },
  
  // ID 4: 6 directs (5,10,11,13,18,19). Left child ID 5, Right child ID 10. LeftTeam 7, RightTeam 6
  { id: 4, parent: 2, pos: 1, left: 5, right: 10, leftTeam: 7, rightTeam: 6, leftCarry: 1, rightCarry: 0, leftDirect: 1, rightDirect: 5 },
  
  // ID 5: 4 directs (6,7,9,14). Left child ID 6, Right child ID 7. LeftTeam 2, RightTeam 4
  { id: 5, parent: 4, pos: 1, left: 6, right: 7, leftTeam: 2, rightTeam: 4, leftCarry: 0, rightCarry: 2, leftDirect: 2, rightDirect: 2 },
  
  // ID 6: 0 directs. Left child ID 14. LeftTeam 1, RightTeam 0
  { id: 6, parent: 5, pos: 1, left: 14, right: 0, leftTeam: 1, rightTeam: 0, leftCarry: 1, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 7: 0 directs. Right child ID 9. LeftTeam 0, RightTeam 3
  { id: 7, parent: 5, pos: 2, left: 0, right: 9, leftTeam: 0, rightTeam: 3, leftCarry: 0, rightCarry: 3, leftDirect: 0, rightDirect: 0 },
  
  // ID 8: 4 directs (12,15,16,17). Left child ID 16, Right child ID 12. LeftTeam 1, RightTeam 6
  { id: 8, parent: 3, pos: 2, left: 16, right: 12, leftTeam: 1, rightTeam: 6, leftCarry: 0, rightCarry: 5, leftDirect: 1, rightDirect: 3 },
  
  // ID 9: 0 directs. Left child ID 18, Right child ID 19. LeftTeam 1, RightTeam 1
  { id: 9, parent: 7, pos: 2, left: 18, right: 19, leftTeam: 1, rightTeam: 1, leftCarry: 0, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 10: 1 direct (24). Left child ID 20, Right child ID 11. LeftTeam 3, RightTeam 2
  { id: 10, parent: 4, pos: 2, left: 20, right: 11, leftTeam: 3, rightTeam: 2, leftCarry: 1, rightCarry: 0, leftDirect: 1, rightDirect: 0 },
  
  // ID 11: 1 direct (20). Right child ID 13. LeftTeam 0, RightTeam 1
  { id: 11, parent: 10, pos: 2, left: 0, right: 13, leftTeam: 0, rightTeam: 1, leftCarry: 0, rightCarry: 1, leftDirect: 1, rightDirect: 0 },
  
  // ID 12: 0 directs. Right child ID 15. LeftTeam 0, RightTeam 5
  { id: 12, parent: 8, pos: 2, left: 0, right: 15, leftTeam: 0, rightTeam: 5, leftCarry: 0, rightCarry: 5, leftDirect: 0, rightDirect: 0 },
  
  // ID 13: 0 directs. Leaf
  { id: 13, parent: 11, pos: 2, left: 0, right: 0, leftTeam: 0, rightTeam: 0, leftCarry: 0, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 14: 0 directs. Leaf
  { id: 14, parent: 6, pos: 1, left: 0, right: 0, leftTeam: 0, rightTeam: 0, leftCarry: 0, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 15: 0 directs. Right child ID 17. LeftTeam 0, RightTeam 4
  { id: 15, parent: 12, pos: 2, left: 0, right: 17, leftTeam: 0, rightTeam: 4, leftCarry: 0, rightCarry: 4, leftDirect: 0, rightDirect: 0 },
  
  // ID 16: 0 directs. Leaf
  { id: 16, parent: 8, pos: 1, left: 0, right: 0, leftTeam: 0, rightTeam: 0, leftCarry: 0, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 17: 3 directs (21,22,23). Left child ID 21, Right child ID 22. LeftTeam 2, RightTeam 1
  { id: 17, parent: 15, pos: 2, left: 21, right: 22, leftTeam: 2, rightTeam: 1, leftCarry: 1, rightCarry: 0, leftDirect: 2, rightDirect: 1 },
  
  // ID 18: 0 directs. Leaf
  { id: 18, parent: 9, pos: 1, left: 0, right: 0, leftTeam: 0, rightTeam: 0, leftCarry: 0, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 19: 0 directs. Leaf
  { id: 19, parent: 9, pos: 2, left: 0, right: 0, leftTeam: 0, rightTeam: 0, leftCarry: 0, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 20: 0 directs. Left child ID 24. LeftTeam 2, RightTeam 0
  { id: 20, parent: 10, pos: 1, left: 24, right: 0, leftTeam: 2, rightTeam: 0, leftCarry: 2, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 21: 0 directs. Left child ID 23. LeftTeam 1, RightTeam 0
  { id: 21, parent: 17, pos: 1, left: 23, right: 0, leftTeam: 1, rightTeam: 0, leftCarry: 1, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 22: 0 directs. Leaf
  { id: 22, parent: 17, pos: 2, left: 0, right: 0, leftTeam: 0, rightTeam: 0, leftCarry: 0, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 23: 0 directs. Leaf
  { id: 23, parent: 21, pos: 1, left: 0, right: 0, leftTeam: 0, rightTeam: 0, leftCarry: 0, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
  
  // ID 24: 1 direct (25). Left child ID 25. LeftTeam 1, RightTeam 0
  { id: 24, parent: 20, pos: 1, left: 25, right: 0, leftTeam: 1, rightTeam: 0, leftCarry: 1, rightCarry: 0, leftDirect: 1, rightDirect: 0 },
  
  // ID 25: 0 directs. Leaf
  { id: 25, parent: 24, pos: 1, left: 0, right: 0, leftTeam: 0, rightTeam: 0, leftCarry: 0, rightCarry: 0, leftDirect: 0, rightDirect: 0 },
];

async function main() {
  console.log("========================================================================");
  console.log("⚡ DECOUPLING BINARY TREE FROM GLOBAL 2xN MATRIX (TRUE MLM BINARY)");
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

  // Step 3: Batch Reconcile Binary Tree for all 25 users
  console.log("\n--- STEP 3: RECONCILING TRUE BINARY TREE POINTERS ---");
  const adjustments = TREE_NODES.map((n) => ({
    user: WALLETS[n.id],
    parent: n.parent === 0 ? ethers.ZeroAddress : WALLETS[n.parent],
    leftChild: n.left === 0 ? ethers.ZeroAddress : WALLETS[n.left],
    rightChild: n.right === 0 ? ethers.ZeroAddress : WALLETS[n.right],
    position: n.pos,
    leftCarry: n.leftCarry,
    rightCarry: n.rightCarry,
    leftTeam: n.leftTeam,
    rightTeam: n.rightTeam,
    leftDirectCount: n.leftDirect,
    rightDirectCount: n.rightDirect,
  }));

  const reconcileTx = await proxyAsMain.batchReconcileBinaryUsers(adjustments, { gasPrice });
  console.log("Reconcile Tx sent:", reconcileTx.hash);
  await reconcileTx.wait();
  console.log("✅ All 25 users successfully updated to True MLM Binary Tree!");

  // Step 4: Issue 1 backlog pair ($2.00 USDT) to ID #17
  console.log("\n--- STEP 4: ISSUING BACKLOG 1:1 BINARY MATCHING PAIR TO ID #17 ---");
  const ID17_WALLET = WALLETS[17];
  const pairTx = await proxyAsMain.issueBacklogBinaryIncome(ID17_WALLET, 1, { gasPrice });
  console.log("ID #17 Backlog Binary Pair Tx:", pairTx.hash);
  await pairTx.wait();
  console.log("✅ ID #17 received $2.00 USDT for 1:1 matching pair!");

  // Step 5: Update ID #2 Pending Deduction for excess binary matching ($14.00)
  // Total excess for ID 2 = $26.00 (Leader) + $14.00 (Binary Matching with 0 directs) = $40.00 USDT
  console.log("\n--- STEP 5: UPDATING PENDING DEDUCTION FOR ID #2 ($40.00 USDT TOTAL) ---");
  const ID2_WALLET = WALLETS[2];
  const totalDeduction = ethers.parseUnits("40.00", 18);
  const dedTx = await proxyAsMain.setPendingIncomeDeduction(ID2_WALLET, totalDeduction, { gasPrice });
  console.log("ID #2 Deduction Tx:", dedTx.hash);
  await dedTx.wait();
  console.log("✅ ID #2 pending deduction set to $40.00 USDT ($26 Leader + $14 Binary)!");

  // Step 6: Verify Final State
  console.log("\n--- STEP 6: VERIFYING ON-CHAIN BINARY STATE ---");
  const u1 = await proxyAsMain.getUser(WALLETS[1]);
  const u2 = await proxyAsMain.getUser(WALLETS[2]);
  const u4 = await proxyAsMain.getUser(WALLETS[4]);
  const u17 = await proxyAsMain.getUser(WALLETS[17]);

  console.log(`ID 1 (Root): LeftChild=${u1.leftChild === WALLETS[2] ? "ID #2" : u1.leftChild}, RightChild=${u1.rightChild === WALLETS[3] ? "ID #3" : u1.rightChild}, L:${u1.leftTeamCount}, R:${u1.rightTeamCount}`);
  console.log(`ID 2:        LeftChild=${u2.leftChild === WALLETS[4] ? "ID #4" : u2.leftChild}, RightChild=${u2.rightChild === ethers.ZeroAddress ? "EMPTY" : u2.rightChild}, L:${u2.leftTeamCount}, R:${u2.rightTeamCount}`);
  console.log(`ID 4:        LeftChild=${u4.leftChild === WALLETS[5] ? "ID #5" : u4.leftChild}, RightChild=${u4.rightChild === WALLETS[10] ? "ID #10" : u4.rightChild}, L:${u4.leftTeamCount}, R:${u4.rightTeamCount}`);
  console.log(`ID 17:       LeftChild=${u17.leftChild === WALLETS[21] ? "ID #21" : u17.leftChild}, RightChild=${u17.rightChild === WALLETS[22] ? "ID #22" : u17.rightChild}, L:${u17.leftTeamCount}, R:${u17.rightTeamCount}`);

  console.log("\n🎉 ALL ON-CHAIN TASKS COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
