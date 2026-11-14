import { network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const { ethers } = await network.create();
  const gatewayAddress = "0x17dbc114377A5EFDe9A0ae9465a07160BEA78C3D";
  const proxyAddress = "0xAA449d6f4Dad92C1F2D08f7115f9d32B2647Cd2C";
  const gateway = await ethers.getContractAt("ElzoraGateway", gatewayAddress);
  const elzora = await ethers.getContractAt("ElzoraMain", proxyAddress);

  const u1 = "0xE60746348b128D3D99546d78E646946599a0311e";
  const u4 = "0xe97215Fcc9af1A9aF63fE66D1fB5d83A51ce258D";

  console.log("CHAMPION_DIRECTS_REQUIRED on-chain:", (await elzora.CHAMPION_DIRECTS_REQUIRED()).toString());

  const dash1 = await gateway.getUserDashboard(u1);
  console.log("User 1 (Root) - Directs:", dash1.profile.directCount.toString(), "isChampionEligible:", dash1.isChampionEligible);

  const dash4 = await gateway.getUserDashboard(u4);
  console.log("User 4 - Directs:", dash4.profile.directCount.toString(), "isChampionEligible:", dash4.isChampionEligible);
  console.log("User 4 isChampionMember:", await elzora.isChampionMember(u4));
  console.log("User 4 isExemptFromDirects:", await elzora.isExemptFromDirects(u4));
}

main().catch(console.error);

