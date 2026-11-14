import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const proxyAddress = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
  const elzora = await ethers.getContractAt("ElzoraMain", proxyAddress);

  const u16 = "0xeAdF33D5482078CeA1492430E6cC0aeF9Ffe80eC";
  const u17 = "0xd3BadAa69584CCA5139e876Fac49E68B4B07635C";

  console.log("Profile User 16:", await elzora.getUser(u16));
  console.log("Profile User 17:", await elzora.getUser(u17));
}

main().catch(console.error);

