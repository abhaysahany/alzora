const { ethers } = require("ethers");
const ABI = require("../frontend/src/web3/ElzoraMain.abi.json");
const RPC = "https://bsc-mainnet.core.chainstack.com/3ad4bf7b2d982ea6ff8e91a5f3c765fb";
const ADDR = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ADDR, ABI, provider);

  const total = Number(await elzora.totalUsers());
  console.log(`Auditing Club Matrix on Mainnet for ${total} users...\n`);

  const users = [];
  const addrToId = {};

  for (let i = 1; i <= total; i++) {
    const addr = await elzora.globalMatrixUsers(i);
    addrToId[addr.toLowerCase()] = i;
  }

  for (let i = 1; i <= total; i++) {
    const addr = await elzora.globalMatrixUsers(i);
    const [u, inc] = await Promise.all([
      elzora.getUser(addr),
      elzora.getIncomeBreakdown(addr)
    ]);

    // Query club progress for ranks 0 (Starter), 1 (Leader), 2 (Achiever)
    const [p0, c0, p1, c1, p2, c2] = await Promise.all([
      elzora.getUserClubProgress(addr, 0),
      elzora.userRankCompleted(addr, 0),
      elzora.getUserClubProgress(addr, 1),
      elzora.userRankCompleted(addr, 1),
      elzora.getUserClubProgress(addr, 2),
      elzora.userRankCompleted(addr, 2),
    ]);

    users.push({
      id: i,
      addr: addr.toLowerCase(),
      sponsor: u.sponsor.toLowerCase(),
      parent: u.parent.toLowerCase(),
      leftChild: u.leftChild.toLowerCase(),
      rightChild: u.rightChild.toLowerCase(),
      currentRank: Number(u.currentRank),
      clubIncomePaid: Number(ethers.formatUnits(inc.clubIncome, 18)),
      starterProgress: Number(p0),
      starterCompleted: c0,
      leaderProgress: Number(p1),
      leaderCompleted: c1,
      achieverProgress: Number(p2),
      achieverCompleted: c2,
      directCount: Number(u.directCount),
      leftTeam: Number(u.leftTeamCount),
      rightTeam: Number(u.rightTeamCount)
    });
  }

  console.log("------------------------------------------------------------------------------------------------------------------");
  console.log("ID | Address     | Sponsor | Parent  | Rank | Club $ | Starter (Req 2) | Leader (Req 4) | Achiever (Req 8)");
  console.log("------------------------------------------------------------------------------------------------------------------");

  for (const u of users) {
    const spId = addrToId[u.sponsor] || (u.id === 1 ? "None" : u.sponsor.slice(0, 6));
    const parId = addrToId[u.parent] || (u.id === 1 ? "None" : u.parent.slice(0, 6));

    const sStatus = `${u.starterProgress}/2 ${u.starterCompleted ? "COMPLETED" : "InProg"}`;
    const lStatus = `${u.leaderProgress}/4 ${u.leaderCompleted ? "COMPLETED" : "InProg"}`;
    const aStatus = `${u.achieverProgress}/8 ${u.achieverCompleted ? "COMPLETED" : "InProg"}`;

    const rankName = u.currentRank === 1 ? "Starter" : u.currentRank === 2 ? "Leader" : u.currentRank === 3 ? "Achiever" : `Rank ${u.currentRank}`;

    console.log(
      `${String(u.id).padStart(2)} | ` +
      `${u.addr.slice(0, 10)}... | ` +
      `${String(spId).padEnd(7)} | ` +
      `${String(parId).padEnd(7)} | ` +
      `${rankName.padEnd(8)} | ` +
      `$${u.clubIncomePaid.toFixed(2).padStart(6)} | ` +
      `${sStatus.padEnd(16)} | ` +
      `${lStatus.padEnd(15)} | ` +
      `${aStatus}`
    );
  }

  console.log("\n==================================================================================================================");
  console.log("ANALYSIS OF HOW MEMBERS WERE PLACED AND PROGRESSED:");
  console.log("==================================================================================================================");

  // Check children under each parent in Binary/Personal tree:
  const parentChildrenMap = {};
  for (let i = 1; i <= total; i++) parentChildrenMap[i] = [];

  for (let i = 2; i <= total; i++) {
    const u = users[i - 1];
    const pId = addrToId[u.parent];
    if (pId) {
      parentChildrenMap[pId].push(u.id);
    }
  }

  for (let i = 1; i <= total; i++) {
    const ch = parentChildrenMap[i];
    if (ch.length > 0) {
      console.log(`ID #${i} has direct binary children: [${ch.join(", ")}] (Count: ${ch.length})`);
    }
  }
}

main().catch(console.error);
