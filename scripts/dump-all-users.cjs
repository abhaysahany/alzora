const { ethers } = require('ethers');
const ELZORA_MAIN_ABI = require('../frontend/src/web3/ElzoraMain.abi.json');

const RPC = 'https://bsc-dataseed.binance.org';
const ELZORA_ADDR = '0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C';

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ELZORA_ADDR, ELZORA_MAIN_ABI, provider);

  const count = await elzora.getGlobalMatrixUsersCount();
  console.log(`Total registered users: ${count}`);

  for (let i = 1; i <= count; i++) {
    const addr = await elzora.globalMatrixUsers(i);
    const u = await elzora.getUser(addr);
    let mId = 0;
    try { mId = await elzora.addressToMemberId(addr); } catch(e){}
    console.log(`[#${i}] Member ${mId}: ${addr}`);
    console.log(`     Sponsor: ${u.sponsor}`);
    console.log(`     Binary Parent: ${u.parent}, Position: ${u.position} (1=Left, 2=Right)`);
    console.log(`     Left Child: ${u.leftChild}, Right Child: ${u.rightChild}`);
    console.log(`     Directs: ${u.directCount} (L:${u.leftDirectCount}, R:${u.rightDirectCount})`);
    console.log(`     Team: L:${u.leftTeamCount}, R:${u.rightTeamCount} | Carry: L:${u.leftCarryVolume}, R:${u.rightCarryVolume}`);
    console.log(`     Earned: ${ethers.formatUnits(u.totalIncomeEarned, 18)} USDT`);
  }
}

main().catch(console.error);
