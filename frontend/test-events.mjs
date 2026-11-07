import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem'
import { bscTestnet } from 'viem/chains'

const client = createPublicClient({ chain: bscTestnet, transport: http() })
const XMLM = '0x35Dd2c6Dad73C42a058dcAa5dF4F073506033dfD'

async function fetchLogsInChunks(eventAbi, fromBlock, toBlock, chunkSize = 2000n) {
  let allLogs = []
  for (let current = fromBlock; current <= toBlock; current += chunkSize) {
    const end = current + chunkSize - 1n > toBlock ? toBlock : current + chunkSize - 1n
    try {
      const logs = await client.getLogs({
        address: XMLM,
        event: eventAbi,
        fromBlock: current,
        toBlock: end,
      })
      allLogs = allLogs.concat(logs)
    } catch (e) {
      // console.warn(`Error on chunk ${current}-${end}:`, e.message)
    }
  }
  return allLogs
}

async function check() {
  const currentBlock = await client.getBlockNumber()
  // Look back 15,000 blocks (about 12 hours)
  const fromBlock = currentBlock - 15000n

  const roiEvent = parseAbiItem('event DailyRoiClaimed(address indexed user, uint256 usdAmount, uint256 avxTokensSent)')
  const roiLogs = await fetchLogsInChunks(roiEvent, fromBlock, currentBlock)
  console.log('=== DailyRoiClaimed count:', roiLogs.length)
  for (const l of roiLogs) {
    console.log(`ROI: user=${l.args.user}, usd=${formatUnits(l.args.usdAmount, 6)}, avx=${formatUnits(l.args.avxTokensSent, 6)}, tx=${l.transactionHash}`)
  }

  const levelEvent = parseAbiItem('event LevelIncomePaid(address indexed upline, address indexed downline, uint256 level, uint256 usdAmount, uint256 avxTokensSent)')
  const levelLogs = await fetchLogsInChunks(levelEvent, fromBlock, currentBlock)
  console.log('=== LevelIncomePaid count:', levelLogs.length)
  for (const l of levelLogs) {
    console.log(`Level: upline=${l.args.upline}, downline=${l.args.downline}, lvl=${l.args.level}, usd=${formatUnits(l.args.usdAmount, 6)}, avx=${formatUnits(l.args.avxTokensSent, 6)}, tx=${l.transactionHash}`)
  }
}

check().catch(console.error)
