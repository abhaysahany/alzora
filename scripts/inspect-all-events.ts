import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const proxyAddress = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
  const elzora = await ethers.getContractAt("ElzoraMain", proxyAddress);

  const totalUsers = await elzora.totalUsers();
  console.log("Total Users on BSC Mainnet:", totalUsers.toString());

  // Let's filter UserRegistered events on the proxy to get all registered users in chronological order!
  const filter = elzora.filters.UserRegistered();
  const currentBlock = await ethers.provider.getBlockNumber();
  // We deployed proxy around block 44000000 or recently
  const events = await elzora.queryFilter(filter, currentBlock - 4000, currentBlock);

  console.log(`Found ${events.length} UserRegistered events:`);
  events.forEach((ev: any, idx: number) => {
    console.log(`ID ${idx + 1}: ${ev.args.user} (Sponsor: ${ev.args.sponsor}, Parent: ${ev.args.parent}, Pos: ${ev.args.position})`);
  });
}

main().catch(console.error);
