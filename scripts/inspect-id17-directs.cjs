const { ethers } = require("ethers");
const ELZORA_MAIN_ABI = require("../frontend/src/web3/ElzoraMain.abi.json");
const RPC = "https://bsc-dataseed.binance.org";
const ELZORA_ADDR = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const elzora = new ethers.Contract(ELZORA_ADDR, ELZORA_MAIN_ABI, provider);

  const id17 = "0xd3BadAa69584CCA5139e876Fac49E68B4B07635C";
  const u = await elzora.getUser(id17);
  console.log("ID 17 Profile:");
  console.log("  DirectCount:", u.directCount.toString());
  console.log("  leftDirectCount:", u.leftDirectCount.toString());
  console.log("  rightDirectCount:", u.rightDirectCount.toString());
  console.log("  leftTeamCount:", u.leftTeamCount.toString());
  console.log("  rightTeamCount:", u.rightTeamCount.toString());
  console.log("  leftCarryVolume:", u.leftCarryVolume.toString());
  console.log("  rightCarryVolume:", u.rightCarryVolume.toString());
  console.log("  leftChild:", u.leftChild);
  console.log("  rightChild:", u.rightChild);
  console.log("  parent:", u.parent);
  console.log("  position:", u.position.toString());

  const count = await elzora.getGlobalMatrixUsersCount();
  console.log("\nSearching for directs of ID 17 across all", count.toString(), "users:");
  for (let i = 1; i <= Number(count); i++) {
    const a = await elzora.globalMatrixUsers(i);
    const info = await elzora.getUser(a);
    if (info.sponsor.toLowerCase() === id17.toLowerCase()) {
      console.log(`  Direct: Global ID #${i} -> ${a}`);
      console.log(`          Position: ${info.position} (1=Left, 2=Right) | Binary Parent: ${info.parent}`);
    }
  }
}

main().catch(console.error);
