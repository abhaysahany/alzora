import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem'
import { bscTestnet } from 'viem/chains'

const client = createPublicClient({
  chain: bscTestnet,
  transport: http('https://bsc-testnet-rpc.publicnode.com'),
})
const XMLM = '0x35Dd2c6Dad73C42a058dcAa5dF4F073506033dfD'

async function check() {
  const currentBlock = await client.getBlockNumber()
  console.log('Current block:', currentBlock)

  const levelEvent = parseAbiItem('event LevelIncomePaid(address indexed upline, address indexed downline, uint256 level, uint256 usdAmount, uint256 avxTokensSent)')

  const logs = await client.getLogs({
    address: XMLM,
    event: levelEvent,
    fromBlock: currentBlock - 5000n,
    toBlock: 'latest',
  }).catch((e) => {
    console.warn('Err:', e.message)
    return []
  })

  console.log('=== Total LevelIncomePaid logs found in last 5000 blocks:', logs.length)
  for (const l of logs) {
    const block = await client.getBlock({ blockNumber: l.blockNumber })
    console.log(`Log: upline=${l.args.upline}, downline=${l.args.downline}, level=${l.args.level}, usd=${formatUnits(l.args.usdAmount, 6)}, avx=${formatUnits(l.args.avxTokensSent, 6)}, tx=${l.transactionHash}, time=${new Date(Number(block.timestamp) * 1000).toLocaleString()}`)
  }
}

check().catch(console.error)
