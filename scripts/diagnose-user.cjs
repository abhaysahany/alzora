const { ethers } = require('ethers');
const ELZORA_MAIN_ABI = require('../frontend/src/web3/ElzoraMain.abi.json');
const GATEWAY_ABI = require('../frontend/src/web3/ElzoraGateway.abi.json');

const USER_ADDRESS = '0xd3badaa69584cca5139e876fac49e68b4b07635c';

const NETWORKS = [
  {
    name: 'BSC Mainnet',
    rpc: 'https://bsc-dataseed.binance.org',
    elzora: '0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C',
    gateway: '0x002cB5BbD07163DEf13c41bFaE034866E5d23b5B'
  },
  {
    name: 'BSC Testnet',
    rpc: 'https://bsc-testnet.publicnode.com',
    elzora: '0xf21b249b1040d8435Bc13B3d5Aeffe782F0B2B17',
    gateway: '0xB900a1418728d5f3b98D96E8e26B2beA2A89b8D8'
  }
];

async function checkNetwork(net) {
  console.log(`\n========================================`);
  console.log(`Checking on ${net.name}`);
  console.log(`Contract: ${net.elzora}`);
  console.log(`Gateway:  ${net.gateway}`);
  console.log(`========================================`);

  const provider = new ethers.JsonRpcProvider(net.rpc);
  const elzora = new ethers.Contract(net.elzora, ELZORA_MAIN_ABI, provider);
  const gateway = new ethers.Contract(net.gateway, GATEWAY_ABI, provider);

  try {
    const user = await elzora.getUser(USER_ADDRESS);
    console.log(`Registered: ${user.isRegistered}`);
    if (!user.isRegistered) {
      console.log('User is NOT registered on this contract/network.');
      return;
    }

    let memberId = 0;
    try {
      memberId = await elzora.addressToMemberId(USER_ADDRESS);
    } catch (e) {
      try { memberId = await gateway.getMemberIdByAddress(USER_ADDRESS); } catch (e2) {}
    }

    const directs = await elzora.getDirectReferrals(USER_ADDRESS);
    const breakdown = await elzora.getIncomeBreakdown(USER_ADDRESS);
    const isExempt = await elzora.isExemptFromDirects(USER_ADDRESS);
    let isChampion = false;
    try { isChampion = await elzora.isChampionMember(USER_ADDRESS); } catch(e){}

    console.log(`\n--- Member Profile ---`);
    console.log(`User Address:        ${user.userAddress}`);
    console.log(`Member ID:           ${memberId}`);
    console.log(`Sponsor:             ${user.sponsor}`);
    console.log(`Parent (Binary):     ${user.parent}`);
    console.log(`Position:            ${user.position} (0=None, 1=Left, 2=Right)`);
    console.log(`Left Child:          ${user.leftChild}`);
    console.log(`Right Child:         ${user.rightChild}`);
    console.log(`Direct Count:        ${user.directCount} (Array length: ${directs.length})`);
    console.log(`Left Direct Count:   ${user.leftDirectCount}`);
    console.log(`Right Direct Count:  ${user.rightDirectCount}`);
    console.log(`Left Team Count:     ${user.leftTeamCount}`);
    console.log(`Right Team Count:    ${user.rightTeamCount}`);
    console.log(`Left Carry Volume:   ${user.leftCarryVolume}`);
    console.log(`Right Carry Volume:  ${user.rightCarryVolume}`);
    console.log(`Current Rank:        ${user.currentRank}`);
    console.log(`Total Earned:        ${ethers.formatUnits(user.totalIncomeEarned, 18)} USDT`);
    console.log(`Exempt From Directs: ${isExempt}`);
    console.log(`Champion Member:     ${isChampion}`);

    console.log(`\n--- Income Breakdown ---`);
    console.log(`Direct Income:       ${ethers.formatUnits(breakdown[0], 18)} USDT`);
    console.log(`Matching (Binary):   ${ethers.formatUnits(breakdown[1], 18)} USDT`);
    console.log(`Affiliate Matrix:    ${ethers.formatUnits(breakdown[2], 18)} USDT`);
    console.log(`Personal Team Club:  ${ethers.formatUnits(breakdown[3], 18)} USDT`);
    console.log(`Single Leg Club:     ${ethers.formatUnits(breakdown[4], 18)} USDT`);
    console.log(`Booster Income:      ${ethers.formatUnits(breakdown[5], 18)} USDT`);
    console.log(`Royalty Income:      ${ethers.formatUnits(breakdown[6], 18)} USDT`);
    console.log(`Rewards Income:      ${ethers.formatUnits(breakdown[7], 18)} USDT`);
    if (breakdown.length > 8) {
      console.log(`Missed Income:       ${ethers.formatUnits(breakdown[8], 18)} USDT`);
    }

    console.log(`\n--- Club Ranks (0 to 7) ---`);
    for (let r = 0; r < 8; r++) {
      try {
        const prog = await elzora.userClubProgress(USER_ADDRESS, r);
        const done = await elzora.userRankCompleted(USER_ADDRESS, r);
        const cfg = await elzora.clubRanks(r);
        console.log(`Rank ${r} (${cfg.rankName}): Progress ${prog}/${cfg.requiredMembers}, Completed: ${done}, NetProfit: ${cfg.netProfit}`);
      } catch (e) {
        console.log(`Rank ${r} query failed: ${e.message}`);
      }
    }

    console.log(`\n--- Direct Referrals (${directs.length}) ---`);
    for (let i = 0; i < directs.length; i++) {
      const dAddr = directs[i];
      try {
        const dUser = await elzora.getUser(dAddr);
        let dMid = 0;
        try { dMid = await elzora.addressToMemberId(dAddr); } catch(e){}
        console.log(`Direct #${i + 1}: ${dAddr} (Member ID: ${dMid})`);
        console.log(`   Parent: ${dUser.parent}`);
        console.log(`   Position under Parent: ${dUser.position} (1=Left, 2=Right)`);
        console.log(`   Left Child: ${dUser.leftChild}, Right Child: ${dUser.rightChild}`);
        console.log(`   Left Team: ${dUser.leftTeamCount}, Right Team: ${dUser.rightTeamCount}`);
      } catch (e) {
        console.log(`Direct #${i + 1}: ${dAddr} (error: ${e.message})`);
      }
    }

  } catch (err) {
    console.error(`Error on ${net.name}:`, err.message);
  }
}

async function main() {
  for (const net of NETWORKS) {
    await checkNetwork(net);
  }
}

main();
