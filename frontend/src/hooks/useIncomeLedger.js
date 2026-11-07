import { useMemo } from 'react'
import { useChainId } from 'wagmi'
import { useTetherStream } from './useTetherStream'
import { useWalletAuth } from './useWalletAuth'
import { useAdminMembers } from './useAdminMembers'
import { getContractAddresses } from '../web3/contracts'

export function useIncomeLedger() {
  const { address } = useWalletAuth()
  const { profile, incomeBreakdown } = useTetherStream()
  const { members } = useAdminMembers()
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)

  const avxPrice = 1.0

  const userIncomeEntries = useMemo(() => {
    if (!profile) return []

    const entries = []
    let idCounter = 100

    if (Number(incomeBreakdown?.directIncome || 0) > 0) {
      entries.push({
        id: `LOG-${idCounter++}`,
        category: 'DIRECT_BONUS',
        title: 'Direct Referral Commission (20%)',
        stream: 'Direct Sponsor ($10 / Member)',
        amountUsd: Number(incomeBreakdown.directIncome),
        source: 'Direct Sponsorship',
        date: 'On Registration',
        status: 'Distributed On-Chain',
        color: '#c084fc',
      })
    }

    if (Number(incomeBreakdown?.affiliateIncome || 0) > 0) {
      entries.push({
        id: `LOG-${idCounter++}`,
        category: 'AFFILIATE_LEVEL',
        title: '20-Level Network Affiliate Income',
        stream: 'Level Matrix ($0.40 L1-10, $0.30 L11-20)',
        amountUsd: Number(incomeBreakdown.affiliateIncome),
        source: '20-Tier Upline Network',
        date: 'On Downline Registration',
        status: 'Distributed On-Chain',
        color: '#38bdf8',
      })
    }

    if (Number(incomeBreakdown?.matchingIncome || 0) > 0) {
      entries.push({
        id: `LOG-${idCounter++}`,
        category: 'BINARY_MATCHING',
        title: 'Binary Matching Pair Rewards ($2/pair)',
        stream: 'Binary Tree Matching (20%)',
        amountUsd: Number(incomeBreakdown.matchingIncome),
        source: 'Binary Tree Volume',
        date: 'On Pair Match',
        status: 'Distributed On-Chain',
        color: '#4ade80',
      })
    }

    if (Number(incomeBreakdown?.clubIncome || 0) > 0) {
      entries.push({
        id: `LOG-${idCounter++}`,
        category: 'CLUB_MATRIX',
        title: 'Club Cascading Matrix Reward',
        stream: `Club Ranks Matrix (24%)`,
        amountUsd: Number(incomeBreakdown.clubIncome),
        source: 'Club Matrix Queue',
        date: 'On Matrix Cycle',
        status: 'Distributed On-Chain',
        color: '#a855f7',
      })
    }

    if (Number(incomeBreakdown?.championIncome || 0) > 0) {
      entries.push({
        id: `LOG-${idCounter++}`,
        category: 'CHAMPION_ROYALTY',
        title: 'Champion Club 6% Global Royalty',
        stream: 'Champion Pool Share (6%)',
        amountUsd: Number(incomeBreakdown.championIncome),
        source: 'Global Protocol Pool',
        date: '30 Directs Royalty',
        status: 'Distributed On-Chain',
        color: '#fbbf24',
      })
    }

    if (Number(incomeBreakdown?.weeklyIncome || 0) > 0) {
      entries.push({
        id: `LOG-${idCounter++}`,
        category: 'WEEKLY_REWARD',
        title: 'Weekly Performance Pool Payout',
        stream: 'Weekly Pool Share (6%)',
        amountUsd: Number(incomeBreakdown.weeklyIncome),
        source: 'Weekly Top Sponsors',
        date: 'Weekly Epoch Close',
        status: 'Distributed On-Chain',
        color: '#f43f5e',
      })
    }

    if (Number(incomeBreakdown?.lifetimeIncome || 0) > 0) {
      entries.push({
        id: `LOG-${idCounter++}`,
        category: 'LIFETIME_MILESTONE',
        title: 'Lifetime Milestone Volume Reward',
        stream: '27 Lifetime Milestones (10%)',
        amountUsd: Number(incomeBreakdown.lifetimeIncome),
        source: 'Cumulative Binary Volume',
        date: 'Milestone Attained',
        status: 'Distributed On-Chain',
        color: '#818cf8',
      })
    }

    if (Number(incomeBreakdown?.globalClubIncome || 0) > 0) {
      entries.push({
        id: `LOG-${idCounter++}`,
        category: 'GLOBAL_CLUB',
        title: 'Global Club ($25 Queue) Payout',
        stream: '1-to-2 Queue Matrix ($25 cycle)',
        amountUsd: Number(incomeBreakdown.globalClubIncome),
        source: 'Global Queue Re-entry',
        date: 'On Queue Fill',
        status: 'Distributed On-Chain',
        color: '#06b6d4',
      })
    }

    return entries
  }, [profile, incomeBreakdown])

  const adminGlobalIncomeEntries = useMemo(() => {
    if (!members || !Array.isArray(members) || members.length === 0) {
      return []
    }

    const globalEntries = []
    let logIdx = 1

    members.forEach((m) => {
      const memberShort = m.address ? `${m.address.slice(0, 6)}...${m.address.slice(-4)}` : '0x0000...0000'

      if (m.directIncome > 0) {
        globalEntries.push({
          id: `INC-DIR-${logIdx++}`,
          wallet: m.address,
          member: memberShort,
          category: 'DIRECT_BONUS',
          title: 'Direct Referral Commission (20%)',
          stream: 'Direct Sponsor ($10 / Member)',
          amountUsd: m.directIncome,
          source: 'Direct Sponsorship',
          date: 'Confirmed On-Chain',
          status: 'Distributed On-Chain',
          color: '#c084fc',
        })
      }

      if (m.affiliateIncome > 0) {
        globalEntries.push({
          id: `INC-AFF-${logIdx++}`,
          wallet: m.address,
          member: memberShort,
          category: 'AFFILIATE_LEVEL',
          title: '20-Level Network Affiliate Income',
          stream: 'Level Matrix ($0.40 L1-10, $0.30 L11-20)',
          amountUsd: m.affiliateIncome,
          source: '20-Tier Upline Network',
          date: 'Confirmed On-Chain',
          status: 'Distributed On-Chain',
          color: '#38bdf8',
        })
      }

      if (m.matchingIncome > 0) {
        globalEntries.push({
          id: `INC-MAT-${logIdx++}`,
          wallet: m.address,
          member: memberShort,
          category: 'BINARY_MATCHING',
          title: 'Binary Matching Pair Rewards ($2/pair)',
          stream: 'Binary Tree Matching (20%)',
          amountUsd: m.matchingIncome,
          source: 'Binary Tree Volume',
          date: 'Confirmed On-Chain',
          status: 'Distributed On-Chain',
          color: '#4ade80',
        })
      }

      if (m.clubIncome > 0) {
        globalEntries.push({
          id: `INC-CLB-${logIdx++}`,
          wallet: m.address,
          member: memberShort,
          category: 'CLUB_MATRIX',
          title: `Club Cascading Matrix (${m.rankName})`,
          stream: 'Club Ranks Matrix (24%)',
          amountUsd: m.clubIncome,
          source: 'Club Matrix Queue',
          date: 'Confirmed On-Chain',
          status: 'Distributed On-Chain',
          color: '#a855f7',
        })
      }

      if (m.championIncome > 0) {
        globalEntries.push({
          id: `INC-CHP-${logIdx++}`,
          wallet: m.address,
          member: memberShort,
          category: 'CHAMPION_ROYALTY',
          title: 'Champion Club 6% Global Royalty',
          stream: 'Champion Pool Share (6%)',
          amountUsd: m.championIncome,
          source: 'Global Protocol Pool',
          date: 'Confirmed On-Chain',
          status: 'Distributed On-Chain',
          color: '#fbbf24',
        })
      }

      if (m.globalClubIncome > 0) {
        globalEntries.push({
          id: `INC-GC-${logIdx++}`,
          wallet: m.address,
          member: memberShort,
          category: 'GLOBAL_CLUB',
          title: 'Global Club ($25 Queue) Payout',
          stream: '1-to-2 Queue Matrix ($25 cycle)',
          amountUsd: m.globalClubIncome,
          source: 'Global Queue Re-entry',
          date: 'Confirmed On-Chain',
          status: 'Distributed On-Chain',
          color: '#06b6d4',
        })
      }
    })

    return globalEntries
  }, [members])

  return {
    userIncomeEntries,
    adminGlobalIncomeEntries,
    avxPrice,
  }
}

export default useIncomeLedger
