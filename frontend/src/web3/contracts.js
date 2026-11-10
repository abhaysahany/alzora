export const CHAIN_CONTRACTS = {
  // BSC Mainnet (Chain ID 56)
  56: {
    USDT: import.meta.env.VITE_USDT_CONTRACT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955',
    ELZORA: import.meta.env.VITE_ELZORA_ADDRESS || '0x3290Fe9b7FF7C801FC1351957F81C974eC560Ec2',
    TETHER_STREAM: import.meta.env.VITE_ELZORA_ADDRESS || '0x3290Fe9b7FF7C801FC1351957F81C974eC560Ec2',
    XMLM: import.meta.env.VITE_ELZORA_ADDRESS || '0x3290Fe9b7FF7C801FC1351957F81C974eC560Ec2',
    AVX: import.meta.env.VITE_USDT_CONTRACT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955',
    GATEWAY: import.meta.env.VITE_ELZORA_GATEWAY_ADDRESS || '0xE1f52AEE54AE7D25A841bA787E59bbcA956c1c80',
    TREASURY: import.meta.env.VITE_TREASURY_WALLET || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5',
    ROOT_ID: import.meta.env.VITE_ROOT_ID || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5',
  },
  // BSC Testnet (Chain ID 97)
  97: {
    USDT: import.meta.env.VITE_USDT_CONTRACT_ADDRESS || '0x90a1De2cC063786fC7e6C69514988cBb03E6665e',
    ELZORA: import.meta.env.VITE_ELZORA_ADDRESS || import.meta.env.ELZORA_ADDRESS || '0xf21b249b1040d8435Bc13B3d5Aeffe782F0B2B17',
    TETHER_STREAM: import.meta.env.VITE_ELZORA_ADDRESS || import.meta.env.ELZORA_ADDRESS || '0xf21b249b1040d8435Bc13B3d5Aeffe782F0B2B17',
    XMLM: import.meta.env.VITE_ELZORA_ADDRESS || import.meta.env.ELZORA_ADDRESS || '0xf21b249b1040d8435Bc13B3d5Aeffe782F0B2B17',
    AVX: import.meta.env.VITE_USDT_CONTRACT_ADDRESS || '0x90a1De2cC063786fC7e6C69514988cBb03E6665e',
    GATEWAY: import.meta.env.VITE_ELZORA_GATEWAY_ADDRESS || import.meta.env.ELZORA_GATEWAY_ADDRESS || '0xB900a1418728d5f3b98D96E8e26B2beA2A89b8D8',
    TREASURY: import.meta.env.VITE_TREASURY_WALLET || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5',
    ROOT_ID: import.meta.env.VITE_ROOT_ID || '0x23cC13FF391bBcbF573467138d5DF4D9174B64Eb',
    OWNER_ADDRESS: import.meta.env.VITE_OWNER_ADDRESS || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5',
  },
}

export const MAINNET_RPC_URL = import.meta.env.VITE_BSC_MAINNET_RPC || 'https://bsc-dataseed.binance.org'
export const TESTNET_RPC_URL = import.meta.env.VITE_BSC_TESTNET_RPC || 'https://bsc-testnet.publicnode.com'

export function getRpcUrl(chainId) {
  const num = Number(chainId)
  if (num === 97) return TESTNET_RPC_URL
  return MAINNET_RPC_URL
}

export function getContractAddresses(chainId) {
  const num = Number(chainId)
  if (num === 97) return CHAIN_CONTRACTS[97]
  return CHAIN_CONTRACTS[56]
}

export const CONTRACT_ADDRESSES = CHAIN_CONTRACTS[97]

export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const TETHER_STREAM_ABI = [
  {
    inputs: [
      { name: 'sponsor', type: 'address' },
      { name: 'packageId', type: 'uint8' },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimTrade',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'executeRebuy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimGlobalPool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUser',
    outputs: [
      {
        components: [
          { name: 'sponsor', type: 'address' },
          { name: 'packageId', type: 'uint8' },
          { name: 'active', type: 'bool' },
          { name: 'currentCycle', type: 'uint256' },
          { name: 'tradeCount', type: 'uint256' },
          { name: 'lastTradeTimestamp', type: 'uint256' },
          { name: 'rebuyBalance', type: 'uint256' },
          { name: 'pendingGlobalPoolIncome', type: 'uint256' },
          { name: 'directCount', type: 'uint256' },
          { name: 'premiumDirectCount', type: 'uint256' },
          { name: 'totalTradeClaims', type: 'uint256' },
          { name: 'totalTradeIncome', type: 'uint256' },
          { name: 'totalLevelIncome', type: 'uint256' },
          { name: 'totalPoolIncome', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getFrontendData',
    outputs: [
      {
        components: [
          { name: 'packageId', type: 'uint8' },
          { name: 'packagePrice', type: 'uint256' },
          { name: 'currentCycle', type: 'uint256' },
          { name: 'tradeCount', type: 'uint256' },
          { name: 'nextClaimTimestamp', type: 'uint256' },
          { name: 'remainingCooldown', type: 'uint256' },
          { name: 'currentCooldown', type: 'uint256' },
          { name: 'directCount', type: 'uint256' },
          { name: 'premiumDirectCount', type: 'uint256' },
          { name: 'rebuyBalance', type: 'uint256' },
          { name: 'pendingGlobalPoolIncome', type: 'uint256' },
          { name: 'isGlobalPoolEligible', type: 'bool' },
          { name: 'isGlobalPoolMember', type: 'bool' },
          { name: 'totalEarned', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'packageId', type: 'uint8' }],
    name: 'getPackage',
    outputs: [
      {
        components: [
          { name: 'price', type: 'uint256' },
          { name: 'maxTrades', type: 'uint256' },
          { name: 'tradeIncomeBps', type: 'uint256' },
          { name: 'rebuyBps', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paymentToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rootAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGlobalPoolBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGlobalPoolMemberCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

export const ELZORA_GATEWAY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "elzoraMainAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "checkAndAwardLifetimeMilestones",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "claimLifetimeMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "elzoraMain",
    "outputs": [
      {
        "internalType": "contract ElzoraMain",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getBinaryTeamSummary",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "leftChild",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "rightChild",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "leftDirects",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rightDirects",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "leftTotalMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rightTotalMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "leftCarryVolume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rightCarryVolume",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isMatchingQualified",
            "type": "bool"
          }
        ],
        "internalType": "struct ElzoraGateway.BinaryTeamSummary",
        "name": "summary",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentMonthEpoch",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentWeeklyEpoch",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getDirectReferrals",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getIncomeBreakdown",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "directIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "affiliateIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "clubIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "matchingIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "championIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "weeklyIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lifetimeIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "globalClubIncome",
            "type": "uint256"
          }
        ],
        "internalType": "struct IElzora.IncomeBreakdown",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "users",
        "type": "address[]"
      }
    ],
    "name": "getMultipleUserDashboards",
    "outputs": [
      {
        "components": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "userAddress",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "sponsor",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "parent",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "leftChild",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "rightChild",
                "type": "address"
              },
              {
                "internalType": "enum IElzora.BinaryPosition",
                "name": "position",
                "type": "uint8"
              },
              {
                "internalType": "bool",
                "name": "isRegistered",
                "type": "bool"
              },
              {
                "internalType": "uint256",
                "name": "directCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "leftDirectCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "rightDirectCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "leftTeamCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "rightTeamCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "leftCarryVolume",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "rightCarryVolume",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "currentRank",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "totalIncomeEarned",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "completedLifetimeMilestones",
                "type": "uint256"
              }
            ],
            "internalType": "struct IElzora.UserProfile",
            "name": "profile",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "directIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "affiliateIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "clubIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "matchingIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "championIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "weeklyIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "lifetimeIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "globalClubIncome",
                "type": "uint256"
              }
            ],
            "internalType": "struct IElzora.IncomeBreakdown",
            "name": "income",
            "type": "tuple"
          },
          {
            "internalType": "address[]",
            "name": "directReferrals",
            "type": "address[]"
          },
          {
            "internalType": "bool",
            "name": "isChampionEligible",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "pendingChampionReward",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isWeeklyEligibleCurrentEpoch",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "currentWeeklyDirects",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentWeeklyEpoch",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "todayMatchingPairs",
            "type": "uint256"
          },
          {
            "internalType": "uint256[27]",
            "name": "milestoneStatus",
            "type": "uint256[27]"
          },
          {
            "internalType": "uint256",
            "name": "globalClubEntriesCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "globalClubCyclesCompleted",
            "type": "uint256"
          }
        ],
        "internalType": "struct ElzoraGateway.UserDashboard[]",
        "name": "dashboards",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProtocolOverview",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "elzoraMainAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "gatewayAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "paymentToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "treasuryWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "rootAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "totalUsers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalRegistrationVolume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalIncomeDistributed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalLiabilities",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "contractTokenBalance",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isSolvent",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "championPoolBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "weeklyPoolBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentWeeklyEpoch",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentMonthEpoch",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "globalClubTotalEntries",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isPaused",
            "type": "bool"
          }
        ],
        "internalType": "struct ElzoraGateway.ProtocolOverview",
        "name": "overview",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUser",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "userAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "sponsor",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "parent",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "leftChild",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "rightChild",
            "type": "address"
          },
          {
            "internalType": "enum IElzora.BinaryPosition",
            "name": "position",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "isRegistered",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "directCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "leftDirectCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rightDirectCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "leftTeamCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rightTeamCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "leftCarryVolume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rightCarryVolume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentRank",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalIncomeEarned",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "completedLifetimeMilestones",
            "type": "uint256"
          }
        ],
        "internalType": "struct IElzora.UserProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserDashboard",
    "outputs": [
      {
        "components": [
          {
            "components": [
              {
                "internalType": "address",
                "name": "userAddress",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "sponsor",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "parent",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "leftChild",
                "type": "address"
              },
              {
                "internalType": "address",
                "name": "rightChild",
                "type": "address"
              },
              {
                "internalType": "enum IElzora.BinaryPosition",
                "name": "position",
                "type": "uint8"
              },
              {
                "internalType": "bool",
                "name": "isRegistered",
                "type": "bool"
              },
              {
                "internalType": "uint256",
                "name": "directCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "leftDirectCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "rightDirectCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "leftTeamCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "rightTeamCount",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "leftCarryVolume",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "rightCarryVolume",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "currentRank",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "totalIncomeEarned",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "completedLifetimeMilestones",
                "type": "uint256"
              }
            ],
            "internalType": "struct IElzora.UserProfile",
            "name": "profile",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "directIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "affiliateIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "clubIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "matchingIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "championIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "weeklyIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "lifetimeIncome",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "globalClubIncome",
                "type": "uint256"
              }
            ],
            "internalType": "struct IElzora.IncomeBreakdown",
            "name": "income",
            "type": "tuple"
          },
          {
            "internalType": "address[]",
            "name": "directReferrals",
            "type": "address[]"
          },
          {
            "internalType": "bool",
            "name": "isChampionEligible",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "pendingChampionReward",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isWeeklyEligibleCurrentEpoch",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "currentWeeklyDirects",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentWeeklyEpoch",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "todayMatchingPairs",
            "type": "uint256"
          },
          {
            "internalType": "uint256[27]",
            "name": "milestoneStatus",
            "type": "uint256[27]"
          },
          {
            "internalType": "uint256",
            "name": "globalClubEntriesCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "globalClubCyclesCompleted",
            "type": "uint256"
          }
        ],
        "internalType": "struct ElzoraGateway.UserDashboard",
        "name": "dash",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getUserGlobalClubHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "entryId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isReentry",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "originalEntryId",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isCompleted",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "cycleTimestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct IElzora.GlobalClubEntryInfo[]",
        "name": "entries",
        "type": "tuple[]"
      },
      {
        "internalType": "uint256",
        "name": "total",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      }
    ],
    "name": "getWeeklyQualifiers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "joinGlobalClub",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paymentToken",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "internalType": "enum IElzora.BinaryPosition",
        "name": "position",
        "type": "uint8"
      }
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rootAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

export const ELZORA_MAIN_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      }
    ],
    "name": "AddressEmptyCode",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyRegistered",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BatchSizeExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CannotSponsorSelf",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ChampionRewardAlreadyClaimed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CircularReferralDetected",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ContractInsolvent",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DailyMatchingCapExceeded",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "ERC1967InvalidImplementation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC1967NonPayable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FailedCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FirstPairNotQualified",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidGlobalClubAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidMilestoneIndex",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidParameters",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidPosition",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LifetimeMilestoneAlreadyClaimed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LifetimeMilestoneDirectsNotMet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LifetimeMilestoneNotReached",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MonthAlreadyDistributed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MonthNotClosed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoChampionMembers",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoPairsToMatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotEligibleForChampion",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotEligibleForWeekly",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitializing",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotRegistered",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NothingToWithdraw",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ParentNotActive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PositionAlreadyOccupied",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SponsorNotActive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UUPSUnauthorizedCallContext",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "slot",
        "type": "bytes32"
      }
    ],
    "name": "UUPSUnsupportedProxiableUUID",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Unauthorized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WeekAlreadyDistributed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WeekNotClosed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WeeklyRewardAlreadyClaimed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "fromUser",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "level",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "AffiliateIncomePaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "monthEpoch",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "startIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "endIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "membersPaid",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalBatchAmount",
        "type": "uint256"
      }
    ],
    "name": "ChampionBatchDistributed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "ChampionClubClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "monthEpoch",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalPool",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalMembers",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardPerMember",
        "type": "uint256"
      }
    ],
    "name": "ChampionMonthlyPoolSnapshot",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "rank",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "netProfit",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "upgradeFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sponsorIncome",
        "type": "uint256"
      }
    ],
    "name": "ClubRankAdvanced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "fromUser",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "DirectIncomePaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "EmergencyRescued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newReentryId",
        "type": "uint256"
      }
    ],
    "name": "GlobalClubCycleCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bool",
        "name": "isReentry",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "originalEntryId",
        "type": "uint256"
      }
    ],
    "name": "GlobalClubEntered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "milestoneIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "LifetimeRewardClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "matchedPairs",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "remainingLeftCarry",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "remainingRightCarry",
        "type": "uint256"
      }
    ],
    "name": "MatchingIncomePaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "intendedUser",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "category",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "MissedIncomeSentToTreasury",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldWallet",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newWallet",
        "type": "address"
      }
    ],
    "name": "TreasuryWalletUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "Upgraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum IElzora.BinaryPosition",
        "name": "position",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "UserRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "weekEpoch",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "startIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "endIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "membersPaid",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalBatchAmount",
        "type": "uint256"
      }
    ],
    "name": "WeeklyBatchDistributed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "weekEpoch",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalPool",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalQualifiers",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardPerQualifier",
        "type": "uint256"
      }
    ],
    "name": "WeeklyPoolSnapshot",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "WeeklyRewardClaimed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "AFFILIATE_INCOME_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CHAMPION_DIRECTS_REQUIRED",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CHAMPION_POOL_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CLUB_INCOME_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DIRECT_INCOME_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "GLOBAL_CLUB_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LIFETIME_POOL_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MATCHING_INCOME_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_CHAMPION_BATCH_SIZE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_DAILY_PAIRS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_UPLINE_LEVELS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_WEEKLY_BATCH_SIZE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "PAIR_RATE_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "REGISTRATION_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SECONDS_PER_DAY",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SECONDS_PER_MONTH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "SECONDS_PER_WEEK",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "UPGRADE_INTERFACE_VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WEEKLY_DIRECTS_REQUIRED",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WEEKLY_POOL_USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WEEK_EPOCH_ANCHOR",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cancelOwnershipTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "championMembers",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "championMonthlyRecords",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalPool",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalMembers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rewardPerMember",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "distributedMembersCount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isSnapshotCreated",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isFullyDistributed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "championPoolBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "checkAndAwardLifetimeMilestones",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "milestoneIndex",
        "type": "uint256"
      }
    ],
    "name": "claimLifetimeMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "clubRanks",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "requiredMembers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "grossIncome",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "upgradeFee",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "sponsorIncome",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "netProfit",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "monthEpoch",
        "type": "uint256"
      }
    ],
    "name": "createChampionMonthlySnapshot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      }
    ],
    "name": "createWeeklyPoolSnapshot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "monthEpoch",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "batchSize",
        "type": "uint256"
      }
    ],
    "name": "distributeChampionBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "batchSize",
        "type": "uint256"
      }
    ],
    "name": "distributeWeeklyBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "emergencyRescue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gatewayContract",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getChampionMembers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getChampionMembersCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentMonthEpoch",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentWeeklyEpoch",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getDirectReferrals",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGlobalClubEntriesCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      }
    ],
    "name": "getGlobalClubEntry",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "entryId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isReentry",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "originalEntryId",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isCompleted",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "cycleTimestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct IElzora.GlobalClubEntryInfo",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getIncomeBreakdown",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "directIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "affiliateIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "clubIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "matchingIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "championIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "weeklyIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lifetimeIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "globalClubIncome",
            "type": "uint256"
          }
        ],
        "internalType": "struct IElzora.IncomeBreakdown",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProtocolStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "elzoraMain",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "paymentToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "treasuryWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "rootAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "totalUsers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalRegistrationVolume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalIncomeDistributed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalLiabilities",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "contractTokenBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "globalClubTotalEntries",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "championPoolBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "weeklyPoolBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentWeeklyEpoch",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentMonthEpoch",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isPaused",
            "type": "bool"
          }
        ],
        "internalType": "struct IElzora.ProtocolStats",
        "name": "stats",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "milestoneIndex",
        "type": "uint256"
      }
    ],
    "name": "getRequiredDirectsForMilestone",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUser",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "userAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "sponsor",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "parent",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "leftChild",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "rightChild",
            "type": "address"
          },
          {
            "internalType": "enum IElzora.BinaryPosition",
            "name": "position",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "isRegistered",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "directCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "leftDirectCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rightDirectCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "leftTeamCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rightTeamCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "leftCarryVolume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "rightCarryVolume",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentRank",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalIncomeEarned",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "completedLifetimeMilestones",
            "type": "uint256"
          }
        ],
        "internalType": "struct IElzora.UserProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "rankIndex",
        "type": "uint256"
      }
    ],
    "name": "getUserClubProgress",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserGlobalClubEntries",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      }
    ],
    "name": "getWeeklyQualifiers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "epoch",
        "type": "uint256"
      }
    ],
    "name": "getWeeklyQualifiersCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "globalClubEntries",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "entryId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isReentry",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "originalEntryId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isCompleted",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "cycleTimestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "globalClubQueueHead",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "hasClaimedMilestone",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasReceivedChampionMonth",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasReceivedWeeklyReward",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "initialPaymentToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "initialTreasury",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "initialRoot",
        "type": "address"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isAuthorizedGateway",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isChampionMember",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isWeeklyQualifier",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "joinGlobalClub",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "joinGlobalClubFor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "lifetimeMilestones",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "requiredLeft",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "requiredRight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paymentToken",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proxiableUUID",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "internalType": "enum IElzora.BinaryPosition",
        "name": "position",
        "type": "uint8"
      }
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "sponsor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "parent",
        "type": "address"
      },
      {
        "internalType": "enum IElzora.BinaryPosition",
        "name": "position",
        "type": "uint8"
      }
    ],
    "name": "registerFor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rootAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "gateway",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "authorized",
        "type": "bool"
      }
    ],
    "name": "setAuthorizedGateway",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "gateway",
        "type": "address"
      }
    ],
    "name": "setGatewayContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "requiredLeft",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "requiredRight",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      }
    ],
    "name": "setLifetimeMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newStartTime",
        "type": "uint256"
      }
    ],
    "name": "setSystemStartTime",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newTreasury",
        "type": "address"
      }
    ],
    "name": "setTreasuryWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "systemStartTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenUnit",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalIncomeDistributed",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalLiabilities",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRegistrationVolume",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalUsers",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasuryWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "upgradeToAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userClubProgress",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userDailyPairs",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userGlobalClubTotalCycles",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userRankCompleted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "weeklyDirectCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "weeklyEpochRecords",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalPool",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalQualifiers",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rewardPerQualifier",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "distributedMembersCount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isSnapshotCreated",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isFullyDistributed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "weeklyPoolBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

export const TETHER_STREAM_GATEWAY_ABI = ELZORA_GATEWAY_ABI
export const AVENTRA_XMLM_ABI = ELZORA_MAIN_ABI
export const AVENTRA_GATEWAY_ABI = ELZORA_GATEWAY_ABI
export const AVENTRA_TOKEN_ABI = ERC20_ABI
