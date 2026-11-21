import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const TREASURY_ADDRESS = "0x067c2aa4C1576388F835C160E79Db88ebE02Ee92";
const SWEEP_AMOUNT_USDT = "174.8"; // Exact undistributed dead surplus

async function main() {
  console.log("=========================================================================");
  console.log("Sweeping Undistributed Dead Surplus to Treasury (Preserving Active Pools)");
  console.log("=========================================================================");

  const { ethers } = await network.create({
    network: "bscMainnet",
  });

  const [signer] = await ethers.getSigners();
  console.log("Operator / Owner Wallet:", signer.address);

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("3", "gwei");

  const ElzoraMainFactory = await ethers.getContractFactory("ElzoraMain");
  const contract = ElzoraMainFactory.attach(PROXY_ADDRESS) as any;

  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];
  const usdt = new ethers.Contract(USDT_ADDRESS, erc20Abi, ethers.provider);

  const beforeProxyBal = await usdt.balanceOf(PROXY_ADDRESS);
  const beforeTreasuryBal = await usdt.balanceOf(TREASURY_ADDRESS);
  console.log("\nBefore Sweep:");
  console.log("Proxy USDT Balance:   ", ethers.formatEther(beforeProxyBal), "USDT");
  console.log("Treasury USDT Balance:", ethers.formatEther(beforeTreasuryBal), "USDT");

  const amountToSweep = ethers.parseUnits(SWEEP_AMOUNT_USDT, 18);
  console.log(`\nExecuting emergencyRescue of ${SWEEP_AMOUNT_USDT} USDT to Treasury...`);

  const tx = await contract.emergencyRescue(
    USDT_ADDRESS,
    TREASURY_ADDRESS,
    amountToSweep,
    { gasPrice }
  );
  console.log("Transaction sent! Hash:", tx.hash);
  console.log("Waiting for confirmation on BSC Mainnet...");
  const receipt = await tx.wait();
  console.log("✅ Confirmed in block:", receipt?.blockNumber);

  const afterProxyBal = await usdt.balanceOf(PROXY_ADDRESS);
  const afterTreasuryBal = await usdt.balanceOf(TREASURY_ADDRESS);
  console.log("\nAfter Sweep:");
  console.log("Proxy USDT Balance:   ", ethers.formatEther(afterProxyBal), "USDT (Preserves active Club, Milestones & Pools!)");
  console.log("Treasury USDT Balance:", ethers.formatEther(afterTreasuryBal), "USDT");
  console.log("\n=========================================================================");
  console.log("✅ Successfully swept undistributed funds to Treasury!");
  console.log("=========================================================================");
}

main().catch((error) => {
  console.error("Sweep failed:", error);
  process.exitCode = 1;
});
