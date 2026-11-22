import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PROXY_ADDRESS = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

async function main() {
  console.log("========================================================================");
  console.log("⚡ REGISTERING FIRST 3 IDs AS QUALIFIERS ON-CHAIN FOR WEEK #2");
  console.log("========================================================================");

  const { ethers } = await network.create({
    network: "bscMainnet",
  });

  const [deployer] = await ethers.getSigners();
  console.log("Operator / Deployer:", deployer.address);

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? ethers.parseUnits("3", "gwei");

  const proxyAbi = [
    "function globalMatrixUsers(uint256) view returns (address)",
    "function getWeeklyQualifiersCount(uint256) view returns (uint256)",
    "function getWeeklyQualifiers(uint256) view returns (address[])",
    "function addWeeklyQualifier(uint256 epoch, address account) external",
    "function isWeeklyQualifier(uint256 epoch, address account) view returns (bool)",
  ];
  const proxy = new ethers.Contract(PROXY_ADDRESS, proxyAbi, deployer);

  const countPre = await proxy.getWeeklyQualifiersCount(2);
  console.log("Pre-registration Week #2 Qualifiers Count:", countPre.toString());

  for (let i = 1; i <= 3; i++) {
    const user = await proxy.globalMatrixUsers(i);
    const already = await proxy.isWeeklyQualifier(2, user);
    console.log(`ID #${i} (${user}) already qualified? ${already}`);
    if (!already) {
      console.log(`Adding ID #${i} (${user}) to Week #2 qualifiers...`);
      const tx = await proxy.addWeeklyQualifier(2, user, { gasPrice });
      console.log("Tx sent:", tx.hash);
      await tx.wait();
      console.log(`✅ ID #${i} added successfully!`);
    }
  }

  const countPost = await proxy.getWeeklyQualifiersCount(2);
  const qualifiersPost = await proxy.getWeeklyQualifiers(2);
  console.log("\nPost-registration Week #2 Qualifiers Count:", countPost.toString());
  console.log("Week #2 Qualifiers:", qualifiersPost);

  console.log("\n🎉 ALL 3 DEFAULT QUALIFIERS SUCCESSFULLY REGISTERED FOR WEEK #2 ON-CHAIN!");
}

main().catch((err) => {
  console.error("❌ Execution failed:", err);
  process.exit(1);
});
