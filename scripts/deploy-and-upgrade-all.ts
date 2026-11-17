import { network } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("====================================================");
  console.log("🚀 MASTER BSC MAINNET DEPLOYMENT & UPGRADE");
  console.log("====================================================");
  console.log("Deployer / Owner Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer BNB Balance:", ethers.formatEther(balance), "BNB");

  if (balance < ethers.parseEther("0.005")) {
    throw new Error("Insufficient BNB balance for deployment!");
  }

  const proxyAddress = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
  console.log("Target ElzoraMain Proxy Address:", proxyAddress);

  // Gas Price configuration (1.1 Gwei for BSC Mainnet)
  const feeData = await ethers.provider.getFeeData();
  const minGasPrice = ethers.parseUnits("1.1", "gwei");
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > minGasPrice
      ? feeData.gasPrice
      : minGasPrice;
  console.log("Using Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Deploy new ElzoraMain Implementation
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- STEP 1: Deploying New ElzoraMain Implementation ---");
  const ElzoraMainFactory = await ethers.getContractFactory("ElzoraMain");
  const newImpl = await ElzoraMainFactory.deploy({ gasPrice });
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  console.log(">> ✅ New Implementation deployed at:", newImplAddress);

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Upgrade Proxy Implementation via UUPS
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- STEP 2: Upgrading ElzoraMain Proxy via UUPS ---");
  const proxyAsMain = await ethers.getContractAt("ElzoraMain", proxyAddress);
  const upgradeTx = await proxyAsMain.upgradeToAndCall(newImplAddress, "0x", { gasPrice });
  console.log("Upgrade Tx submitted, hash:", upgradeTx.hash);
  const upgradeReceipt = await upgradeTx.wait();
  console.log(">> ✅ Proxy Upgraded in Block:", upgradeReceipt?.blockNumber);

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Deploy Fresh ElzoraGateway Router
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- STEP 3: Deploying Clean & Independent ElzoraGateway ---");
  const ElzoraGatewayFactory = await ethers.getContractFactory("ElzoraGateway");
  const newGateway = await ElzoraGatewayFactory.deploy(proxyAddress, { gasPrice });
  await newGateway.waitForDeployment();
  const newGatewayAddress = await newGateway.getAddress();
  console.log(">> ✅ New ElzoraGateway deployed at:", newGatewayAddress);

  // ─────────────────────────────────────────────────────────────
  // STEP 4: Authorize New Gateway in ElzoraMain Proxy
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- STEP 4: Authorizing New Gateway in ElzoraMain Proxy ---");
  const authTx = await proxyAsMain.setGatewayContract(newGatewayAddress, { gasPrice });
  console.log("Authorize Tx submitted, hash:", authTx.hash);
  const authReceipt = await authTx.wait();
  console.log(">> ✅ New Gateway Authorized in Block:", authReceipt?.blockNumber);

  // ─────────────────────────────────────────────────────────────
  // STEP 5: Initialize Member IDs for Existing 19 Users
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- STEP 5: Initializing Member IDs for Existing Users ---");
  const existingUsers = [
    "0xE60746348b128D3D99546d78E646946599a0311e", // Root (ID 1)
    "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6",
    "0x95F73C4763D78BC26F8D16CfFf43b40174E48f0C",
    "0xe97215Fcc9af1A9aF63fE66D1fB5d83A51ce258D",
    "0xAa623b52691c34640bDDD0A6Ea2492a942c957f5",
    "0x9A137cDE2f22532E4df01bdB57C8260841065Bc1",
    "0xb840EC936875Aa343d7E1186a45fEd54660624c8",
    "0x6B7951Ef13153A16AB0aa4Ce6F4922C9Ad7a7960",
    "0x51cD4585422CDD9b6A110c93Fb2b22e527FbF907",
    "0x05526902Ac21E9C651112dD06229C2C7D2CcfbcD",
    "0x3C86119420e9694967fEf9dEBc96f0DBAB461b4F",
    "0xf963263abf71475a3aBc98Ac496523D437b39995",
    "0xdE28fE21C30C95e337b3faEb0c8eB33ea1B00BA2",
    "0x94ce154149F4D6b737660320789418E32cfA8660",
    "0xC1E6DA0D38aDC6aF2b219f231C8fe7356D166609",
    "0x9E980EC4316dDF9b09DfF008065E1E3DD81f8A27",
    "0xD43eAb21B3538D65F334c10b8C0B48F0AD8CFA04",
    "0xeAdF33D5482078CeA1492430E6cC0aeF9Ffe80eC",
    "0xd3BadAa69584CCA5139e876Fac49E68B4B07635C"
  ];

  const usersToAssign: string[] = [];
  const idsToAssign: number[] = [];
  const usedIds = new Set<number>();

  for (let i = 0; i < existingUsers.length; i++) {
    const u = existingUsers[i];
    let currentId = 0n;
    try {
      currentId = await proxyAsMain.getMemberId(u);
    } catch {}

    if (currentId > 0n) {
      console.log(`User ${i + 1} (${u}) already has Member ID: ELZ${currentId}`);
      usedIds.add(Number(currentId));
    } else {
      let candidateId = 0;
      if (i === 0) {
        candidateId = 10001; // Root
      } else {
        do {
          candidateId = Math.floor(10000 + Math.random() * 90000);
        } while (usedIds.has(candidateId));
      }
      usedIds.add(candidateId);
      usersToAssign.push(u);
      idsToAssign.push(candidateId);
      console.log(`User ${i + 1} (${u}) -> Assigning candidate: ELZ${candidateId}`);
    }
  }

  if (usersToAssign.length > 0) {
    console.log(`Submitting batchSetMemberIds for ${usersToAssign.length} users...`);
    const batchTx = await (proxyAsMain as any).batchSetMemberIds(usersToAssign, idsToAssign, { gasPrice });
    console.log("Batch Tx submitted, hash:", batchTx.hash);
    const batchReceipt = await batchTx.wait();
    console.log(">> ✅ Batch Member IDs Assigned in Block:", batchReceipt?.blockNumber);
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 6: Update Environment Files (.env)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- STEP 6: Updating .env Configuration ---");
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    envContent = envContent.replace(
      /IMPLEMENTATION_ADDRESS=.*/g,
      `IMPLEMENTATION_ADDRESS="${newImplAddress}"`
    );
    envContent = envContent.replace(
      /ELZORA_GATEWAY_ADDRESS=.*/g,
      `ELZORA_GATEWAY_ADDRESS="${newGatewayAddress}"`
    );
    envContent = envContent.replace(
      /VITE_ELZORA_GATEWAY_ADDRESS=.*/g,
      `VITE_ELZORA_GATEWAY_ADDRESS="${newGatewayAddress}"`
    );
    fs.writeFileSync(envPath, envContent, "utf8");
    console.log(">> ✅ Updated .env with new Gateway address:", newGatewayAddress);
  }

  // Also update contracts.js
  const contractsJsPath = path.resolve(__dirname, "../frontend/src/web3/contracts.js");
  if (fs.existsSync(contractsJsPath)) {
    let contractsContent = fs.readFileSync(contractsJsPath, "utf8");
    // Replace Gateway address for BSC Mainnet
    contractsContent = contractsContent.replace(
      /GATEWAY: import\.meta\.env\.VITE_ELZORA_GATEWAY_ADDRESS \|\| '0x[a-fA-F0-9]{40}'/,
      `GATEWAY: import.meta.env.VITE_ELZORA_GATEWAY_ADDRESS || '${newGatewayAddress}'`
    );
    fs.writeFileSync(contractsJsPath, contractsContent, "utf8");
    console.log(">> ✅ Updated frontend/src/web3/contracts.js with new Gateway address!");
  }

  console.log("\n====================================================");
  console.log("🎉 ALL DEPLOYMENTS & UPGRADES COMPLETED SUCCESSFULLY!");
  console.log("====================================================");
  console.log("ElzoraMain Proxy:        ", proxyAddress);
  console.log("New Implementation:      ", newImplAddress);
  console.log("New ElzoraGateway Router:", newGatewayAddress);
  console.log("BscScan Proxy Link:       https://bscscan.com/address/" + proxyAddress);
  console.log("BscScan Gateway Link:     https://bscscan.com/address/" + newGatewayAddress);
}

main().catch((err) => {
  console.error("Master deployment failed:", err);
  process.exit(1);
});
