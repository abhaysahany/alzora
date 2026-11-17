const { ethers } = require("ethers");
const ABI = require("../frontend/src/web3/ElzoraMain.abi.json");
const RPC = "https://bsc-dataseed.binance.org";
const ADDR = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ADDR, ABI, provider);
  const total = Number(await elzora.totalUsers());
  console.log(`Total users registered on mainnet: ${total}\n`);

  const users = [];
  const addrToId = {};

  for (let i = 1; i <= total; i++) {
    const addr = await elzora.globalMatrixUsers(i);
    addrToId[addr.toLowerCase()] = i;
    const [u, inc] = await Promise.all([
      elzora.getUser(addr),
      elzora.getIncomeBreakdown(addr)
    ]);

    users.push({
      id: i,
      addr: addr.toLowerCase(),
      sponsor: u.sponsor.toLowerCase(),
      parent: u.parent.toLowerCase(),
      leftChild: u.leftChild.toLowerCase(),
      rightChild: u.rightChild.toLowerCase(),
      affiliatePaid: Number(ethers.formatUnits(inc.affiliateIncome, 18)),
      matchingPaid: Number(ethers.formatUnits(inc.matchingIncome, 18)),
      directPaid: Number(ethers.formatUnits(inc.directIncome, 18))
    });
  }

  // Calculate expected Affiliate Income according to 2xN Global Matrix
  // In 2xN Global Matrix: Parent of ID k is Math.floor(k / 2)
  // When ID k joins (k >= 2):
  // ancestor = Math.floor(k / 2)
  // lvl = 1 -> ancestor
  // lvl = 2 -> ancestor / 2
  // up to 20 levels.
  // Level 1-10: $0.40
  // Level 11-20: $0.30

  const expectedAffiliate = {};
  const matrixDownlineCount = {};
  for (let i = 1; i <= total; i++) {
    expectedAffiliate[i] = 0;
    matrixDownlineCount[i] = 0;
  }

  for (let k = 2; k <= total; k++) {
    let ancestor = Math.floor(k / 2);
    let lvl = 1;
    while (ancestor >= 1 && lvl <= 20) {
      const rate = lvl <= 10 ? 0.40 : 0.30;
      expectedAffiliate[ancestor] += rate;
      matrixDownlineCount[ancestor] += 1;
      ancestor = Math.floor(ancestor / 2);
      lvl++;
    }
  }

  // Also calculate what Sponsor-based affiliate would have been
  const expectedSponsorAffiliate = {};
  for (let i = 1; i <= total; i++) expectedSponsorAffiliate[i] = 0;

  for (let k = 2; k <= total; k++) {
    const user = users[k - 1];
    let curr = user.sponsor;
    let lvl = 1;
    while (curr !== ethers.ZeroAddress && addrToId[curr] && lvl <= 20) {
      const spId = addrToId[curr];
      const rate = lvl <= 10 ? 0.40 : 0.30;
      expectedSponsorAffiliate[spId] += rate;
      curr = users[spId - 1].sponsor;
      lvl++;
    }
  }

  console.log("---------------------------------------------------------------------------------------------------------------------");
  console.log("ID | Address     | Sponsor ID | Matrix Downline | Expected Affiliate (Matrix) | Actual Paid | Diff | If Sponsor-Based");
  console.log("---------------------------------------------------------------------------------------------------------------------");

  for (const u of users) {
    const spId = addrToId[u.sponsor] || "Root/None";
    const exp = expectedAffiliate[u.id];
    const paid = u.affiliatePaid;
    const diff = paid - exp;
    const diffStr = diff === 0 ? "OK" : diff > 0 ? `+${diff.toFixed(2)} OVER` : `${diff.toFixed(2)} UNDER`;
    const spExp = expectedSponsorAffiliate[u.id];

    console.log(
      `${String(u.id).padStart(2)} | ` +
      `${u.addr.slice(0, 10)}... | ` +
      `${String(spId).padEnd(10)} | ` +
      `${String(matrixDownlineCount[u.id]).padStart(15)} | ` +
      `$${exp.toFixed(2).padStart(25)} | ` +
      `$${paid.toFixed(2).padStart(9)} | ` +
      `${diffStr.padEnd(14)} | ` +
      `$${spExp.toFixed(2)}`
    );
  }
}

main().catch(console.error);
