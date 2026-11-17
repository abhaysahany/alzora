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

  const startBlock = 134082000;
  const endBlock = 134095000;
  const chunkSize = 2000;

  console.log(`Querying chunked events from ${startBlock} to ${endBlock}...`);

  const regEvents = [];
  const affEvents = [];

  for (let b = startBlock; b < endBlock; b += chunkSize) {
    const to = Math.min(b + chunkSize - 1, endBlock);
    const [r, a] = await Promise.all([
      elzora.queryFilter(elzora.filters.UserRegistered(), b, to),
      elzora.queryFilter(elzora.filters.AffiliateIncomePaid(), b, to)
    ]);
    regEvents.push(...r);
    affEvents.push(...a);
  }

  console.log(`\nFound ${regEvents.length} UserRegistered events:`);
  regEvents.forEach((ev, idx) => {
    const u = ev.args[0].toLowerCase();
    const sp = ev.args[1].toLowerCase();
    const par = ev.args[2].toLowerCase();
    const pos = ev.args[3];
    console.log(`[Registered] ID #${addrToId[u] || idx+1} | Sponsor: ID #${addrToId[sp] || sp} | Parent: ID #${addrToId[par] || par} | Pos: ${pos}`);
  });

  console.log(`\nFound ${affEvents.length} AffiliateIncomePaid events:`);
  affEvents.forEach((ev) => {
    const recipient = ev.args[0].toLowerCase();
    const buyer = ev.args[1].toLowerCase();
    const lvl = ev.args[2].toString();
    const amt = ethers.formatUnits(ev.args[3], 18);
    const recId = addrToId[recipient] || recipient;
    const buyerId = addrToId[buyer] || buyer;

    console.log(`[Affiliate Paid] Buyer ID #${buyerId} -> Recipient ID #${recId} (Level ${lvl}): $${amt}`);
  });
}

main().catch(console.error);
