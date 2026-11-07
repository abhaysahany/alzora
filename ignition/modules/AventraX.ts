import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AventraXModule", (m) => {
  const admin = m.getAccount(0);

  // Existing deployed USDT contract address
  const usdtAddress = m.getParameter("usdtAddress", "0x90a1De2cC063786fC7e6C69514988cBb03E6665e");

  // Deploy AventraToken
  const token = m.contract("AventraToken", [admin]);

  // Deploy AventraXMLM
  const xmlM = m.contract("AventraXMLM");

  // Deploy Gateway
  const gateway = m.contract("AventraGateway", [xmlM, usdtAddress]);

  return { token, xmlM, gateway };
});

