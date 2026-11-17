const { ethers } = require("ethers");
const ABI = require("../frontend/src/web3/ElzoraMain.abi.json");
const RPC = "https://bsc-mainnet.core.chainstack.com/3ad4bf7b2d982ea6ff8e91a5f3c765fb";
const ADDR = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ADDR, ABI, provider);

  const total = Number(await elzora.totalUsers());

  // Let's find block for user k
  async function findUserBlock(k) {
    let low = 130000000;
    let high = 134108927;
    let found = high;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      try {
        const count = await elzora.totalUsers({ blockTag: mid });
        if (Number(count) >= k) {
          found = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      } catch (e) {
        low = mid + 1;
      }
    }
    return found;
  }

  const b1 = await findUserBlock(1);
  const b2 = await findUserBlock(2);
  const b10 = await findUserBlock(10);
  const b23 = await findUserBlock(23);
  const b24 = await findUserBlock(24);

  console.log(`User 1 block: ${b1}`);
  console.log(`User 2 block: ${b2}`);
  console.log(`User 10 block: ${b10}`);
  console.log(`User 23 block: ${b23}`);
  console.log(`User 24 block: ${b24}`);
}

main().catch(console.error);
