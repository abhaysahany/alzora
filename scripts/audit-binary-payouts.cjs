const { ethers } = require("ethers");
const ELZORA_MAIN_ABI = require("../frontend/src/web3/ElzoraMain.abi.json");

const ELZORA_ADDR = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
const RPC = "https://bsc-dataseed.binance.org";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ELZORA_ADDR, ELZORA_MAIN_ABI, provider);

  const count = await elzora.getGlobalMatrixUsersCount();
  console.log(`Total registered users: ${count}`);

  for (let i = 1; i <= Math.min(10, Number(count)); i++) {
    const addr = await elzora.globalMatrixUsers(i);
    const [u, inc] = await Promise.all([
      elzora.getUser(addr),
      elzora.getIncomeBreakdown(addr)
    ]);

    let pendingDeduction = "0.00";
    try {
      const p = await elzora.pendingIncomeDeduction(addr);
      pendingDeduction = ethers.formatUnits(p, 18);
    } catch (e) {
      pendingDeduction = "NOT_ON_CHAIN_YET";
    }

    const matchPaid = Number(ethers.formatUnits(inc.matchingIncome, 18));
    const paidPairs = matchPaid / 2;

    console.log(`\n========================================`);
    console.log(`[ID #${i}] Wallet: ${addr}`);
    console.log(`  Binary Matching Paid So Far: $${matchPaid.toFixed(2)} (${paidPairs} pairs)`);
    console.log(`  Team Volumes: Left = ${u.leftTeamCount.toString()}, Right = ${u.rightTeamCount.toString()}`);
    console.log(`  Carry Volumes: Left = ${u.leftCarryVolume.toString()}, Right = ${u.rightCarryVolume.toString()}`);
    console.log(`  Directs: Total = ${u.directCount.toString()} (Left = ${u.leftDirectCount.toString()}, Right = ${u.rightDirectCount.toString()})`);
    console.log(`  Pending Deduction on Mainnet: ${pendingDeduction}`);
  }
}

main().catch(console.error);
