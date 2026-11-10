import { network } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("====================================================");
  console.log("🚀 CLEAN REDEPLOYMENT OF ELZORA PROTOCOL WITH 2-STEP OWNERSHIP");
  console.log("====================================================");
  console.log("Deployer / Owner Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:        ", ethers.formatEther(balance), "tBNB");

  const paymentTokenAddress =
    process.env.USDT_TOKEN_ADDRESS ||
    process.env.VITE_USDT_CONTRACT_ADDRESS ||
    "0x90a1De2cC063786fC7e6C69514988cBb03E6665e"; // BSC Testnet USDT

  const treasuryWallet = "0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5";
  const rootAddress = "0x23cC13FF391bBcbF573467138d5DF4D9174B64Eb";

  console.log("Payment Token (USDT):    ", paymentTokenAddress);
  console.log("Treasury Wallet:         ", treasuryWallet);
  console.log("Owner / Deployer:        ", deployer.address);
  console.log("Root Address (1st ID):   ", rootAddress);

  // Gas Price on BSC Testnet (min 3 gwei)
  const feeData = await ethers.provider.getFeeData();
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > ethers.parseUnits("3", "gwei")
      ? feeData.gasPrice
      : ethers.parseUnits("3", "gwei");

  console.log("Using Gas Price:         ", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // Step 1: Deploy ElzoraMain Implementation
  console.log("\n1. Deploying ElzoraMain Implementation...");
  const impl = await ethers.deployContract("ElzoraMain", [], { gasPrice });
  await impl.waitForDeployment();
  const implAddress = await impl.getAddress();
  console.log(">> Implementation Address:", implAddress);

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
  console.log(">> Elzora Proxy Address:  ", proxyAddress);

  // Step 3: Deploy ElzoraGateway
  console.log("\n3. Deploying ElzoraGateway...");
  const gateway = await ethers.deployContract("ElzoraGateway", [proxyAddress], { gasPrice });
  await gateway.waitForDeployment();
  const gatewayAddress = await gateway.getAddress();
  console.log(">> Gateway Address:       ", gatewayAddress);

  // Step 4: Authorize Gateway in ElzoraMain Proxy
  console.log("\n4. Authorizing Gateway in ElzoraMain...");
  const elzoraMain = await ethers.getContractAt("ElzoraMain", proxyAddress);
  const authTx = await elzoraMain.setGatewayContract(gatewayAddress, { gasPrice });
  await authTx.wait();
  console.log(">> Gateway Authorized Successfully!");

  // Step 5: Test Safe 2-Step Ownership (Nominate, Re-nominate, Cancel)
  console.log("\n5. Testing 2-Step Ownership Mechanism On-Chain...");
  const owner = await elzoraMain.owner();
  const initialPending = await elzoraMain.pendingOwner();
  console.log(">> Initial Owner:         ", owner);
  console.log(">> Initial Pending Owner: ", initialPending);

  const testWalletA = "0x0000000000000000000000000000000000000001";
  const testWalletB = "0x0000000000000000000000000000000000000002";

  console.log(">> Nominating Wallet A:", testWalletA);
  const txNomA = await elzoraMain.transferOwnership(testWalletA, { gasPrice });
  await txNomA.wait();
  let pendingNow = await elzoraMain.pendingOwner();
  console.log(">> Pending Owner is now:  ", pendingNow);

  console.log(">> Re-nominating Wallet B (Replacing pending without error)...");
  const txNomB = await elzoraMain.transferOwnership(testWalletB, { gasPrice });
  await txNomB.wait();
  pendingNow = await elzoraMain.pendingOwner();
  console.log(">> Pending Owner replaced:", pendingNow);

  console.log(">> Canceling pending ownership transfer...");
  const txCancel = await elzoraMain.cancelOwnershipTransfer({ gasPrice });
  await txCancel.wait();
  pendingNow = await elzoraMain.pendingOwner();
  console.log(">> Pending Owner reset to:", pendingNow);

  const finalOwner = await elzoraMain.owner();
  console.log(">> Verified Final Owner (Still Owner):", finalOwner);

  // Step 6: Verifying Deployment Stats
  console.log("\n6. Verifying Protocol Stats...");
  const overview = await gateway.getProtocolOverview();
  const currMonth = await gateway.getCurrentMonthEpoch();
  const currWeek = await gateway.getCurrentWeeklyEpoch();

  console.log("====================================================");
  console.log("🎉 REDEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("====================================================");
  console.log("ElzoraMain Proxy:       ", proxyAddress);
  console.log("ElzoraMain Impl:        ", implAddress);
  console.log("ElzoraGateway:          ", gatewayAddress);
  console.log("Owner:                  ", finalOwner);
  console.log("Root Address:           ", rootAddress);
  console.log("Total Users:            ", overview.totalUsers.toString());
  console.log("Current Month Epoch:    ", currMonth.toString());
  console.log("Current Weekly Epoch:   ", currWeek.toString());
  console.log("Solvency Status:        ", overview.isSolvent ? "SOLVENT ✅" : "INSOLVENT ❌");
  console.log("====================================================");

  // Update .env file
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    envContent = envContent.replace(/ELZORA_ADDRESS=.*/g, `ELZORA_ADDRESS="${proxyAddress}"`);
    envContent = envContent.replace(/VITE_ELZORA_ADDRESS=.*/g, `VITE_ELZORA_ADDRESS="${proxyAddress}"`);
    envContent = envContent.replace(/ELZORA_MAIN_ADDRESS=.*/g, `ELZORA_MAIN_ADDRESS="${proxyAddress}"`);
    envContent = envContent.replace(/VITE_ELZORA_MAIN_ADDRESS=.*/g, `VITE_ELZORA_MAIN_ADDRESS="${proxyAddress}"`);
    envContent = envContent.replace(/ELZORA_GATEWAY_ADDRESS=.*/g, `ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
    envContent = envContent.replace(/VITE_ELZORA_GATEWAY_ADDRESS=.*/g, `VITE_ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
    fs.writeFileSync(envPath, envContent, "utf8");
    console.log(">> Updated .env file with new contract addresses.");
  }

  // Update contracts.js
  const contractsJsPath = path.resolve(__dirname, "../frontend/src/web3/contracts.js");
  if (fs.existsSync(contractsJsPath)) {
    let contractsContent = fs.readFileSync(contractsJsPath, "utf8");
    // Replace old proxy and gateway addresses under 97
    contractsContent = contractsContent.replace(
      /ELZORA: import\.meta\.env\.VITE_ELZORA_ADDRESS \|\| import\.meta\.env\.ELZORA_ADDRESS \|\| '0x[a-fA-F0-9]+'/g,
      `ELZORA: import.meta.env.VITE_ELZORA_ADDRESS || import.meta.env.ELZORA_ADDRESS || '${proxyAddress}'`
    );
    contractsContent = contractsContent.replace(
      /TETHER_STREAM: import\.meta\.env\.VITE_ELZORA_ADDRESS \|\| import\.meta\.env\.ELZORA_ADDRESS \|\| '0x[a-fA-F0-9]+'/g,
      `TETHER_STREAM: import.meta.env.VITE_ELZORA_ADDRESS || import.meta.env.ELZORA_ADDRESS || '${proxyAddress}'`
    );
    contractsContent = contractsContent.replace(
      /XMLM: import\.meta\.env\.VITE_ELZORA_ADDRESS \|\| import\.meta\.env\.ELZORA_ADDRESS \|\| '0x[a-fA-F0-9]+'/g,
      `XMLM: import.meta.env.VITE_ELZORA_ADDRESS || import.meta.env.ELZORA_ADDRESS || '${proxyAddress}'`
    );
    contractsContent = contractsContent.replace(
      /GATEWAY: import\.meta\.env\.VITE_ELZORA_GATEWAY_ADDRESS \|\| import\.meta\.env\.ELZORA_GATEWAY_ADDRESS \|\| '0x[a-fA-F0-9]+'/g,
      `GATEWAY: import.meta.env.VITE_ELZORA_GATEWAY_ADDRESS || import.meta.env.ELZORA_GATEWAY_ADDRESS || '${gatewayAddress}'`
    );
    fs.writeFileSync(contractsJsPath, contractsContent, "utf8");
    console.log(">> Updated frontend/src/web3/contracts.js with new contract addresses.");
  }
}

main().catch((error) => {
  console.error("Redeployment failed:", error);
  process.exitCode = 1;
});
