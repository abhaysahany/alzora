import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

const rawPrivateKey = process.env.PRIVATE_KEY?.trim() || "";
const PRIVATE_KEY =
  rawPrivateKey &&
  rawPrivateKey !==
    "0x0000000000000000000000000000000000000000000000000000000000000000"
    ? [rawPrivateKey.startsWith("0x") ? rawPrivateKey : `0x${rawPrivateKey}`]
    : [];

const BSC_TESTNET_RPC =
  process.env.BNB_TESTNET_RPC_URL ||
  process.env.BSC_TESTNET_RPC_URL ||
  "https://bsc-testnet.publicnode.com";
const BSC_MAINNET_RPC =
  process.env.BNB_MAINNET_RPC_URL ||
  process.env.BSC_MAINNET_RPC_URL ||
  "https://bsc-dataseed.binance.org/";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
          viaIR: true,
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
          viaIR: true,
        },
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
      allowUnlimitedContractSize: true,
    },
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
      allowUnlimitedContractSize: true,
    },
    bscTestnet: {
      type: "http",
      chainType: "l1",
      url: BSC_TESTNET_RPC,
      accounts: PRIVATE_KEY,
    },
    bscMainnet: {
      type: "http",
      chainType: "l1",
      url: BSC_MAINNET_RPC,
      accounts: PRIVATE_KEY,
    },
  },
  verify: {
    etherscan: {
      apiKey: process.env.BSCSCAN_API_KEY || "",
    },
  },
});
