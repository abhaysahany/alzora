import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("====================================================");
  console.log("🚀 UPGRADE TO GLOBAL 2xN AUTO-MATRIX (MODEL C)");
  console.log("====================================================");
  console.log("Signer / Owner Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("BNB Balance:", ethers.formatEther(balance), "BNB");

  const proxyAddress = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
  console.log("Target Proxy Address:", proxyAddress);

  // Gas Price configuration (1.1 Gwei for BSC Mainnet)
  const feeData = await ethers.provider.getFeeData();
  const minGasPrice = ethers.parseUnits("1.1", "gwei");
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > minGasPrice
      ? feeData.gasPrice
      : minGasPrice;
  console.log("Using Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // Step 1: Deploy new ElzoraMain Implementation
  console.log("\n1. Deploying new ElzoraMain (Global 2xN Auto-Matrix) implementation...");
  const newImpl = await ethers.deployContract("ElzoraMain", [], { gasPrice });
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  console.log(">> ✅ New Implementation deployed at:", newImplAddress);

  // Step 2: Prepare initial users for migration
  const initialUsers = [
    "0xE60746348b128D3D99546d78E646946599a0311e", // ID 1 (Root)
    "0x6D5Cec047b973d6cB334b0C77D8cd4B64b8EEAF6", // ID 2
    "0x95F73C4763D78BC26F8D16CfFf43b40174E48f0C", // ID 3
    "0xe97215Fcc9af1A9aF63fE66D1fB5d83A51ce258D", // ID 4
    "0xAa623b52691c34640bDDD0A6Ea2492a942c957f5", // ID 5
    "0x9A137cDE2f22532E4df01bdB57C8260841065Bc1", // ID 6
    "0xb840EC936875Aa343d7E1186a45fEd54660624c8", // ID 7
    "0x6B7951Ef13153A16AB0aa4Ce6F4922C9Ad7a7960", // ID 8
    "0x51cD4585422CDD9b6A110c93Fb2b22e527FbF907", // ID 9
    "0x05526902Ac21E9C651112dD06229C2C7D2CcfbcD", // ID 10
    "0x3C86119420e9694967fEf9dEBc96f0DBAB461b4F", // ID 11
    "0xf963263abf71475a3aBc98Ac496523D437b39995", // ID 12
    "0xdE28fE21C30C95e337b3faEb0c8eB33ea1B00BA2", // ID 13
    "0x94ce154149F4D6b737660320789418E32cfA8660", // ID 14
    "0xC1E6DA0D38aDC6aF2b219f231C8fe7356D166609", // ID 15
    "0xeAdF33D5482078CeA1492430E6cC0aeF9Ffe80eC", // ID 16
    "0xd3BadAa69584CCA5139e876Fac49E68B4B07635C", // ID 17
  ];

  console.log(`\n2. Preparing initialization calldata for ${initialUsers.length} users...`);
  const initCallData = newImpl.interface.encodeFunctionData("initializeGlobalMatrix", [
    initialUsers,
  ]);

  // Step 3: Attach to proxy and execute upgradeToAndCall
  console.log("\n3. Executing upgradeToAndCall on Proxy...");
  const proxyAsMain = await ethers.getContractAt("ElzoraMain", proxyAddress, deployer);

  const currentOwner = await proxyAsMain.owner();
  console.log(">> Current Owner on proxy:", currentOwner);
  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`Caller ${deployer.address} is not owner ${currentOwner}!`);
  }

  const upgradeTx = await proxyAsMain.upgradeToAndCall(newImplAddress, initCallData, {
    gasPrice,
  });
  console.log(">> Upgrade Tx sent:", upgradeTx.hash);
  await upgradeTx.wait();
  console.log(">> ✅ Upgrade successfully confirmed on BSC Mainnet!");

  // Step 4: Verify post-upgrade state
  console.log("\n4. Verifying On-Chain Global Matrix State...");
  const totalCount = await proxyAsMain.getGlobalMatrixUsersCount();
  const totalUsers = await proxyAsMain.totalUsers();
  console.log(">> Global Matrix Users Count:", totalCount.toString());
  console.log(">> Total Users in System:   ", totalUsers.toString());

  const rootId = await proxyAsMain.userGlobalMatrixId(initialUsers[0]);
  const u17Id = await proxyAsMain.userGlobalMatrixId(initialUsers[16]);
  console.log(">> Root ID in Global Matrix:", rootId.toString());
  console.log(">> User 17 ID in Matrix:    ", u17Id.toString());

  const [nextParent, nextPos, nextId] = await proxyAsMain.getNextGlobalMatrixPlacement();
  console.log("\n>> NEXT PLACEMENT FOR NEW USERS (ID 18):");
  console.log("   Next ID:      ", nextId.toString());
  console.log("   Next Parent:  ", nextParent);
  console.log("   Next Position:", nextPos === 1n ? "Left" : "Right");

  console.log("\n====================================================");
  console.log("🎉 UPGRADE COMPLETE: MODEL C ACTIVE ON BSC MAINNET!");
  console.log("====================================================");
}

main().catch((err) => {
  console.error("Upgrade error:", err);
  process.exit(1);
});

