import { network } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("====================================================");
  console.log("🚀 COMPLETE CLEAN REDEPLOYMENT OF ELZORA PROTOCOL");
  console.log("====================================================");
  console.log("Deployer Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "tBNB");

  const paymentTokenAddress =
    process.env.USDT_TOKEN_ADDRESS ||
    process.env.VITE_USDT_CONTRACT_ADDRESS ||
    "0x90a1De2cC063786fC7e6C69514988cBb03E6665e"; // BSC Testnet USDT

  const treasuryWallet = process.env.TREASURY_WALLET || deployer.address;
  const rootAddress = process.env.ROOT_ID || deployer.address;

  console.log("Payment Token (USDT):", paymentTokenAddress);
  console.log("Treasury Wallet:     ", treasuryWallet);
  console.log("Root Address:        ", rootAddress);

  // Gas Price on BSC Testnet (min 3 gwei)
  const feeData = await ethers.provider.getFeeData();
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > ethers.parseUnits("3", "gwei")
      ? feeData.gasPrice
      : ethers.parseUnits("3", "gwei");

  console.log("Using Gas Price:     ", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // Step 1: Deploy ElzoraMain Implementation
  console.log("\n1. Deploying ElzoraMain Implementation...");
  const impl = await ethers.deployContract("ElzoraMain", [], { gasPrice });
  await impl.waitForDeployment();
  const implAddress = await impl.getAddress();
  console.log(">> Implementation Address: ", implAddress);

  // Step 2: Deploy ElzoraProxy & Initialize
  console.log("\n2. Deploying ElzoraProxy & Initializing...");
  const initData = impl.interface.encodeFunctionData("initialize", [
    deployer.address,
    paymentTokenAddress,
    treasuryWallet,
    rootAddress,
  ]);

  const proxy = await ethers.deployContract("ElzoraProxy", [implAddress, initData], { gasPrice });
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log(">> Elzora Proxy Address:   ", proxyAddress);

  // Step 3: Deploy ElzoraGateway
  console.log("\n3. Deploying ElzoraGateway...");
  const gateway = await ethers.deployContract("ElzoraGateway", [proxyAddress], { gasPrice });
  await gateway.waitForDeployment();
  const gatewayAddress = await gateway.getAddress();
  console.log(">> Gateway Address:        ", gatewayAddress);

  // Step 4: Authorize Gateway in ElzoraMain Proxy
  console.log("\n4. Authorizing Gateway in ElzoraMain...");
  const elzoraMain = await ethers.getContractAt("ElzoraMain", proxyAddress);
  const authTx = await elzoraMain.setGatewayContract(gatewayAddress, { gasPrice });
  console.log("Tx Sent:", authTx.hash, "- Waiting confirmation...");
  await authTx.wait();
  console.log(">> Gateway Authorized Successfully!");

  // Step 5: Verification & Checks
  console.log("\n5. Verifying Deployment...");
  const overview = await gateway.getProtocolOverview();
  const currMonth = await gateway.getCurrentMonthEpoch();
  const currWeek = await gateway.getCurrentWeeklyEpoch();

  console.log("====================================================");
  console.log("🎉 REDEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("====================================================");
  console.log("ElzoraMain Proxy:       ", proxyAddress);
  console.log("ElzoraMain Impl:        ", implAddress);
  console.log("ElzoraGateway:          ", gatewayAddress);
  console.log("Total Users:            ", overview.totalUsers.toString());
  console.log("Current Month Epoch:    ", currMonth.toString());
  console.log("Current Weekly Epoch:   ", currWeek.toString());
  console.log("Solvency Status:        ", overview.isSolvent ? "SOLVENT ✅" : "INSOLVENT ❌");
  console.log("====================================================");

  // Output env lines
  console.log("\n👉 Add these to .env:");
  console.log(`ELZORA_ADDRESS="${proxyAddress}"`);
  console.log(`VITE_ELZORA_ADDRESS="${proxyAddress}"`);
  console.log(`ELZORA_MAIN_ADDRESS="${proxyAddress}"`);
  console.log(`VITE_ELZORA_MAIN_ADDRESS="${proxyAddress}"`);
  console.log(`ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
  console.log(`VITE_ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
}

main().catch((error) => {
  console.error("Redeployment failed:", error);
  process.exitCode = 1;
});

