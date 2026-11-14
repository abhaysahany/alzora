import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("====================================================");
  console.log("1. DEPLOYING ELZORA MAIN (UUPS UPGRADEABLE PROXY)");
  console.log("====================================================");
  console.log("Deployer Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Native Balance:", ethers.formatEther(balance), "BNB");

  // Determine Payment Token Address (BEP20 USDT)
  const paymentTokenAddress =
    process.env.USDT_TOKEN_ADDRESS ||
    process.env.VITE_USDT_CONTRACT_ADDRESS ||
    "0x90a1De2cC063786fC7e6C69514988cBb03E6665e"; // BSC Testnet USDT

  const treasuryWallet = process.env.TREASURY_WALLET || deployer.address;
  const rootAddress = process.env.ROOT_ID || deployer.address;

  console.log("\nConfigured Payment Token (USDT):", paymentTokenAddress);
  console.log("Configured Treasury Wallet:     ", treasuryWallet);
  console.log("Configured Root Referral Wallet: ", rootAddress);

  // Determine BSC gas price (1.1 gwei on Mainnet to minimize fees; 3 gwei on testnet)
  const net = await ethers.provider.getNetwork();
  const feeData = await ethers.provider.getFeeData();
  const minGwei = Number(net.chainId) === 56 ? "1.1" : "3.0";
  const minGasPrice = ethers.parseUnits(minGwei, "gwei");
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > minGasPrice ? feeData.gasPrice : minGasPrice;

  console.log("Using Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // 1. Implementation Contract (Reuse if already deployed)
  let implAddress =
    process.env.IMPLEMENTATION_ADDRESS ||
    (Number(net.chainId) === 56 ? "0xa1FAd427a37Ed13ab8D99cA02c5f0fAb91EFF070" : "");

  let impl: any = null;
  if (implAddress && implAddress !== "" && implAddress !== ethers.ZeroAddress) {
    const code = await ethers.provider.getCode(implAddress);
    if (code && code !== "0x") {
      console.log("\nReusing ALREADY DEPLOYED ElzoraMain Implementation at:", implAddress);
      impl = await ethers.getContractAt("ElzoraMain", implAddress);
    }
  }

  if (!impl) {
    console.log("\nDeploying ElzoraMain Implementation Contract...");
    impl = await ethers.deployContract("ElzoraMain", [], { gasPrice });
    await impl.waitForDeployment();
    implAddress = await impl.getAddress();
    console.log(">> Implementation Deployed at:", implAddress);
  }

  // 2. Deploy Proxy and Initialize
  console.log("\nDeploying ElzoraProxy (ERC1967 Proxy) & Initializing...");
  const initData = impl.interface.encodeFunctionData("initialize", [
    deployer.address,
    paymentTokenAddress,
    treasuryWallet,
    rootAddress,
  ]);

  const proxy = await ethers.deployContract(
    "ElzoraProxy",
    [implAddress, initData],
    { gasPrice }
  );
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log(">> Elzora Proxy Deployed at:", proxyAddress);

  // 3. Verification & Setup Checks
  const elzoraMain = await ethers.getContractAt("ElzoraMain", proxyAddress);

  console.log("\n====================================================");
  console.log("🎉 ELZORA MAIN (PROXY) DEPLOYMENT COMPLETE:");
  console.log("====================================================");
  console.log("Proxy Address (ElzoraMain):    ", proxyAddress);
  console.log("Implementation Address:        ", implAddress);
  console.log("Payment Token:                 ", await elzoraMain.paymentToken());
  console.log("Treasury Wallet:               ", await elzoraMain.treasuryWallet());
  console.log("Root Address:                  ", await elzoraMain.rootAddress());
  console.log("Total Users Initialized:       ", (await elzoraMain.totalUsers()).toString());
  console.log("====================================================");
  console.log("\n👉 IMPORTANT: Add this line to your .env before deploying Gateway:");
  console.log(`ELZORA_MAIN_ADDRESS="${proxyAddress}"`);
  console.log(`VITE_ELZORA_MAIN_ADDRESS="${proxyAddress}"`);
}

main().catch((error) => {
  console.error("ElzoraMain deployment failed:", error);
  process.exitCode = 1;
});

// ====================================================
// 🎉 ELZORA MAIN (PROXY) DEPLOYMENT COMPLETE:
// ====================================================
// Proxy Address (ElzoraMain):     0x3290Fe9b7FF7C801FC1351957F81C974eC560Ec2
// Implementation Address:         0xD39B9e1506C21D459c5e0a7160BdE57940Ef4C20
// Payment Token:                  0x90a1De2cC063786fC7e6C69514988cBb03E6665e
// Treasury Wallet:                0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5
// Root Address:                   0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5
// Total Users Initialized:        1
// ====================================================

// Mainnet Data
// 🎉 ELZORA MAIN (PROXY) DEPLOYMENT COMPLETE:
// ====================================================
// Proxy Address (ElzoraMain):     0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C
// Implementation Address:         0xa1FAd427a37Ed13ab8D99cA02c5f0fAb91EFF070
// Payment Token:                  0x55d398326f99059fF775485246999027B3197955
// Treasury Wallet:                0x067c2aa4C1576388F835C160E79Db88ebE02Ee92
// Root Address:                   0xE60746348b128D3D99546d78E646946599a0311e
// Total Users Initialized:        1
// ====================================================
