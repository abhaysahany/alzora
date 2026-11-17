const { ethers } = require("ethers");
const ABI = require("../frontend/src/web3/ElzoraMain.abi.json");
const RPC = "https://bsc-mainnet.core.chainstack.com/3ad4bf7b2d982ea6ff8e91a5f3c765fb";
const ADDR = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ADDR, ABI, provider);

  const total = Number(await elzora.totalUsers());

  const users = [];
  for (let i = 1; i <= total; i++) {
    const addr = await elzora.globalMatrixUsers(i);
    const [u, inc] = await Promise.all([
      elzora.getUser(addr),
      elzora.getIncomeBreakdown(addr)
    ]);
    users.push({
      id: i,
      addr: addr.toLowerCase(),
      sponsor: u.sponsor.toLowerCase(),
      affiliatePaid: Number(ethers.formatUnits(inc.affiliateIncome, 18)),
      matchingPaid: Number(ethers.formatUnits(inc.matchingIncome, 18)),
      totalEarned: Number(ethers.formatUnits(u.totalIncomeEarned, 18))
    });
  }

  // Calculate exact expected Affiliate Income in 2xN Global Auto Matrix:
  // For each ID k (from 2 to total):
  // ancestor = Math.floor(k / 2)
  // lvl 1 to 10: $0.40
  // lvl 11 to 20: $0.30
  const expectedAffiliate = {};
  const downlineList = {};
  for (let i = 1; i <= total; i++) {
    expectedAffiliate[i] = 0;
    downlineList[i] = [];
  }

  for (let k = 2; k <= total; k++) {
    let ancestor = Math.floor(k / 2);
    let lvl = 1;
    while (ancestor >= 1 && lvl <= 20) {
      const rate = lvl <= 10 ? 0.40 : 0.30;
      expectedAffiliate[ancestor] = Math.round((expectedAffiliate[ancestor] + rate) * 100) / 100;
      downlineList[ancestor].push({ id: k, level: lvl, rate });
      ancestor = Math.floor(ancestor / 2);
      lvl++;
    }
  }

  console.log("====================================================================================================================");
  console.log("ID | Address       | Matrix Downlines | Matrix Expected | Actual Paid | Status        | Difference (To Reconcile)");
  console.log("====================================================================================================================");

  let totalUnderpaid = 0;
  let totalOverpaid = 0;

  for (const u of users) {
    const exp = expectedAffiliate[u.id];
    const paid = u.affiliatePaid;
    const diff = Math.round((paid - exp) * 100) / 100;

    let status = "PERFECT (OK)";
    let diffDisplay = "$0.00";

    if (diff < -0.001) {
      const under = Math.abs(diff);
      status = "UNDERPAID ⚠️";
      diffDisplay = `-$${under.toFixed(2)} (Needs Release)`;
      totalUnderpaid += under;
    } else if (diff > 0.001) {
      status = "OVERPAID ⚠️";
      diffDisplay = `+$${diff.toFixed(2)} (Needs Deduction)`;
      totalOverpaid += diff;
    }

    console.log(
      `#${String(u.id).padEnd(2)} | ` +
      `${u.addr.slice(0, 12)}... | ` +
      `${String(downlineList[u.id].length).padStart(8)} IDs     | ` +
      `$${exp.toFixed(2).padStart(8)}        | ` +
      `$${paid.toFixed(2).padStart(8)}   | ` +
      `${status.padEnd(14)}| ` +
      diffDisplay
    );
  }

  console.log("====================================================================================================================");
  console.log(`TOTAL AFFILIATE UNDERPAID (कम गई राशि जिसे रिलीज़ करना है): $${totalUnderpaid.toFixed(2)}`);
  console.log(`TOTAL AFFILIATE OVERPAID (ज़्यादा गई राशि जिसका माइनस प्रोविज़न करना है): $${totalOverpaid.toFixed(2)}`);
  console.log("====================================================================================================================");
}

main().catch(console.error);
