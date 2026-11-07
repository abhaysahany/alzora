import { createPublicClient, http, parseAbi, formatUnits, parseAbiItem } from 'viem'
import { bscTestnet } from 'viem/chains'

const client = createPublicClient({ chain: bscTestnet, transport: http() })
const XMLM = '0x35Dd2c6Dad73C42a058dcAa5dF4F073506033dfD'

async function check() {
  const total = await client.readContract({
    address: XMLM,
    abi: parseAbi(['function totalMembers() view returns (uint256)']),
    functionName: 'totalMembers',
  })
  console.log('=== Total Members:', Number(total))

  for (let i = 1; i <= Number(total); i++) {
    const addr = await client.readContract({
      address: XMLM,
      abi: parseAbi(['function idToAddress(uint256) view returns (address)']),
      functionName: 'idToAddress',
      args: [BigInt(i)],
    })
    const member = await client.readContract({
      address: XMLM,
      abi: parseAbi([
        'function getMember(address) view returns ((address sponsor, bool active, uint256 packageId, uint256 packageAmount, uint256 totalInvestment, uint256 registrationTime, uint256 packageTimestamp, uint256 lastRoiClaimTime, uint256 directReferralCount, uint256 teamVolume, uint8 currentRank, uint256 rankQualificationTime, uint256 rankMonthsPaid, uint256 lastRankClaimTime))',
      ]),
      functionName: 'getMember',
      args: [addr],
    })
    const stats = await client.readContract({
      address: XMLM,
      abi: parseAbi([
        'function userIncomeStats(address) view returns (uint256 nonWorkingIncomeUsd, uint256 workingIncomeUsd, uint256 totalIncomeUsd, uint256 directIncomeUsd, uint256 levelIncomeUsd, uint256 rankIncomeUsd)',
      ]),
      functionName: 'userIncomeStats',
      args: [addr],
    }).catch(() => null)

    const isL1Unlocked = await client.readContract({
      address: XMLM,
      abi: parseAbi(['function isLevelUnlocked(address, uint256) view returns (bool)']),
      functionName: 'isLevelUnlocked',
      args: [addr, 1n],
    })

    const isL2Unlocked = await client.readContract({
      address: XMLM,
      abi: parseAbi(['function isLevelUnlocked(address, uint256) view returns (bool)']),
      functionName: 'isLevelUnlocked',
      args: [addr, 2n],
    })

    console.log(`Member #${i} (${addr}):`)
    console.log(`  Sponsor: ${member.sponsor}`)
    console.log(`  Active: ${member.active}, PkgId: ${member.packageId}, Invested: ${formatUnits(member.totalInvestment, 6)} USDT`)
    console.log(`  Directs: ${member.directReferralCount.toString()}, TeamVol: ${formatUnits(member.teamVolume, 6)} USDT`)
    console.log(`  L1 Unlocked: ${isL1Unlocked}, L2 Unlocked: ${isL2Unlocked}`)
    if (stats) {
      console.log(`  Income Stats: LevelInc=${formatUnits(stats[4], 6)}, DirectInc=${formatUnits(stats[3], 6)}, NonWorking=${formatUnits(stats[0], 6)}, Total=${formatUnits(stats[2], 6)}`)
    }
  }

  // Check Level percentages in contract
  for (let l = 1; l <= 5; l++) {
    const bps = await client.readContract({
      address: XMLM,
      abi: parseAbi(['function levelPercentagesBps(uint256) view returns (uint256)']),
      functionName: 'levelPercentagesBps',
      args: [BigInt(l)],
    })
    console.log(`Level ${l} %: ${Number(bps) / 100}% (${Number(bps)} bps)`)
  }

  // Check LevelIncomePaid logs
  const currentBlock = await client.getBlockNumber()
  const logs = await client.getLogs({
    address: XMLM,
    event: parseAbiItem('event LevelIncomePaid(address indexed upline, address indexed claimer, uint256 level, uint256 amountUsd, uint256 avxAmount)'),
    fromBlock: currentBlock > 50000n ? currentBlock - 50000n : 0n,
    toBlock: 'latest',
  }).catch((e) => [])

  console.log('=== LevelIncomePaid Events count:', logs.length)
  logs.forEach((l, idx) => {
    console.log(`Event #${idx + 1}: upline=${l.args.upline}, claimer=${l.args.claimer}, level=${l.args.level}, amountUsd=${formatUnits(l.args.amountUsd, 6)}, avx=${formatUnits(l.args.avxAmount, 6)}`)
  })
}

check().catch(console.error)
