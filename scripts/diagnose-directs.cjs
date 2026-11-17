const { ethers } = require('ethers');
const ELZORA_MAIN_ABI = require('../frontend/src/web3/ElzoraMain.abi.json');

const USER_ADDRESS = '0xd3badaa69584cca5139e876fac49e68b4b07635c';
const RPC = 'https://bsc-dataseed.binance.org';
const ELZORA_ADDR = '0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C';

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ELZORA_ADDR, ELZORA_MAIN_ABI, provider);

  const directs = await elzora.getDirectReferrals(USER_ADDRESS);
  console.log(`Direct Referrals of ${USER_ADDRESS}: ${directs.length}`);

  for (let i = 0; i < directs.length; i++) {
    const d = directs[i];
    const user = await elzora.getUser(d);
    let mId = 0;
    try { mId = await elzora.addressToMemberId(d); } catch(e){}
    console.log(`\nDirect #${i+1}: ${d} (Member ID: ${mId})`);
    console.log(`  Sponsor:       ${user.sponsor}`);
    console.log(`  Binary Parent: ${user.parent}`);
    console.log(`  Position:      ${user.position === 1 ? 'Left' : user.position === 2 ? 'Right' : 'None'}`);
    console.log(`  Left Child:    ${user.leftChild}`);
    console.log(`  Right Child:   ${user.rightChild}`);
  }

  // Check user rank & club progress
  console.log('\n--- Club Progress ---');
  for (let r = 0; r < 8; r++) {
    const prog = await elzora.userClubProgress(USER_ADDRESS, r);
    const done = await elzora.userRankCompleted(USER_ADDRESS, r);
    const cfg = await elzora.clubRanks(r);
    console.log(`Rank ${r} (${cfg.rankName}): Progress ${prog}/${cfg.requiredMembers}, Completed: ${done}`);
  }
}

main().catch(console.error);
