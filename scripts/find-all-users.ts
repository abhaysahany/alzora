import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const proxyAddress = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
  const elzora = await ethers.getContractAt("ElzoraMain", proxyAddress);

  const initial15 = [
    "0xE60746348b128D3D99546d78E646946599a0311e",
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
    "0xC1E6DA0D38aDC6aF2b219f231C8fe7356D166609"
  ];

  const knownSet = new Set(initial15.map(a => a.toLowerCase()));
  const allUsers = [...initial15];

  for (const addr of initial15) {
    const prof = await elzora.getUser(addr);
    const directs = await elzora.getDirectReferrals(addr);

    if (prof.leftChild !== ethers.ZeroAddress && !knownSet.has(prof.leftChild.toLowerCase())) {
      console.log(`Found NEW child (Left of ${addr}):`, prof.leftChild);
      knownSet.add(prof.leftChild.toLowerCase());
      allUsers.push(prof.leftChild);
    }
    if (prof.rightChild !== ethers.ZeroAddress && !knownSet.has(prof.rightChild.toLowerCase())) {
      console.log(`Found NEW child (Right of ${addr}):`, prof.rightChild);
      knownSet.add(prof.rightChild.toLowerCase());
      allUsers.push(prof.rightChild);
    }

    for (const d of directs) {
      if (!knownSet.has(d.toLowerCase())) {
        console.log(`Found NEW direct referral of ${addr}:`, d);
        knownSet.add(d.toLowerCase());
        allUsers.push(d);
      }
    }
  }

  console.log(`Total discovered users: ${allUsers.length}`);
  allUsers.forEach((u, i) => console.log(`User ${i + 1}: ${u}`));
}

main().catch(console.error);

