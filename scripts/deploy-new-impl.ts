import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const feeData = await ethers.provider.getFeeData();
  const gasPrice =
    feeData.gasPrice && feeData.gasPrice > ethers.parseUnits("3", "gwei")
      ? feeData.gasPrice
      : ethers.parseUnits("3", "gwei");

  console.log("Deploying new ElzoraMain implementation with First 3 IDs exemptions...");
  const newImpl = await ethers.deployContract("ElzoraMain", [], { gasPrice });
  await newImpl.waitForDeployment();
  const implAddress = await newImpl.getAddress();
  console.log(">> ✅ New Implementation Address:", implAddress);
}

main().catch(console.error);
