import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem'
import { bscTestnet } from 'viem/chains'

const client = createPublicClient({
  chain: bscTestnet,
  transport: http('https://bsc-testnet-rpc.publicnode.com'),
})
const XMLM = '0x35Dd2c6Dad73C42a058dcAa5dF4F073506033dfD'

async function check() {
  const currentBlock = await client.getBlockNumber()
  const fromBlock = currentBlock - 10000n

  const roiEvent = parseAbiItem('event DailyRoiClaimed(address indexed user, uint256 usdAmount, uint256 avxTokensSent)')
  const roiLogs = await client.getLogs({
    address: XMLM,
    event: roiEvent,
    fromBlock,
    toBlock: 'latest',
  }).catch((e) => {
    console.warn('ROI Err:', e.message)
    return []
  })
  console.log('=== DailyRoiClaimed count:', roiLogs.length)
  for (const l of roiLogs) {
    console.log(`ROI: user=${l.args.user}, usd=${formatUnits(l.args.usdAmount, 6)}, avx=${formatUnits(l.args.avxTokensSent, 6)}, tx=${l.transactionHash}`)
  }

  const dirEvent = parseAbiItem('event DirectIncomePaid(address indexed sponsor, address indexed buyer, uint256 usdAmount, uint256 avxTokensSent)')
  const dirLogs = await client.getLogs({
    address: XMLM,
    event: dirEvent,
    fromBlock,
    toBlock: 'latest',
  }).catch((e) => {
    console.warn('Direct Err:', e.message)
    return []
  })
  console.log('=== DirectIncomePaid count:', dirLogs.length)
  for (const l of dirLogs) {
    console.log(`Direct: sponsor=${l.args.sponsor}, buyer=${l.args.buyer}, usd=${formatUnits(l.args.usdAmount, 6)}, avx=${formatUnits(l.args.avxTokensSent, 6)}, tx=${l.transactionHash}`)
  }
}

check().catch(console.error)
