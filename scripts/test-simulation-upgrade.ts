import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  console.log("=== SIMULATION: TEST UPGRADE TO GLOBAL AUTO-MATRIX ===");

  const proxyAddress = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
  const proxy = await ethers.getContractAt("ElzoraMain", proxyAddress);

  const initial15Users = [
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
  ];

  console.log("Current total users on proxy:", (await proxy.totalUsers()).toString());
  console.log("Owner on proxy:", await proxy.owner());

  // Encode function call
  const newImplFactory = await ethers.getContractFactory("ElzoraMain");
  const initData = newImplFactory.interface.encodeFunctionData("initializeGlobalMatrix", [
    initial15Users,
  ]);
  console.log("Encoded initializeGlobalMatrix calldata length:", initData.length);
  console.log("Calldata preview:", initData.slice(0, 74) + "...");
}

main().catch(console.error);

