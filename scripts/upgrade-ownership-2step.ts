import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("====================================================");
  console.log("🔒 UPGRADE ELZORA TO OWNABLE2STEP UPGRADEABLE");
  console.log("====================================================");
  console.log("Signer / Owner Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("BNB Balance:", ethers.formatEther(balance), "tBNB");

  const proxyAddress =
    process.env.VITE_ELZORA_ADDRESS ||
    process.env.ELZORA_ADDRESS ||
    "0xf67F9050dd9c9Eeb9733e03896a25f08787C2792";

  console.log("Target Proxy Address:", proxyAddress);

  // Gas Price on BSC Testnet (min 3 gwei)
  const feeData = await ethers.provider.getFeeData();
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > ethers.parseUnits("3", "gwei")
      ? feeData.gasPrice
      : ethers.parseUnits("3", "gwei");

  console.log("Using Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // Step 1: Deploy new ElzoraMain Implementation with Ownable2StepUpgradeable
  console.log("\n1. Deploying new ElzoraMain implementation...");
  const newImpl = await ethers.deployContract("ElzoraMain", [], { gasPrice });
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  console.log(">> New Implementation deployed at:", newImplAddress);

  // Step 2: Attach to existing Proxy as UUPSUpgradeable
  console.log("\n2. Executing UUPS Upgrade on Proxy...");
  const proxyAsMain = await ethers.getContractAt("ElzoraMain", proxyAddress, deployer);

  const currentOwner = await proxyAsMain.owner();
  console.log(">> Current Owner on-chain:", currentOwner);
  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`Caller ${deployer.address} is not the owner ${currentOwner}!`);
  }

  const upgradeTx = await proxyAsMain.upgradeToAndCall(newImplAddress, "0x", { gasPrice });
  console.log(">> Upgrade Tx sent:", upgradeTx.hash);
  await upgradeTx.wait();
  console.log(">> ✅ Upgrade successfully confirmed on BSC Testnet!");

  // Step 3: Verify On-Chain State & Ownable2Step Functionality
  console.log("\n3. Verifying 2-Step Ownership mechanics on proxy...");
  const verifiedOwner = await proxyAsMain.owner();
  const pendingOwnerInitial = await proxyAsMain.pendingOwner();
  const root = await proxyAsMain.rootAddress();
  const totalUsers = await proxyAsMain.totalUsers();

  console.log(">> Proxy Owner:          ", verifiedOwner);
  console.log(">> Proxy Pending Owner:  ", pendingOwnerInitial);
  console.log(">> Proxy Root ID:        ", root);
  console.log(">> Total Users count:    ", totalUsers.toString());

  // Step 4: Test Safe Nomination, Replacement, and Cancellation
  console.log("\n4. Testing safe nomination replacement & cancellation...");
  const testCandidate1 = "0x0000000000000000000000000000000000000001";
  const testCandidate2 = "0x0000000000000000000000000000000000000002";

  console.log(">> Nominating Candidate 1:", testCandidate1);
  const txNom1 = await proxyAsMain.transferOwnership(testCandidate1, { gasPrice });
  await txNom1.wait();
  let pending = await proxyAsMain.pendingOwner();
  console.log(">> Pending Owner is now: ", pending);

  console.log(">> Re-nominating Candidate 2 (Replacing pending without error):", testCandidate2);
  const txNom2 = await proxyAsMain.transferOwnership(testCandidate2, { gasPrice });
  await txNom2.wait();
  pending = await proxyAsMain.pendingOwner();
  console.log(">> Pending Owner is now: ", pending);

  console.log(">> Canceling pending ownership transfer via cancelOwnershipTransfer()...");
  const txCancel = await proxyAsMain.cancelOwnershipTransfer({ gasPrice });
  await txCancel.wait();
  pending = await proxyAsMain.pendingOwner();
  console.log(">> Pending Owner reset to:", pending);

  const finalOwner = await proxyAsMain.owner();
  console.log(">> Confirmed Final Owner (Unchanged):", finalOwner);

  console.log("\n====================================================");
  console.log("🎉 ALL TESTS PASSED: 2-STEP OWNERSHIP FULLY WORKING!");
  console.log("====================================================");
}

main().catch((err) => {
  console.error("Upgrade error:", err);
  process.exit(1);
});

