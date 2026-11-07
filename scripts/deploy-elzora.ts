import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("====================================================");
  console.log("🚀 DEPLOYING ELZORA SMART CONTRACT SYSTEM");
  console.log("====================================================");
  console.log("Deployer Wallet:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Native Balance:", ethers.formatEther(balance), "BNB");

  // Determine Payment Token Address (BEP20 USDT)
  const paymentTokenAddress =
    process.env.USDT_TOKEN_ADDRESS ||
    process.env.VITE_USDT_CONTRACT_ADDRESS ||
    "0x90a1De2cC063786fC7e6C69514988cBb03E6665e"; // BSC Testnet USDT

  const treasuryWallet = process.env.TREASURY_WALLET || deployer.address;
  const rootAddress = process.env.ROOT_ID || deployer.address;

  console.log("\nConfigured BEP-20 USDT Token:", paymentTokenAddress);
  console.log("Configured Treasury Wallet:   ", treasuryWallet);
  console.log("Configured Root Referral ID:  ", rootAddress);

  // 1. Deploy ElzoraMain
  console.log("\n1. Deploying ElzoraMain Core Contract...");
  const elzoraMain = await ethers.deployContract("ElzoraMain", [
    deployer.address,
    paymentTokenAddress,
    treasuryWallet,
    rootAddress,
  ]);
  await elzoraMain.waitForDeployment();
  const mainAddress = await elzoraMain.getAddress();
  console.log(">> ElzoraMain Deployed at:    ", mainAddress);

  // 2. Deploy ElzoraGateway
  console.log("\n2. Deploying ElzoraGateway Router & Aggregator...");
  const elzoraGateway = await ethers.deployContract("ElzoraGateway", [
    mainAddress,
  ]);
  await elzoraGateway.waitForDeployment();
  const gatewayAddress = await elzoraGateway.getAddress();
  console.log(">> ElzoraGateway Deployed at: ", gatewayAddress);

  // 3. Link Gateway in ElzoraMain
  console.log("\n3. Authorizing ElzoraGateway in ElzoraMain...");
  const authTx = await elzoraMain.setGatewayContract(gatewayAddress);
  await authTx.wait();
  console.log(">> Gateway Authorized Successfully!");

  // 4. Verification & Protocol Stats Check
  const stats = await elzoraGateway.getProtocolOverview();

  console.log("\n====================================================");
  console.log("🎉 ELZORA DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("====================================================");
  console.log("ElzoraMain (Core Business Logic): ", mainAddress);
  console.log("ElzoraGateway (Frontend Router):  ", gatewayAddress);
  console.log("Payment Token (USDT):             ", stats.paymentToken);
  console.log("Treasury Wallet:                  ", stats.treasuryWallet);
  console.log("Root Member Address:              ", stats.rootAddress);
  console.log("Contract Solvency Status:         ", stats.isSolvent ? "SOLVENT ✅" : "INSOLVENT ❌");
  console.log("Registration Package Price:       $50 USDT");
  console.log("Global Club Entry Price:          $25 USDT");
  console.log("====================================================");
  console.log("\n👉 Add these environment variables to your .env file:");
  console.log(`ELZORA_MAIN_ADDRESS="${mainAddress}"`);
  console.log(`ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
  console.log(`VITE_ELZORA_MAIN_ADDRESS="${mainAddress}"`);
  console.log(`VITE_ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
}

main().catch((error) => {
  console.error("ELZORA Deployment failed:", error);
  process.exitCode = 1;
});

