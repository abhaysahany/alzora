import { useState, useEffect, useCallback } from 'react'
import { useChainId } from 'wagmi'
import { createPublicClient, http as viemHttp, formatUnits, parseAbiItem, isAddress } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { getContractAddresses, getRpcUrl, ELZORA_GATEWAY_ABI, ELZORA_MAIN_ABI } from '../web3/contracts'

const RANK_NAMES = {
  1: 'Starter',
  2: 'Bronze Club',
  3: 'Silver Club',
  4: 'Gold Club',
  5: 'Platinum Club',
  6: 'Diamond Club',
  7: 'Crown Diamond',
  8: 'Legend',
}

/** BFS-traverse the sponsor tree via getDirectReferrals and return all discovered addresses */
async function discoverAllMembersViaBFS(publicClient, gatewayAddr, rootAddr, ELZORA_GATEWAY_ABI) {
  const visited = new Set()
  const queue = [rootAddr]
  visited.add(rootAddr.toLowerCase())

  let safety = 0
  const MAX_ITERATIONS = 500 // prevent infinite loops

  while (queue.length > 0 && safety < MAX_ITERATIONS) {
    safety++
    // Process in batches of 10 to avoid overwhelming the RPC
    const batch = queue.splice(0, 10)

    const results = await Promise.allSettled(
      batch.map((addr) =>
        publicClient.readContract({
          address: gatewayAddr,
          abi: ELZORA_GATEWAY_ABI,
          functionName: 'getDirectReferrals',
          args: [addr],
        })
      )
    )

    for (let i = 0; i < batch.length; i++) {
      const result = results[i]
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        for (const child of result.value) {
          if (!child || typeof child !== 'string') continue
          const lc = child.toLowerCase()
          if (
            lc &&
            lc.startsWith('0x') &&
            lc.length === 42 &&
            lc !== '0x0000000000000000000000000000000000000000' &&
            !visited.has(lc)
          ) {
            visited.add(lc)
            queue.push(child) // keep original casing for contract calls
          }
        }
      }
    }
  }

  return Array.from(visited)
}

export function useAdminMembers() {
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)
  const rpcUrl = getRpcUrl(chainId)
  const activeChain = Number(chainId) === 97 ? bscTestnet : bsc

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    totalInvestedUsd: 0,
    totalIncomePaidUsd: 0,
    totalDirects: 0,
    totalLeftMembers: 0,
    totalRightMembers: 0,
    activeRate: 0,
  })

  const fetchMembersData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const publicClient = createPublicClient({
        chain: activeChain,
        transport: viemHttp(rpcUrl),
      })

      const gatewayAddr = contractAddresses.GATEWAY
      const mainAddr = contractAddresses.TETHER_STREAM
      const rootAddr = (contractAddresses.ROOT_ID || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5')

      // ── PRIMARY: BFS traversal via getDirectReferrals ──────────────────────
      const bfsAddresses = await discoverAllMembersViaBFS(
        publicClient,
        gatewayAddr,
        rootAddr,
        ELZORA_GATEWAY_ABI
      )

      const memberAddressesSet = new Set(bfsAddresses.map((a) => a.toLowerCase()))

      // ── SECONDARY: Event log discovery (catches any BFS gaps) ──────────────
      try {
        const userRegEvent = parseAbiItem(
          'event UserRegistered(address indexed user, address indexed sponsor, address indexed parent, uint8 position, uint256 timestamp)'
        )
        const logs = await publicClient
          .getLogs({
            address: mainAddr,
            event: userRegEvent,
            fromBlock: 'earliest',
            toBlock: 'latest',
          })
          .catch(() => [])

        logs.forEach((l) => {
          const addAddr = (addr) => {
            if (!addr || typeof addr !== 'string') return
            const clean = addr.toLowerCase().trim()
            if (
              clean &&
              clean.startsWith('0x') &&
              clean.length === 42 &&
              clean !== '0x0000000000000000000000000000000000000000'
            ) {
              memberAddressesSet.add(clean)
            }
          }
          if (l.args?.user) addAddr(l.args.user)
          if (l.args?.sponsor) addAddr(l.args.sponsor)
          if (l.args?.parent) addAddr(l.args.parent)
        })
      } catch (e) {
        console.warn('Event log fetch failed (non-critical):', e)
      }

      // ── TERTIARY: localStorage cache ───────────────────────────────────────
      if (typeof localStorage !== 'undefined') {
        try {
          const cacheKey = `elzora_known_users_${mainAddr.toLowerCase()}`
          const stored = JSON.parse(localStorage.getItem(cacheKey) || '[]')
          if (Array.isArray(stored)) {
            stored.forEach((addr) => {
              if (addr && addr.startsWith('0x') && addr.length === 42) {
                memberAddressesSet.add(addr.toLowerCase())
              }
            })
          }
        } catch {}
      }

      const allAddrs = Array.from(memberAddressesSet)

      // Save discovered addresses back to cache
      if (typeof localStorage !== 'undefined') {
        try {
          const cacheKey = `elzora_known_users_${mainAddr.toLowerCase()}`
          localStorage.setItem(cacheKey, JSON.stringify(allAddrs))
        } catch {}
      }

      // ── Batch query member dashboards ──────────────────────────────────────
      const rootLower = rootAddr.toLowerCase()

      const memberList = await Promise.all(
        allAddrs.map(async (addr, index) => {
          try {
            const dash = await publicClient.readContract({
              address: gatewayAddr,
              abi: ELZORA_GATEWAY_ABI,
              functionName: 'getUserDashboard',
              args: [addr],
            })

            const prof = dash.profile
            const inc = dash.income

            const isReg = Boolean(prof.isRegistered) || addr.toLowerCase() === rootLower
            const currentRank = Number(prof.currentRank || 1)
            const directCount = Number(prof.directCount || 0n)
            const leftTeam = Number(prof.leftTeamCount || 0n)
            const rightTeam = Number(prof.rightTeamCount || 0n)
            const leftCarry = Number(prof.leftCarryVolume || 0n)
            const rightCarry = Number(prof.rightCarryVolume || 0n)
            const totalEarned = Number(formatUnits(prof.totalIncomeEarned || 0n, 6))
            const withdrawable = Number(formatUnits(prof.withdrawableBalance || 0n, 6))
            const withdrawn = Number(formatUnits(prof.totalWithdrawn || 0n, 6))

            return {
              id: index + 1,
              address: addr,
              wallet: addr,
              sponsor: prof.sponsor || '0x0000000000000000000000000000000000000000',
              binaryParent: prof.binaryParent || '0x0000000000000000000000000000000000000000',
              position: Number(prof.position || 1),
              active: isReg,
              status: isReg ? 'ACTIVE' : 'INACTIVE',
              packageId: 1,
              packageAmount: 50,
              packageName: 'Core Registration ($50)',
              investment: isReg ? 50 : 0,
              currentRank,
              rank: currentRank,
              rankName: RANK_NAMES[currentRank] || 'Starter',
              directCount,
              leftDirectCount: Number(prof.leftDirectCount || 0n),
              rightDirectCount: Number(prof.rightDirectCount || 0n),
              leftTeamCount: leftTeam,
              rightTeamCount: rightTeam,
              teamVolume: leftTeam + rightTeam,
              leftCarryVolume: leftCarry,
              rightCarryVolume: rightCarry,
              hasMatchedFirstPair: Boolean(prof.hasMatchedFirstPair),
              totalEarned,
              totalIncome: totalEarned,
              withdrawableBalance: withdrawable,
              totalWithdrawn: withdrawn,
              remainingCap: 0,
              directIncome: Number(formatUnits(inc.directIncome || 0n, 6)),
              affiliateIncome: Number(formatUnits(inc.affiliateIncome || 0n, 6)),
              clubIncome: Number(formatUnits(inc.clubIncome || 0n, 6)),
              matchingIncome: Number(formatUnits(inc.matchingIncome || 0n, 6)),
              championIncome: Number(formatUnits(inc.championIncome || 0n, 6)),
              weeklyIncome: Number(formatUnits(inc.weeklyIncome || 0n, 6)),
              lifetimeIncome: Number(formatUnits(inc.lifetimeIncome || 0n, 6)),
              globalClubIncome: Number(formatUnits(inc.globalClubIncome || 0n, 6)),
              directReferrals: dash.directReferrals || [],
              isChampionEligible: Boolean(dash.isChampionEligible),
            }
          } catch (err) {
            // Return minimal stub so the address still appears in the list
            return {
              id: index + 1,
              address: addr,
              wallet: addr,
              sponsor: '0x0000000000000000000000000000000000000000',
              binaryParent: '0x0000000000000000000000000000000000000000',
              position: 1,
              active: addr.toLowerCase() === rootLower,
              status: addr.toLowerCase() === rootLower ? 'ACTIVE' : 'INACTIVE',
              packageId: 1,
              packageAmount: 50,
              packageName: 'Core Registration ($50)',
              investment: addr.toLowerCase() === rootLower ? 50 : 0,
              currentRank: 1,
              rank: 1,
              rankName: 'Starter',
              directCount: 0,
              leftDirectCount: 0,
              rightDirectCount: 0,
              leftTeamCount: 0,
              rightTeamCount: 0,
              teamVolume: 0,
              leftCarryVolume: 0,
              rightCarryVolume: 0,
              hasMatchedFirstPair: false,
              totalEarned: 0,
              totalIncome: 0,
              withdrawableBalance: 0,
              totalWithdrawn: 0,
              remainingCap: 0,
              directIncome: 0,
              affiliateIncome: 0,
              clubIncome: 0,
              matchingIncome: 0,
              championIncome: 0,
              weeklyIncome: 0,
              lifetimeIncome: 0,
              globalClubIncome: 0,
              directReferrals: [],
              isChampionEligible: false,
            }
          }
        })
      )

      // Filter to only show registered members
      const registeredMembers = memberList.filter((m) => m.active)

      // Re-assign sequential IDs
      registeredMembers.forEach((m, i) => { m.id = i + 1 })

      setMembers(registeredMembers)

      // Calculate aggregates
      const activeCount = registeredMembers.filter((m) => m.active).length
      const totalInvestedUsd = activeCount * 50
      const totalIncomePaidUsd = registeredMembers.reduce((acc, m) => acc + (m.totalIncome || 0), 0)
      const totalDirects = registeredMembers.reduce((acc, m) => acc + (m.directCount || 0), 0)
      const totalLeftMembers = registeredMembers.reduce((acc, m) => acc + (m.leftTeamCount || 0), 0)
      const totalRightMembers = registeredMembers.reduce((acc, m) => acc + (m.rightTeamCount || 0), 0)

      setStats({
        totalCount: registeredMembers.length,
        activeCount,
        inactiveCount: registeredMembers.length - activeCount,
        totalInvestedUsd,
        totalIncomePaidUsd,
        totalDirects,
        totalLeftMembers,
        totalRightMembers,
        activeRate:
          registeredMembers.length > 0
            ? ((activeCount / registeredMembers.length) * 100).toFixed(1)
            : 100,
      })
    } catch (err) {
      console.error('Error fetching admin members:', err)
      setError(err?.message || 'Failed to load member records')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeChain, contractAddresses.GATEWAY, contractAddresses.ROOT_ID, contractAddresses.TETHER_STREAM, rpcUrl])

  useEffect(() => {
    fetchMembersData()
  }, [fetchMembersData])

  const fetchMemberDirectReferrals = async (memberAddress) => {
    if (!isAddress(memberAddress)) return []
    try {
      const publicClient = createPublicClient({ chain: activeChain, transport: viemHttp(rpcUrl) })
      return await publicClient.readContract({
        address: contractAddresses.GATEWAY,
        abi: ELZORA_GATEWAY_ABI,
        functionName: 'getDirectReferrals',
        args: [memberAddress],
      })
    } catch {
      return []
    }
  }

  return {
    members,
    stats,
    loading,
    refreshing,
    error,
    refresh: () => fetchMembersData(true),
    fetchMemberDirectReferrals,
  }
}

export default useAdminMembers
