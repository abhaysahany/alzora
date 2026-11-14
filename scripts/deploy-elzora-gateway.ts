import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("====================================================");
  console.log("2. DEPLOYING ELZORA GATEWAY (NON-UPGRADEABLE ROUTER)");
  console.log("====================================================");
  console.log("Deployer Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Native Balance:", ethers.formatEther(balance), "BNB");

  const mainProxyAddress =
    process.env.ELZORA_MAIN_ADDRESS ||
    process.env.VITE_ELZORA_MAIN_ADDRESS ||
    process.env.ELZORA_ADDRESS ||
    process.env.VITE_ELZORA_ADDRESS;

  if (!mainProxyAddress || mainProxyAddress === "") {
    throw new Error(
      "Missing ELZORA_MAIN_ADDRESS in .env! Please deploy ElzoraMain first (scripts/deploy-elzora-main.ts) and set ELZORA_MAIN_ADDRESS in .env"
    );
  }

  console.log("\nTarget ElzoraMain Proxy Address:", mainProxyAddress);

  // Determine BSC gas price (1.1 gwei on Mainnet; 3 gwei on testnet)
  const net = await ethers.provider.getNetwork();
  const feeData = await ethers.provider.getFeeData();
  const minGwei = Number(net.chainId) === 56 ? "1.1" : "3.0";
  const minGasPrice = ethers.parseUnits(minGwei, "gwei");
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > minGasPrice ? feeData.gasPrice : minGasPrice;

  console.log("Using Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // 1. Always Deploy a Fresh ElzoraGateway linked to current Main Proxy
  console.log("\nDeploying fresh ElzoraGateway Router & Aggregator...");
  const gateway = await ethers.deployContract("ElzoraGateway", [mainProxyAddress], {
    gasPrice,
  });
  await gateway.waitForDeployment();
  const gatewayAddress = await gateway.getAddress();
  console.log(">> ElzoraGateway Deployed at: ", gatewayAddress);

  // 2. Authorize Gateway in ElzoraMain
  console.log("\nAuthorizing ElzoraGateway in ElzoraMain Proxy...");
  const elzoraMain = await ethers.getContractAt("ElzoraMain", mainProxyAddress);
  const authTx = await elzoraMain.setGatewayContract(gatewayAddress, {
    gasPrice,
  });
  console.log("Tx Sent:", authTx.hash, "- Waiting for confirmation...");
  await authTx.wait();
  console.log(">> Gateway Authorized in ElzoraMain Successfully!");

  // 3. Overview Verification
  const overview = await gateway.getProtocolOverview();

  console.log("\n====================================================");
  console.log("🎉 ELZORA GATEWAY DEPLOYMENT COMPLETE:");
  console.log("====================================================");
  console.log("Gateway Address:               ", gatewayAddress);
  console.log("Linked ElzoraMain Proxy:       ", mainProxyAddress);
  console.log("Payment Token:                 ", overview.paymentToken);
  console.log("Solvency Status:               ", overview.isSolvent ? "SOLVENT ✅" : "INSOLVENT ❌");
  console.log("====================================================");
  console.log("\n👉 Add these lines to your .env / frontend env:");
  console.log(`ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
  console.log(`VITE_ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
}

main().catch((error) => {
  console.error("Gateway deployment failed:", error);
  process.exitCode = 1;
});
//Testnet
// ====================================================
// 🎉 ELZORA GATEWAY DEPLOYMENT COMPLETE:
// ====================================================
// Gateway Address:                0xE1f52AEE54AE7D25A841bA787E59bbcA956c1c80
// Linked ElzoraMain Proxy:        0x3290Fe9b7FF7C801FC1351957F81C974eC560Ec2
// Payment Token:                  0x90a1De2cC063786fC7e6C69514988cBb03E6665e
// Solvency Status:                SOLVENT ✅
// ====================================================\


// Mainnet Data
// ====================================================
// 🎉 ELZORA GATEWAY DEPLOYMENT COMPLETE:
// ====================================================
// Gateway Address:                0x17dbc114377A5EFDe9A0ae9465a07160BEA78C3D
// Linked ElzoraMain Proxy:        0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C
// Payment Token:                  0x55d398326f99059fF775485246999027B3197955
// Solvency Status:                SOLVENT ✅
// ====================================================