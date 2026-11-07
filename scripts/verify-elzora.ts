import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  const mainAddress =
    process.env.ELZORA_MAIN_ADDRESS ||
    process.env.VITE_ELZORA_MAIN_ADDRESS ||
    process.env.ELZORA_ADDRESS ||
    process.env.VITE_ELZORA_ADDRESS;
  const gatewayAddress =
    process.env.ELZORA_GATEWAY_ADDRESS ||
    process.env.VITE_ELZORA_GATEWAY_ADDRESS;

  if (!mainAddress || !gatewayAddress) {
    throw new Error("Missing ELZORA_MAIN_ADDRESS or ELZORA_GATEWAY_ADDRESS in .env");
  }

  const paymentTokenAddress =
    process.env.USDT_TOKEN_ADDRESS ||
    process.env.VITE_USDT_CONTRACT_ADDRESS ||
    "0x90a1De2cC063786fC7e6C69514988cBb03E6665e";
  const treasuryWallet = process.env.TREASURY_WALLET || deployer.address;
  const rootAddress = process.env.ROOT_ID || deployer.address;

  console.log("====================================================");
  console.log("🔍 VERIFYING ELZORA SMART CONTRACTS ON BSCSCAN");
  console.log("====================================================");
  console.log("ElzoraMain:   ", mainAddress);
  console.log("ElzoraGateway:", gatewayAddress);
  console.log("====================================================");
  console.log("\nTo verify on BscScan, run:");
  console.log(`npx hardhat verify --network bscTestnet ${mainAddress} "${deployer.address}" "${paymentTokenAddress}" "${treasuryWallet}" "${rootAddress}"`);
  console.log(`npx hardhat verify --network bscTestnet ${gatewayAddress} "${mainAddress}"`);
}

main().catch((error) => {
  console.error("Verification helper failed:", error);
  process.exitCode = 1;
});

