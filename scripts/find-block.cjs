const { ethers } = require("ethers");
const ABI = require("../frontend/src/web3/ElzoraMain.abi.json");
const RPC = "https://bsc-mainnet.core.chainstack.com/3ad4bf7b2d982ea6ff8e91a5f3c765fb";
const ADDR = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ADDR, ABI, provider);

  const latest = await provider.getBlockNumber();
  console.log("Current block:", latest);

  // Binary search for when totalUsers >= 1
  let low = 134102306 - 20000;
  let high = 134102306;
  let startBlock = high;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    try {
      const count = await elzora.totalUsers({ blockTag: mid });
      if (Number(count) >= 1) {
        startBlock = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    } catch (e) {
      low = mid + 1;
    }
  }

  console.log("Block when 1st user was registered:", startBlock);
}

main().catch(console.error);
