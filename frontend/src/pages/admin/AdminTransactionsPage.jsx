import React, { useState, useEffect, useMemo } from 'react'
import { useChainId } from 'wagmi'
import { AdminLayout } from '../../components/AdminLayout'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { getContractAddresses, getRpcUrl, getTokenDecimals } from '../../web3/contracts'
import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import {
  Receipt,
  Search,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Download,
  Zap,
  Users,
  Award,
  DollarSign,
  Layers,
  TrendingUp,
} from 'lucide-react'

export function AdminTransactionsPage() {
  const { address } = useWalletAuth()
  const chainId = useChainId()
  const CONTRACT_ADDRESSES = getContractAddresses(chainId)
  const rpcUrl = getRpcUrl(chainId)
  const isMainnet = Number(chainId) === 56
  const tokenDecimals = getTokenDecimals(chainId)
  const activeChain = isMainnet ? bsc : bscTestnet
  const explorerUrl = isMainnet ? 'https://bscscan.com' : 'https://testnet.bscscan.com'

  // Filter state (WITHDRAWAL tab removed as income is instantly distributed on-chain)
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'REGISTRATION' | 'DIRECT_AFFILIATE' | 'MATCHING' | 'GLOBAL_CLUB' | 'CLUB_MILESTONE' | 'POOLS'
  const [searchTerm, setSearchTerm] = useState('')
  const [txLogs, setTxLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [copiedHash, setCopiedHash] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  const copyToClipboard = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedHash(id)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const loadAllTransactions = async () => {
    try {
      setLoading(true)
      const targetAddr = CONTRACT_ADDRESSES.TETHER_STREAM // Main Proxy
      const publicClient = createPublicClient({ chain: activeChain, transport: http(rpcUrl) })

      // Determine a safe block window (BSC Testnet public RPC limits range to 50,000 blocks)
      const currentBlock = await publicClient.getBlockNumber().catch(() => 0n)
      const safeFromBlock = currentBlock > 48000n ? currentBlock - 48000n : 0n

      // Exact On-Chain Event Signatures from IElzora.sol
      const regAbi = parseAbiItem(
        'event UserRegistered(address indexed user, address indexed sponsor, address indexed parent, uint8 position, uint256 timestamp)'
      )
      const directIncomeAbi = parseAbiItem(
        'event DirectIncomePaid(address indexed recipient, address indexed fromUser, uint256 amount)'
      )
      const affiliateIncomeAbi = parseAbiItem(
        'event AffiliateIncomePaid(address indexed recipient, address indexed fromUser, uint8 level, uint256 amount)'
      )
      const matchingIncomeAbi = parseAbiItem(
        'event MatchingIncomePaid(address indexed recipient, uint256 matchedPairs, uint256 amount, uint256 remainingLeftCarry, uint256 remainingRightCarry)'
      )
      const globalClubEnteredAbi = parseAbiItem(
        'event GlobalClubEntered(uint256 indexed entryId, address indexed user, bool indexed isReentry, uint256 originalEntryId)'
      )
      const globalClubCycleAbi = parseAbiItem(
        'event GlobalClubCycleCompleted(uint256 indexed entryId, address indexed user, uint256 rewardAmount, uint256 newReentryId)'
      )
      const clubRankAdvAbi = parseAbiItem(
        'event ClubRankAdvanced(address indexed user, uint256 indexed rank, uint256 netProfit, uint256 upgradeFee, uint256 sponsorIncome)'
      )
      const lifetimeRewardAbi = parseAbiItem(
        'event LifetimeRewardClaimed(address indexed user, uint256 indexed milestoneIndex, uint256 amount)'
      )
      const championBatchAbi = parseAbiItem(
        'event ChampionBatchDistributed(uint256 indexed monthEpoch, uint256 startIndex, uint256 endIndex, uint256 membersPaid, uint256 totalBatchAmount)'
      )
      const weeklyBatchAbi = parseAbiItem(
        'event WeeklyBatchDistributed(uint256 indexed weekEpoch, uint256 startIndex, uint256 endIndex, uint256 membersPaid, uint256 totalBatchAmount)'
      )

      // Fetch logs in parallel safely
      const [
        regLogs,
        directLogs,
        affiliateLogs,
        matchingLogs,
        gcLogs,
        gcCycleLogs,
        rankLogs,
        milestoneLogs,
        champLogs,
        weeklyLogs,
      ] = await Promise.all([
        publicClient.getLogs({ address: targetAddr, event: regAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: directIncomeAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: affiliateIncomeAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: matchingIncomeAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: globalClubEnteredAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: globalClubCycleAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: clubRankAdvAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: lifetimeRewardAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: championBatchAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: weeklyBatchAbi, fromBlock: safeFromBlock, toBlock: 'latest' }).catch(() => []),
      ])

      const allEvents = []

      // 1. Core Registrations ($50)
      regLogs.forEach((l, idx) => {
        const u = l.args?.user || '0x0000000000000000000000000000000000000000'
        const sp = l.args?.sponsor || '0x0000000000000000000000000000000000000000'
        const pos = Number(l.args?.position || 0) === 1 ? 'Left Leg' : Number(l.args?.position || 0) === 2 ? 'Right Leg' : 'Root Genesis'
        allEvents.push({
          id: `reg-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'REGISTRATION',
          typeLabel: 'Core Registration ($50)',
          primaryUser: u,
          secondaryUser: sp !== '0x0000000000000000000000000000000000000000' ? sp : null,
          secondaryRole: 'Sponsor',
          details: `Position: ${pos}`,
          amount: 50,
          token: 'USDT',
          color: '#8b5cf6',
          bgBadge: 'rgba(139, 92, 246, 0.15)',
        })
      })

      // 2. Direct Income ($10)
      directLogs.forEach((l, idx) => {
        const recip = l.args?.recipient || '0x0000000000000000000000000000000000000000'
        const fromU = l.args?.fromUser || '0x0000000000000000000000000000000000000000'
        const amt = Number(formatUnits(l.args?.amount || 0n, tokenDecimals))
        allEvents.push({
          id: `dir-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'DIRECT_AFFILIATE',
          typeLabel: 'Direct Sponsor Bonus ($10)',
          primaryUser: recip,
          secondaryUser: fromU,
          secondaryRole: 'From Member',
          details: 'Direct 20% registration bonus',
          amount: amt || 10,
          token: 'USDT',
          color: '#10b981',
          bgBadge: 'rgba(16, 185, 129, 0.15)',
        })
      })

      // 3. Affiliate Level Income ($1 per level up to 7 levels)
      affiliateLogs.forEach((l, idx) => {
        const recip = l.args?.recipient || '0x0000000000000000000000000000000000000000'
        const fromU = l.args?.fromUser || '0x0000000000000000000000000000000000000000'
        const lvl = Number(l.args?.level || 1)
        const amt = Number(formatUnits(l.args?.amount || 0n, tokenDecimals))
        allEvents.push({
          id: `aff-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'DIRECT_AFFILIATE',
          typeLabel: `Affiliate Level ${lvl} Bonus ($1)`,
          primaryUser: recip,
          secondaryUser: fromU,
          secondaryRole: 'Downline Member',
          details: `Level ${lvl} Unilevel Payout`,
          amount: amt || 1,
          token: 'USDT',
          color: '#06b6d4',
          bgBadge: 'rgba(6, 182, 212, 0.15)',
        })
      })

      // 4. Binary Matching Income ($2/pair, up to 50 pairs/day)
      matchingLogs.forEach((l, idx) => {
        const recip = l.args?.recipient || '0x0000000000000000000000000000000000000000'
        const pairs = Number(l.args?.matchedPairs || 0n)
        const amt = Number(formatUnits(l.args?.amount || 0n, tokenDecimals))
        allEvents.push({
          id: `match-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'MATCHING',
          typeLabel: `Binary Matching (${pairs} Pairs)`,
          primaryUser: recip,
          secondaryUser: null,
          secondaryRole: null,
          details: `${pairs} Matched Pairs @ $2/pair`,
          amount: amt || pairs * 2,
          token: 'USDT',
          color: '#f59e0b',
          bgBadge: 'rgba(245, 158, 11, 0.15)',
        })
      })

      // 5. Global Club Entries ($25 Queue)
      gcLogs.forEach((l, idx) => {
        const u = l.args?.user || '0x0000000000000000000000000000000000000000'
        const eId = Number(l.args?.entryId || 0n)
        const isReentry = Boolean(l.args?.isReentry)
        allEvents.push({
          id: `gc-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'GLOBAL_CLUB',
          typeLabel: isReentry ? 'Global Club Auto Re-Entry ($25)' : 'Global Club Queue Entry ($25)',
          primaryUser: u,
          secondaryUser: null,
          secondaryRole: null,
          details: `Entry #${eId} ${isReentry ? '(Auto-Reentry)' : '(Initial Entry)'}`,
          amount: 25,
          token: 'USDT',
          color: '#ec4899',
          bgBadge: 'rgba(236, 72, 153, 0.15)',
        })
      })

      // 6. Global Club Cycle Completed ($125 gross)
      gcCycleLogs.forEach((l, idx) => {
        const u = l.args?.user || '0x0000000000000000000000000000000000000000'
        const eId = Number(l.args?.entryId || 0n)
        const amt = Number(formatUnits(l.args?.rewardAmount || 0n, tokenDecimals))
        const reId = Number(l.args?.newReentryId || 0n)
        allEvents.push({
          id: `gcc-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'GLOBAL_CLUB',
          typeLabel: 'Global Club Cycle Complete ($125)',
          primaryUser: u,
          secondaryUser: null,
          secondaryRole: null,
          details: `Cycle Completed #${eId} ➔ New Re-entry #${reId}`,
          amount: amt || 125,
          token: 'USDT',
          color: '#e11d48',
          bgBadge: 'rgba(225, 29, 72, 0.15)',
        })
      })

      // 7. Club Matrix Rank Advancement
      rankLogs.forEach((l, idx) => {
        const u = l.args?.user || '0x0000000000000000000000000000000000000000'
        const rank = Number(l.args?.rank || 0n)
        const profit = Number(formatUnits(l.args?.netProfit || 0n, tokenDecimals))
        allEvents.push({
          id: `rank-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'CLUB_MILESTONE',
          typeLabel: `Club Rank #${rank} Advance`,
          primaryUser: u,
          secondaryUser: null,
          secondaryRole: null,
          details: `Rank ${rank} Qualified • Net Cash: $${profit.toFixed(2)}`,
          amount: profit,
          token: 'USDT',
          color: '#3b82f6',
          bgBadge: 'rgba(59, 130, 246, 0.15)',
        })
      })

      // 8. Lifetime Milestone Cash Awards
      milestoneLogs.forEach((l, idx) => {
        const u = l.args?.user || '0x0000000000000000000000000000000000000000'
        const mIdx = Number(l.args?.milestoneIndex || 0n) + 1
        const amt = Number(formatUnits(l.args?.amount || 0n, tokenDecimals))
        allEvents.push({
          id: `ms-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'CLUB_MILESTONE',
          typeLabel: `Lifetime Milestone #${mIdx} Award`,
          primaryUser: u,
          secondaryUser: null,
          secondaryRole: null,
          details: `Milestone Level ${mIdx} Cash Dispatched`,
          amount: amt,
          token: 'USDT',
          color: '#fbbf24',
          bgBadge: 'rgba(251, 191, 36, 0.15)',
        })
      })

      // 9. Champion Pool Batch Distribution
      champLogs.forEach((l, idx) => {
        const month = Number(l.args?.monthEpoch || 0n)
        const members = Number(l.args?.membersPaid || 0n)
        const amt = Number(formatUnits(l.args?.totalBatchAmount || 0n, tokenDecimals))
        allEvents.push({
          id: `champ-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'POOLS',
          typeLabel: `Champion Pool Month #${month} Batch`,
          primaryUser: CONTRACT_ADDRESSES.TETHER_STREAM,
          secondaryUser: null,
          secondaryRole: null,
          details: `Batch Payout to ${members} Champion Leaders`,
          amount: amt,
          token: 'USDT',
          color: '#a855f7',
          bgBadge: 'rgba(168, 85, 247, 0.15)',
        })
      })

      // 10. Weekly Pool Batch Distribution
      weeklyLogs.forEach((l, idx) => {
        const week = Number(l.args?.weekEpoch || 0n)
        const members = Number(l.args?.membersPaid || 0n)
        const amt = Number(formatUnits(l.args?.totalBatchAmount || 0n, tokenDecimals))
        allEvents.push({
          id: `week-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          category: 'POOLS',
          typeLabel: `Weekly Pool Week #${week} Batch`,
          primaryUser: CONTRACT_ADDRESSES.TETHER_STREAM,
          secondaryUser: null,
          secondaryRole: null,
          details: `Batch Payout to ${members} Weekly Top Sponsors`,
          amount: amt,
          token: 'USDT',
          color: '#f43f5e',
          bgBadge: 'rgba(244, 63, 94, 0.15)',
        })
      })

      // Sort by block number descending (most recent first)
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber)
      setTxLogs(allEvents)
    } catch (err) {
      console.warn('Error loading transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllTransactions()
  }, [activeChain, CONTRACT_ADDRESSES.TETHER_STREAM, rpcUrl])

  // Filter logs by tab and search
  const filteredLogs = useMemo(() => {
    return txLogs.filter((tx) => {
      // Category Tab Filter
      if (activeTab !== 'ALL' && tx.category !== activeTab) {
        return false
      }

      // Search Query Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchUser = tx.primaryUser?.toLowerCase().includes(q)
        const matchSecondary = tx.secondaryUser?.toLowerCase().includes(q)
        const matchHash = tx.hash?.toLowerCase().includes(q)
        const matchLabel = tx.typeLabel?.toLowerCase().includes(q)
        const matchDetails = tx.details?.toLowerCase().includes(q)
        const matchBlock = String(tx.blockNumber).includes(q)

        return matchUser || matchSecondary || matchHash || matchLabel || matchDetails || matchBlock
      }

      return true
    })
  }, [txLogs, activeTab, searchTerm])

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredLogs.slice(start, start + itemsPerPage)
  }, [filteredLogs, currentPage, itemsPerPage])

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return
    const headers = ['Event Type', 'Primary Wallet', 'Secondary Wallet', 'Amount (USDT)', 'Details', 'Block', 'Transaction Hash']
    const rows = filteredLogs.map((tx) => [
      `"${tx.typeLabel}"`,
      `"${tx.primaryUser}"`,
      `"${tx.secondaryUser || ''}"`,
      `"${tx.amount.toFixed(2)}"`,
      `"${tx.details || ''}"`,
      tx.blockNumber,
      `"${tx.hash}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `elzora_transactions_${activeTab.toLowerCase()}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let regTotal = 0
    let incomeTotal = 0
    txLogs.forEach((tx) => {
      if (tx.category === 'REGISTRATION') {
        regTotal += tx.amount
      } else {
        incomeTotal += tx.amount
      }
    })
    return {
      totalCount: txLogs.length,
      regTotal,
      incomeTotal,
    }
  }, [txLogs])

  return (
    <AdminLayout pageTitle="ELZORA Master Transaction Explorer">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* BANNER */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: '28px 32px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(16, 21, 54, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 20,
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: 'var(--purple-light)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> LIVE BLOCKCHAIN TRANSACTION STREAM
              </div>
              <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900, color: '#fff' }}>
                On-Chain Transaction Explorer
              </h2>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
                Complete live transaction ledger across Registrations, Instant Referral & Level Payouts, Binary Matching, Global Club, and Milestone Pools.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleExportCSV}
                disabled={filteredLogs.length === 0}
                style={{
                  padding: '12px 18px',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Download size={16} />
                <span>Export CSV</span>
              </button>

              <button
                onClick={loadAllTransactions}
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '12px 22px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>{loading ? 'Scanning Blocks...' : 'Refresh Logs'}</span>
              </button>
            </div>
          </div>

          {/* TELEMETRY STAT STRIP */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                <Receipt size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Events</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>{summaryMetrics.totalCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Registration Inflow</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>${summaryMetrics.regTotal.toFixed(2)} USDT</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Instant Income Paid</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#22d3ee' }}>${summaryMetrics.incomeTotal.toFixed(2)} USDT</div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS & SEARCH BAR (WITHDRAWALS REMOVED) */}
        <div
          className="glass-card"
          style={{
            padding: 18,
            borderRadius: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            background: 'rgba(11, 15, 36, 0.85)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All Events (${txLogs.length})` },
              { id: 'REGISTRATION', label: 'Registrations ($50)' },
              { id: 'DIRECT_AFFILIATE', label: 'Direct & Level' },
              { id: 'MATCHING', label: 'Binary Matching' },
              { id: 'GLOBAL_CLUB', label: 'Global Club ($25)' },
              { id: 'CLUB_MILESTONE', label: 'Ranks & Milestones' },
              { id: 'POOLS', label: 'Champion & Weekly' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setCurrentPage(1)
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: 12,
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === tab.id ? '#fff' : 'var(--muted)',
                  border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: 280 }}>
            <input
              type="text"
              placeholder="Search wallet, hash, block, event..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '10px 40px 10px 14px',
                borderRadius: 12,
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <Search size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--purple-light)' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block' }} />
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Scanning Live Blockchain Blocks...</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: 4 }}>Aggregating registrations and 8-stream income events from BSC Testnet</div>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              <Receipt size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>No transactions found</div>
              <div style={{ fontSize: '0.84rem', marginTop: 4 }}>
                {searchTerm ? 'No results matched your search term.' : 'No events in this category yet.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>EVENT TYPE</th>
                    <th style={{ padding: '12px 16px' }}>PRIMARY PARTICIPANT</th>
                    <th style={{ padding: '12px 16px' }}>EVENT DETAILS</th>
                    <th style={{ padding: '12px 16px' }}>AMOUNT</th>
                    <th style={{ padding: '12px 16px' }}>BLOCK</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>TX HASH</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                      
                      {/* 1. EVENT TYPE */}
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            padding: '6px 12px',
                            borderRadius: 10,
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            background: tx.bgBadge,
                            color: tx.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Zap size={13} />
                          {tx.typeLabel}
                        </span>
                      </td>

                      {/* 2. PRIMARY PARTICIPANT */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                            {tx.primaryUser ? `${tx.primaryUser.slice(0, 6)}...${tx.primaryUser.slice(-4)}` : 'System'}
                          </span>
                          {tx.primaryUser && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(tx.primaryUser, `u-${tx.id}`)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: copiedHash === `u-${tx.id}` ? '#00ff88' : 'var(--muted)' }}
                              title="Copy wallet address"
                            >
                              {copiedHash === `u-${tx.id}` ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                        {tx.secondaryUser && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 4 }}>
                            {tx.secondaryRole}: <span style={{ fontFamily: 'monospace', color: '#a78bfa' }}>{`${tx.secondaryUser.slice(0, 6)}...${tx.secondaryUser.slice(-4)}`}</span>
                          </div>
                        )}
                      </td>

                      {/* 3. EVENT DETAILS */}
                      <td style={{ padding: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '0.84rem' }}>
                        {tx.details}
                      </td>

                      {/* 4. AMOUNT */}
                      <td style={{ padding: '16px', fontWeight: 900, color: '#00ff88', fontSize: '0.92rem' }}>
                        +${tx.amount.toFixed(2)} <span style={{ fontSize: '0.76rem', color: 'var(--muted)', fontWeight: 600 }}>USDT</span>
                      </td>

                      {/* 5. BLOCK NUMBER */}
                      <td style={{ padding: '16px', color: 'var(--muted)', fontFamily: 'monospace', fontSize: '0.84rem' }}>
                        #{tx.blockNumber}
                      </td>

                      {/* 6. TX HASH */}
                      <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <a
                            href={`${explorerUrl}/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.85rem' }}
                          >
                            <span>{tx.hash ? `${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}` : 'Tx'}</span>
                            <ExternalLink size={13} />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(tx.hash, `tx-${tx.id}`)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: copiedHash === `tx-${tx.id}` ? '#00ff88' : 'var(--muted)' }}
                            title="Copy transaction hash"
                          >
                            {copiedHash === `tx-${tx.id}` ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} events
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Previous
                    </button>

                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fff', padding: '0 8px' }}>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : '#fff',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}

export default AdminTransactionsPage
