const { ethers } = require("ethers");
const ABI = require("../frontend/src/web3/ElzoraMain.abi.json");
const RPC = "https://bsc-mainnet.core.chainstack.com/3ad4bf7b2d982ea6ff8e91a5f3c765fb";
const ADDR = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ADDR, ABI, provider);

  const total = Number(await elzora.totalUsers());
  const addrToId = {};
  for (let i = 1; i <= total; i++) {
    const addr = await elzora.globalMatrixUsers(i);
    addrToId[addr.toLowerCase()] = i;
  }

  // Check event logs across blocks 133345000 to 134105000
  // in 4000 block chunks
  const ranges = [
    [133348000, 133372000],
    [134070000, 134080000],
    [134100000, 134105000]
  ];

  console.log("Fetching UserRegistered events across known ranges...");
  const events = [];

  for (const [start, end] of ranges) {
    for (let b = start; b < end; b += 3000) {
      const to = Math.min(b + 2999, end);
      try {
        const evs = await elzora.queryFilter(elzora.filters.UserRegistered(), b, to);
        if (evs.length > 0) events.push(...evs);
      } catch (e) {}
    }
  }

  console.log(`Found ${events.length} UserRegistered events:`);
  for (const ev of events) {
    const u = ev.args[0].toLowerCase();
    const sp = ev.args[1].toLowerCase();
    const par = ev.args[2].toLowerCase();
    const pos = Number(ev.args[3]);
    console.log(`[Reg Event] User ID #${addrToId[u]} | Sponsor ID #${addrToId[sp] || sp} | Parent ID #${addrToId[par] || par} | Pos: ${pos === 1 ? 'Left' : pos === 2 ? 'Right' : 'None'}`);
  }
}

main().catch(console.error);
