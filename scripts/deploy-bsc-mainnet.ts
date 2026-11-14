import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const OFFICIAL_BSC_MAINNET_USDT = "0x55d398326f99059fF775485246999027B3197955";
const ALREADY_DEPLOYED_MAINNET_IMPL = "0xa1FAd427a37Ed13ab8D99cA02c5f0fAb91EFF070";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("==================================================================");
  console.log("🚀 ELZORA PROTOCOL — BSC MAINNET DEPLOYMENT ENGINE (LOW-FEE 1.1 GWEI)");
  console.log("==================================================================");

  // 1. Validate Network
  const net = await ethers.provider.getNetwork();
  console.log(`Connected Network Chain ID: ${net.chainId.toString()}`);
  if (Number(net.chainId) !== 56) {
    console.warn(`⚠️ Notice: Not running directly on BSC Mainnet (Chain ID 56). Current Chain ID: ${net.chainId}`);
  }

  // 2. Validate Deployer & BNB Balance
  console.log(`Deployer Address:           ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  const bnbBalance = Number(ethers.formatEther(balance));
  console.log(`Deployer BNB Balance:       ${bnbBalance.toFixed(5)} BNB`);

  // 3. Validate Payment Token (USDT) & On-Chain Decimals
  let usdtAddress = OFFICIAL_BSC_MAINNET_USDT;

  if (Number(net.chainId) === 31337) {
    console.log("Local simulated network detected: Deploying mock USDT (18 decimals)...");
    const mockUsdt = await ethers.deployContract("TestToken");
    await mockUsdt.waitForDeployment();
    usdtAddress = await mockUsdt.getAddress();
  } else if (process.env.USDT_TOKEN_ADDRESS_MAINNET) {
    usdtAddress = process.env.USDT_TOKEN_ADDRESS_MAINNET;
  } else if (Number(net.chainId) === 97 && process.env.USDT_TOKEN_ADDRESS) {
    usdtAddress = process.env.USDT_TOKEN_ADDRESS;
  }

  console.log(`Target USDT Address:        ${usdtAddress}`);

  const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ];

  try {
    const usdtContract = new ethers.Contract(usdtAddress, erc20Abi, ethers.provider);
    const [name, symbol, decimals] = await Promise.all([
      usdtContract.name(),
      usdtContract.symbol(),
      usdtContract.decimals(),
    ]);
    console.log(`Token Verification:         ${name} (${symbol}) | Decimals: ${decimals}`);
  } catch (err) {
    console.warn(`⚠️ Could not query token decimals at ${usdtAddress}:`, err);
  }

  // 4. Validate Treasury and Root Addresses
  const treasuryWallet =
    process.env.TREASURY_WALLET ||
    process.env.VITE_TREASURY_WALLET ||
    deployer.address;

  const rootAddress =
    process.env.ROOT_ID ||
    process.env.VITE_ROOT_ID ||
    deployer.address;

  console.log(`Treasury Wallet:            ${treasuryWallet}`);
  console.log(`Root User (#1):             ${rootAddress}`);

  // 5. Calculate Gas Price (1.1 Gwei on Mainnet to minimize fees!)
  const feeData = await ethers.provider.getFeeData();
  const minGwei = Number(net.chainId) === 56 ? "1.1" : (Number(net.chainId) === 31337 ? "1.0" : "3.0");
  const minGasPrice = ethers.parseUnits(minGwei, "gwei");
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > minGasPrice ? feeData.gasPrice : minGasPrice;

  console.log(`Using Optimized Gas Price:  ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log("------------------------------------------------------------------");

  // STEP 1: Implementation Contract
  let implAddress =
    process.env.IMPLEMENTATION_ADDRESS ||
    (Number(net.chainId) === 56 ? ALREADY_DEPLOYED_MAINNET_IMPL : "");

  let impl: any = null;

  if (implAddress && implAddress !== "" && implAddress !== ethers.ZeroAddress) {
    const code = await ethers.provider.getCode(implAddress);
    if (code && code !== "0x") {
      console.log(`\n📦 Step 1/4: Using ALREADY DEPLOYED Implementation (Zero new fees! Saved ~0.016 BNB):`);
      console.log(`✅ Existing Implementation at: ${implAddress}`);
      impl = await ethers.getContractAt("ElzoraMain", implAddress);
    }
  }

  if (!impl) {
    console.log("\n📦 Step 1/4: Deploying fresh ElzoraMain Implementation...");
    impl = await ethers.deployContract("ElzoraMain", [], { gasPrice });
    await impl.waitForDeployment();
    implAddress = await impl.getAddress();
    console.log(`✅ Implementation Deployed at:  ${implAddress}`);
  }

  // STEP 2: Deploy Proxy & Initialize
  console.log("\n📦 Step 2/4: Deploying ElzoraProxy & Initializing (at 1.1 Gwei)...");
  const initData = impl.interface.encodeFunctionData("initialize", [
    deployer.address,
    usdtAddress,
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
  console.log(`✅ ElzoraProxy Deployed at:      ${proxyAddress}`);

  // STEP 3: Deploy ElzoraGateway
  console.log("\n📦 Step 3/4: Deploying ElzoraGateway Router (at 1.1 Gwei)...");
  const gateway = await ethers.deployContract("ElzoraGateway", [proxyAddress], {
    gasPrice,
  });
  await gateway.waitForDeployment();
  const gatewayAddress = await gateway.getAddress();
  console.log(`✅ ElzoraGateway Deployed at:    ${gatewayAddress}`);

  // STEP 4: Authorize Gateway in ElzoraMain
  console.log("\n🔗 Step 4/4: Authorizing Gateway in ElzoraMain Proxy...");
  const elzoraMain = await ethers.getContractAt("ElzoraMain", proxyAddress);
  const authTx = await elzoraMain.setGatewayContract(gatewayAddress, { gasPrice });
  console.log(`>> Transaction sent: ${authTx.hash}. Waiting for confirmation...`);
  await authTx.wait();
  console.log(`✅ ElzoraGateway authorized in ElzoraMain successfully!`);

  // STEP 5: Protocol Verification
  console.log("\n🔎 Running Protocol Sanity Verification...");
  const overview = await gateway.getProtocolOverview();
  const tokenUnit = await elzoraMain.tokenUnit();
  const totalUsers = await elzoraMain.totalUsers();

  console.log("==================================================================");
  console.log("🎉 ELZORA MAINNET DEPLOYMENT SUCCESSFUL & VERIFIED!");
  console.log("==================================================================");
  console.log(`Implementation Contract:   ${implAddress}`);
  console.log(`Elzora Main (Proxy):       ${proxyAddress}`);
  console.log(`Elzora Gateway:            ${gatewayAddress}`);
  console.log(`USDT Token:                ${overview.paymentToken}`);
  console.log(`Token Unit (Decimals):     ${tokenUnit.toString()} (${tokenUnit === 10n ** 18n ? '18 decimals ✅' : tokenUnit.toString()})`);
  console.log(`Solvency Status:           ${overview.isSolvent ? 'SOLVENT ✅' : 'NOT SOLVENT ❌'}`);
  console.log(`Total Initialized Users:   ${totalUsers.toString()} (Root ID: ${rootAddress})`);
  console.log("==================================================================");

  console.log("\n📋 UPDATE YOUR .env WITH THE FOLLOWING VALUES:");
  console.log("------------------------------------------------------------------");
  console.log(`USDT_TOKEN_ADDRESS="${usdtAddress}"`);
  console.log(`VITE_USDT_CONTRACT_ADDRESS="${usdtAddress}"`);
  console.log(`ELZORA_ADDRESS="${proxyAddress}"`);
  console.log(`VITE_ELZORA_ADDRESS="${proxyAddress}"`);
  console.log(`ELZORA_MAIN_ADDRESS="${proxyAddress}"`);
  console.log(`VITE_ELZORA_MAIN_ADDRESS="${proxyAddress}"`);
  console.log(`IMPLEMENTATION_ADDRESS="${implAddress}"`);
  console.log(`ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
  console.log(`VITE_ELZORA_GATEWAY_ADDRESS="${gatewayAddress}"`);
  console.log("------------------------------------------------------------------");

  console.log("\n🔍 BSCSCAN VERIFICATION COMMANDS:");
  console.log("------------------------------------------------------------------");
  console.log(`npx hardhat verify --network bscMainnet ${implAddress}`);
  console.log(`npx hardhat verify --network bscMainnet ${proxyAddress} "${implAddress}" "${initData}"`);
  console.log(`npx hardhat verify --network bscMainnet ${gatewayAddress} "${proxyAddress}"`);
  console.log("------------------------------------------------------------------");
}

main().catch((err) => {
  console.error("Mainnet deployment failed:", err);
  process.exitCode = 1;
});
