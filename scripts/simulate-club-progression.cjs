const { ethers } = require("ethers");
const ABI = require("../frontend/src/web3/ElzoraMain.abi.json");
const RPC = "https://bsc-mainnet.core.chainstack.com/3ad4bf7b2d982ea6ff8e91a5f3c765fb";
const ADDR = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

// Tree structure: 1->(2,3), 2->(4,5), 3->(6,7), 4->(8,9), 5->(10,11), 6->(12,13), 7->(14,15),
// 8->(16,17), 9->(18,19), 10->(20,21), 11->(22,23), 12->(24)

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ADDR, ABI, provider);
  const total = Number(await elzora.totalUsers());

  console.log("=========================================================================================");
  console.log("SIMULATING EXACT CLUB MATRIX PROGRESSION UNDER THE SPECIFIED 2x8 CASCADING LOGIC");
  console.log("=========================================================================================");

  // Define children in tree
  const childrenOf = {};
  for (let i = 1; i <= total; i++) childrenOf[i] = [];
  for (let i = 2; i <= total; i++) {
    const parent = Math.floor(i / 2);
    childrenOf[parent].push(i);
  }

  // 1. Evaluate Starter (Rank 1): Needs 2 Members (direct children in tree)
  const isStarterCompleted = {};
  const starterChildrenCount = {};
  for (let i = 1; i <= total; i++) {
    starterChildrenCount[i] = childrenOf[i].length;
    isStarterCompleted[i] = starterChildrenCount[i] >= 2;
  }

  // 2. Evaluate Leader (Rank 2): Needs 4 Starters at Level 2 (children of children)
  const isLeaderCompleted = {};
  const leaderProgress = {};
  for (let i = 1; i <= total; i++) {
    let startersAtL2 = 0;
    for (const c1 of childrenOf[i]) {
      for (const c2 of childrenOf[c1]) {
        if (isStarterCompleted[c2]) {
          startersAtL2++;
        }
      }
    }
    leaderProgress[i] = startersAtL2;
    isLeaderCompleted[i] = startersAtL2 >= 4;
  }

  // 3. Evaluate Achiever (Rank 3): Needs 8 Leaders at Level 3 (children of children of children)
  const isAchieverCompleted = {};
  const achieverProgress = {};
  for (let i = 1; i <= total; i++) {
    let leadersAtL3 = 0;
    for (const c1 of childrenOf[i]) {
      for (const c2 of childrenOf[c1]) {
        for (const c3 of childrenOf[c2]) {
          if (isLeaderCompleted[c3]) {
            leadersAtL3++;
          }
        }
      }
    }
    achieverProgress[i] = leadersAtL3;
    isAchieverCompleted[i] = leadersAtL3 >= 8;
  }

  console.log("ID | Address | Starter Expected | Leader Expected | Achiever Expected | Final Expected Rank | Actual On-Chain Rank");
  console.log("------------------------------------------------------------------------------------------------------------------");

  let starterQualCount = 0;
  let leaderQualCount = 0;
  let achieverQualCount = 0;

  for (let i = 1; i <= total; i++) {
    const addr = await elzora.globalMatrixUsers(i);
    const u = await elzora.getUser(addr);
    const actualRank = Number(u.currentRank);

    if (isStarterCompleted[i]) starterQualCount++;
    if (isLeaderCompleted[i]) leaderQualCount++;
    if (isAchieverCompleted[i]) achieverQualCount++;

    const expRank = isAchieverCompleted[i] ? 4 : isLeaderCompleted[i] ? 3 : isStarterCompleted[i] ? 2 : 1;
    const expRankName = expRank === 4 ? "Mentor" : expRank === 3 ? "Achiever" : expRank === 2 ? "Leader" : "Starter";
    const actRankName = actualRank === 4 ? "Mentor" : actualRank === 3 ? "Achiever" : actualRank === 2 ? "Leader" : "Starter";

    const sStr = `${starterChildrenCount[i]}/2 ${isStarterCompleted[i] ? "DONE" : ""}`;
    const lStr = `${leaderProgress[i]}/4 ${isLeaderCompleted[i] ? "DONE" : ""}`;
    const aStr = `${achieverProgress[i]}/8 ${isAchieverCompleted[i] ? "DONE" : ""}`;

    console.log(
      `#${String(i).padEnd(2)} | ` +
      `${addr.slice(0, 8)}... | ` +
      `${sStr.padEnd(16)} | ` +
      `${lStr.padEnd(15)} | ` +
      `${aStr.padEnd(17)} | ` +
      `${expRankName.padEnd(19)} | ` +
      `${actRankName}`
    );
  }

  console.log("=========================================================================================");
  console.log(`TOTAL EXPECTED STARTER QUALIFIERS (2 Members): ${starterQualCount}`);
  console.log(`TOTAL EXPECTED LEADER QUALIFIERS (4 Starters at L2): ${leaderQualCount}`);
  console.log(`TOTAL EXPECTED ACHIEVER QUALIFIERS (8 Leaders at L3): ${achieverQualCount}`);
  console.log("=========================================================================================");
}

main().catch(console.error);
