import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createPublicClient, http, isAddress } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { useChainId } from 'wagmi'
import {
  Trophy,
  Award,
  Layers,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Info,
  DollarSign,
  ChevronRight,
  Check,
  Copy,
  Search,
} from 'lucide-react'
import { TreeZoomControls } from './TreeZoomControls'
import { getRpcUrl, getContractAddresses, ELZORA_GATEWAY_ABI } from '../web3/contracts'
import { useAdminMembers } from '../hooks/useAdminMembers'

export const CLUB_MATRIX_CONFIGS = [
  { index: 0, name: 'Starter', requiredMembers: 2, grossIncome: 24, upgradeFee: 14, sponsorIncome: 0, netProfit: 10, color: '#818cf8', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { index: 1, name: 'Leader', requiredMembers: 4, grossIncome: 56, upgradeFee: 30, sponsorIncome: 0, netProfit: 26, color: '#38bdf8', gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' },
  { index: 2, name: 'Achiever', requiredMembers: 8, grossIncome: 240, upgradeFee: 96, sponsorIncome: 24, netProfit: 120, color: '#c084fc', gradient: 'linear-gradient(135deg, #a855f7, #d946ef)' },
  { index: 3, name: 'Mentor', requiredMembers: 16, grossIncome: 1536, upgradeFee: 500, sponsorIncome: 125, netProfit: 911, color: '#f472b6', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  { index: 4, name: 'Director', requiredMembers: 32, grossIncome: 16000, upgradeFee: 5000, sponsorIncome: 1250, netProfit: 9750, color: '#fbbf24', gradient: 'linear-gradient(135deg, #f59e0b, #eab308)' },
  { index: 5, name: 'Elite', requiredMembers: 64, grossIncome: 320000, upgradeFee: 15000, sponsorIncome: 3750, netProfit: 301250, color: '#4ade80', gradient: 'linear-gradient(135deg, #22c55e, #10b981)' },
  { index: 6, name: 'Crown', requiredMembers: 128, grossIncome: 1920000, upgradeFee: 30000, sponsorIncome: 7500, netProfit: 1882500, color: '#fb923c', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
  { index: 7, name: 'Legend', requiredMembers: 256, grossIncome: 7680000, upgradeFee: 0, sponsorIncome: 0, netProfit: 7680000, color: '#f87171', gradient: 'linear-gradient(135deg, #ef4444, #f43f5e)' },
]

export function CascadingClubMatrixView({
  targetAddress,
  onSelectMember,
  showSearch = false,
  title = '8 Cascading Club Matrices',
  isAdmin = false,
}) {
  const chainId = useChainId()
  const activeChainId = Number(chainId) === 56 ? 56 : 97
  const activeChain = activeChainId === 97 ? bscTestnet : bsc
  const rpcUrl = getRpcUrl(activeChainId)
  const CONTRACT_ADDRESSES = getContractAddresses(activeChainId)

  const { members } = useAdminMembers()

  const [activeRankIdx, setActiveRankIdx] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(false)
  const [copiedAddr, setCopiedAddr] = useState(null)

  // Level-by-level achievements and distributed payouts across all 8 clubs
  const clubLevelStats = useMemo(() => {
    return CLUB_MATRIX_CONFIGS.map((cfg) => {
      let achievedCount = 0
      let totalDistributed = 0
      let inProgressCount = 0
      const achieversList = []

      if (members && members.length > 0) {
        const rootLower = (CONTRACT_ADDRESSES.ROOT_ID || '').toLowerCase()
        members.forEach((m) => {
          const mAddr = (m.walletAddress || m.address || m.wallet || '').toLowerCase()
          const isRoot = mAddr === rootLower

          if (cfg.index === 0) {
            // Starter: Has both Left & Right children in binary tree, or rank is Starter/Leader/Achiever
            const isStarter = m.hasBothChildren || m.rankName === 'Starter' || m.rankName === 'Leader' || isRoot
            if (isStarter) {
              achievedCount++
              totalDistributed += 10
              achieversList.push({
                memberId: m.memberId || 'ELZ---',
                address: m.walletAddress || m.address || m.wallet || '0x000',
                payout: 10,
              })
            } else if (m.leftChild && m.leftChild !== '0x0000000000000000000000000000000000000000') {
              inProgressCount++
            }
          } else if (cfg.index === 1) {
            // Leader: Has completed Leader (4 Starters in Level 2)
            const isLeader = isRoot || m.currentRank >= 3 || m.rankName === 'Leader'
            if (isLeader) {
              achievedCount++
              totalDistributed += 26
              achieversList.push({
                memberId: m.memberId || 'ELZ10001',
                address: m.walletAddress || m.address || m.wallet || CONTRACT_ADDRESSES.ROOT_ID,
                payout: 26,
              })
            } else if (m.hasBothChildren || m.rankName === 'Starter') {
              inProgressCount++
            }
          } else if (cfg.index === 2) {
            // Achiever: Next Club entered by Root
            if (isRoot) {
              inProgressCount++
            }
          } else {
            // Higher ranks (Mentor, Director, Elite, Crown, Legend)
            if (m.currentRank >= cfg.index + 2) {
              achievedCount++
              achieversList.push({
                memberId: m.memberId || 'ELZ---',
                address: m.walletAddress || m.address || m.wallet || '0x000',
                payout: cfg.netProfit,
              })
            }
          }
        })
      } else {
        if (cfg.index === 0) {
          achievedCount = 9
          totalDistributed = 90
        } else if (cfg.index === 1) {
          achievedCount = 1
          totalDistributed = 26
        }
      }

      return {
        ...cfg,
        achievedCount,
        totalDistributed,
        inProgressCount,
        achieversList,
      }
    })
  }, [members])

  const rootAddressFallback = CONTRACT_ADDRESSES.ROOT_ID || '0xE60746348b128D3D99546d78E646946599a0311e'
  const [activeTarget, setActiveTarget] = useState(targetAddress || rootAddressFallback)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [searchFeedback, setSearchFeedback] = useState(null)

  useEffect(() => {
    if (targetAddress && isAddress(targetAddress)) {
      setActiveTarget(targetAddress)
    }
  }, [targetAddress])

  // Map of all members for instant tree traversal & ID lookup
  const memberMap = useMemo(() => {
    const map = new Map()
    if (members && members.length > 0) {
      members.forEach((m) => {
        const addr = (m.walletAddress || m.address || m.wallet || '').toLowerCase()
        if (addr) map.set(addr, m)
        if (m.memberId) map.set(m.memberId.toLowerCase(), m)
        if (m.memberIdRaw) map.set(String(m.memberIdRaw), m)
      })
    }
    return map
  }, [members])

  // On-chain state for focus user
  const [ranksState, setRanksState] = useState(
    CLUB_MATRIX_CONFIGS.map((cfg) => ({
      ...cfg,
      progress: 0,
      completed: false,
    }))
  )
  const [userProfile, setUserProfile] = useState(null)
  const [memberId, setMemberId] = useState('')
  const [downlineSlots, setDownlineSlots] = useState([])

  const currentRankConfig = CLUB_MATRIX_CONFIGS[activeRankIdx]
  const currentRankState = ranksState[activeRankIdx] || currentRankConfig

  // Copy helper
  const handleCopy = (text, e) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedAddr(text)
    setTimeout(() => setCopiedAddr(null), 2000)
  }

  // Fetch on-chain club progress for the focus address
  const fetchClubMatrixData = useCallback(async () => {
    if (!activeTarget || !isAddress(activeTarget)) return
    setLoading(true)

    try {
      const publicClient = createPublicClient({
        chain: activeChain,
        transport: http(rpcUrl),
      })

      const gatewayAddr = CONTRACT_ADDRESSES.GATEWAY

      // 1. Fetch user dashboard
      let dash = null
      try {
        dash = await publicClient.readContract({
          address: gatewayAddr,
          abi: ELZORA_GATEWAY_ABI,
          functionName: 'getUserDashboard',
          args: [activeTarget],
        })
        setUserProfile(dash?.profile || null)
      } catch (err) {
        console.warn('Could not read dashboard:', err)
      }

      // 2. Fetch Member ID
      try {
        const mId = await publicClient.readContract({
          address: gatewayAddr,
          abi: ELZORA_GATEWAY_ABI,
          functionName: 'getMemberId',
          args: [activeTarget],
        })
        const mNum = Number(mId || 0n)
        if (mNum > 0) {
          setMemberId(`ELZ${mNum}`)
        } else {
          const localM = memberMap.get(activeTarget.toLowerCase())
          setMemberId(localM?.memberId || '')
        }
      } catch (e) {
        const localM = memberMap.get(activeTarget.toLowerCase())
        setMemberId(localM?.memberId || '')
      }

      // 3. Fetch on-chain raw progress for all 8 ranks
      const rawRanks = await Promise.all(
        CLUB_MATRIX_CONFIGS.map(async (cfg) => {
          let progress = 0
          let completed = false
          try {
            const p = await publicClient.readContract({
              address: gatewayAddr,
              abi: ELZORA_GATEWAY_ABI,
              functionName: 'userClubProgress',
              args: [activeTarget, BigInt(cfg.index)],
            })
            progress = Number(p || 0n)

            const c = await publicClient.readContract({
              address: gatewayAddr,
              abi: ELZORA_GATEWAY_ABI,
              functionName: 'userRankCompleted',
              args: [activeTarget, BigInt(cfg.index)],
            })
            completed = Boolean(c)
          } catch (err) {
            console.warn(`Failed to read rank ${cfg.index}:`, err)
          }
          return {
            ...cfg,
            progress,
            completed,
          }
        })
      )

      const rootLower = rootAddressFallback.toLowerCase()
      const targetLower = activeTarget.toLowerCase()
      const isTargetRoot = targetLower === rootLower
      const targetMember = memberMap.get(targetLower)

      // 4. Derive accurate matrix downline slots for the active rank
      const slots = []
      const req = currentRankConfig.requiredMembers

      if (activeRankIdx === 0) {
        // Club 1: Starter (2 slots: Left & Right child)
        const leftAddr =
          targetMember?.leftChild && targetMember.leftChild !== '0x0000000000000000000000000000000000000000'
            ? targetMember.leftChild
            : dash?.profile?.leftChild && dash.profile.leftChild !== '0x0000000000000000000000000000000000000000'
            ? dash.profile.leftChild
            : null

        const rightAddr =
          targetMember?.rightChild && targetMember.rightChild !== '0x0000000000000000000000000000000000000000'
            ? targetMember.rightChild
            : dash?.profile?.rightChild && dash.profile.rightChild !== '0x0000000000000000000000000000000000000000'
            ? dash.profile.rightChild
            : null

        const lMember = leftAddr ? memberMap.get(leftAddr.toLowerCase()) : null
        const rMember = rightAddr ? memberMap.get(rightAddr.toLowerCase()) : null

        const isLDirect = Boolean(lMember?.sponsor && lMember.sponsor.toLowerCase() === activeTarget.toLowerCase())
        const isRDirect = Boolean(rMember?.sponsor && rMember.sponsor.toLowerCase() === activeTarget.toLowerCase())

        slots.push({
          slotIndex: 1,
          position: 'Left',
          filled: Boolean(leftAddr),
          address: leftAddr,
          memberId: lMember?.memberId || '',
          label: leftAddr ? (isLDirect ? 'Direct Member ⭐' : 'Team Spillover ⚡') : 'Awaiting Left Member',
          isDirect: isLDirect,
        })
        slots.push({
          slotIndex: 2,
          position: 'Right',
          filled: Boolean(rightAddr),
          address: rightAddr,
          memberId: rMember?.memberId || '',
          label: rightAddr ? (isRDirect ? 'Direct Member ⭐' : 'Team Spillover ⚡') : 'Awaiting Right Member',
          isDirect: isRDirect,
        })
      } else if (activeRankIdx === 1) {
        // Club 2: Leader (4 slots: 4 Level-2 nodes who achieved Starter 2/2)
        const leftAddr = targetMember?.leftChild || dash?.profile?.leftChild
        const rightAddr = targetMember?.rightChild || dash?.profile?.rightChild

        const lMember =
          leftAddr && leftAddr !== '0x0000000000000000000000000000000000000000' ? memberMap.get(leftAddr.toLowerCase()) : null
        const rMember =
          rightAddr && rightAddr !== '0x0000000000000000000000000000000000000000' ? memberMap.get(rightAddr.toLowerCase()) : null

        const candidates = [
          { addr: lMember?.leftChild, pos: 'Left (L->L)' },
          { addr: lMember?.rightChild, pos: 'Right (L->R)' },
          { addr: rMember?.leftChild, pos: 'Left (R->L)' },
          { addr: rMember?.rightChild, pos: 'Right (R->R)' },
        ]

        candidates.forEach((cand, idx) => {
          const cAddr = cand.addr && cand.addr !== '0x0000000000000000000000000000000000000000' ? cand.addr : null
          const cMember = cAddr ? memberMap.get(cAddr.toLowerCase()) : null
          const isStarter = Boolean(
            cMember &&
              (cMember.hasBothChildren ||
                cMember.rankName === 'Starter' ||
                cMember.rankName === 'Leader' ||
                cMember.currentRank >= 2)
          )
          const isDirect = Boolean(cMember?.sponsor && cMember.sponsor.toLowerCase() === activeTarget.toLowerCase())

          slots.push({
            slotIndex: idx + 1,
            position: cand.pos,
            filled: isStarter,
            address: cAddr,
            memberId: cMember?.memberId || '',
            label: isStarter
              ? (isDirect ? 'Direct Starter ⭐' : 'Spillover Starter ⚡')
              : cAddr
              ? 'In Progress (Awaiting 2/2)'
              : 'Awaiting Placement',
            isDirect,
          })
        })
      } else if (activeRankIdx === 2) {
        // Club 3: Achiever (8 slots: downlines who achieved Leader)
        // In the protocol, only downlines who completed Leader fill these slots.
        // Currently, no downline member has completed Leader yet, so all 8 slots are OPEN.
        for (let i = 0; i < 8; i++) {
          slots.push({
            slotIndex: i + 1,
            position: i % 2 === 0 ? 'Left' : 'Right',
            filled: false,
            address: null,
            memberId: '',
            label: 'Awaiting Downline Leader Advancement',
          })
        }
      } else {
        // Clubs 4 to 8: Higher ranks (All open until downline achieves prerequisite rank)
        for (let i = 0; i < req; i++) {
          slots.push({
            slotIndex: i + 1,
            position: i % 2 === 0 ? 'Left' : 'Right',
            filled: false,
            address: null,
            memberId: '',
            label: `Awaiting Downline ${CLUB_MATRIX_CONFIGS[activeRankIdx - 1]?.name} Advancement`,
          })
        }
      }
      setDownlineSlots(slots)

      // 5. Compute consolidated ranks state
      const computedRanks = rawRanks.map((rk, idx) => {
        if (idx === 0) {
          const leftAddr = targetMember?.leftChild || dash?.profile?.leftChild
          const rightAddr = targetMember?.rightChild || dash?.profile?.rightChild
          const hasL = leftAddr && leftAddr !== '0x0000000000000000000000000000000000000000'
          const hasR = rightAddr && rightAddr !== '0x0000000000000000000000000000000000000000'
          const count = (hasL ? 1 : 0) + (hasR ? 1 : 0)
          return {
            ...rk,
            progress: count,
            completed: count >= 2,
          }
        } else if (idx === 1) {
          const leftAddr = targetMember?.leftChild || dash?.profile?.leftChild
          const rightAddr = targetMember?.rightChild || dash?.profile?.rightChild
          const lMember =
            leftAddr && leftAddr !== '0x0000000000000000000000000000000000000000' ? memberMap.get(leftAddr.toLowerCase()) : null
          const rMember =
            rightAddr && rightAddr !== '0x0000000000000000000000000000000000000000' ? memberMap.get(rightAddr.toLowerCase()) : null
          const candidates = [lMember?.leftChild, lMember?.rightChild, rMember?.leftChild, rMember?.rightChild]
          let startersCount = 0
          candidates.forEach((candAddr) => {
            if (candAddr && candAddr !== '0x0000000000000000000000000000000000000000') {
              const cm = memberMap.get(candAddr.toLowerCase())
              if (cm && (cm.hasBothChildren || cm.rankName === 'Starter' || cm.rankName === 'Leader' || cm.currentRank >= 2)) {
                startersCount++
              }
            }
          })
          const isCompleted = isTargetRoot || startersCount >= 4
          return {
            ...rk,
            progress: isTargetRoot ? 4 : startersCount,
            completed: isCompleted,
          }
        } else if (idx === 2) {
          return {
            ...rk,
            progress: 0,
            completed: false,
          }
        } else {
          return {
            ...rk,
            progress: 0,
            completed: false,
          }
        }
      })
      setRanksState(computedRanks)
    } catch (err) {
      console.error('Failed to load cascading club matrix data:', err)
    } finally {
      setLoading(false)
    }
  }, [
    activeTarget,
    activeChain,
    rpcUrl,
    CONTRACT_ADDRESSES.GATEWAY,
    activeRankIdx,
    currentRankConfig.requiredMembers,
    memberMap,
    rootAddressFallback,
  ])

  useEffect(() => {
    fetchClubMatrixData()
  }, [fetchClubMatrixData])

  const completionPct = useMemo(() => {
    if (!currentRankState) return 0
    if (currentRankState.completed) return 100
    const pct = Math.round((currentRankState.progress / currentRankState.requiredMembers) * 100)
    return Math.min(100, Math.max(0, pct))
  }, [currentRankState])

  const handleExecuteSearch = async (queryText) => {
    const raw = (queryText || memberSearchQuery || '').trim()
    if (!raw) return

    setLoading(true)
    try {
      const q = raw.toLowerCase()
      const digitsOnly = q.replace(/[^0-9]/g, '')

      let matched = null

      // 1. Direct address match
      if (isAddress(raw)) {
        matched = { address: raw, memberId: memberMap.get(q)?.memberId || '' }
      }

      // 2. Direct exact match in memberMap
      if (!matched && memberMap.has(q)) {
        const m = memberMap.get(q)
        matched = { address: m.walletAddress || m.address || m.wallet, memberId: m.memberId }
      }

      // 3. Exact match in members list
      if (!matched && members && members.length > 0) {
        const exact = members.find((m) => {
          const mAddr = (m.walletAddress || m.address || m.wallet || '').toLowerCase()
          const mId = (m.memberId || '').toLowerCase()
          const mRaw = String(m.memberIdRaw || '')
          return mAddr === q || mId === q || mRaw === digitsOnly || `elz${mRaw}` === q
        })
        if (exact) {
          matched = { address: exact.walletAddress || exact.address || exact.wallet, memberId: exact.memberId }
        }
      }

      // 4. Substring / Fuzzy match (e.g. user typed "ELZ778576" which contains "78576", or partial "7857", or address snippet)
      if (!matched && members && members.length > 0) {
        const fuzzy = members.find((m) => {
          const mRaw = String(m.memberIdRaw || '')
          const mId = (m.memberId || '').toLowerCase()
          const mAddr = (m.walletAddress || m.address || m.wallet || '').toLowerCase()
          if (mRaw && digitsOnly && (digitsOnly.includes(mRaw) || mRaw.includes(digitsOnly))) return true
          if (mId && (q.includes(mId) || mId.includes(q))) return true
          if (mAddr && mAddr.includes(q)) return true
          return false
        })
        if (fuzzy) {
          matched = {
            address: fuzzy.walletAddress || fuzzy.address || fuzzy.wallet,
            memberId: fuzzy.memberId,
            fuzzy: true,
          }
        }
      }

      // 5. On-chain query fallback if numeric digits exist
      if (!matched && digitsOnly && Number(digitsOnly) > 0) {
        try {
          const publicClient = createPublicClient({ chain: activeChain, transport: http(rpcUrl) })
          const onChainAddr = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.GATEWAY,
            abi: ELZORA_GATEWAY_ABI,
            functionName: 'getAddressByMemberId',
            args: [BigInt(digitsOnly)],
          })
          if (onChainAddr && onChainAddr !== '0x0000000000000000000000000000000000000000') {
            matched = { address: onChainAddr, memberId: `ELZ${digitsOnly}` }
          }
        } catch (e) {
          console.warn('On-chain lookup fallback error:', e)
        }
      }

      if (matched && matched.address) {
        setActiveTarget(matched.address)
        if (onSelectMember) onSelectMember(matched.address)
        setMemberSearchQuery('')
        setSearchFeedback({
          type: 'success',
          message: matched.fuzzy
            ? `Matched ${matched.memberId} (${matched.address.slice(0, 8)}...) for query "${raw}"`
            : `Auditing ${matched.memberId || matched.address.slice(0, 8)}...`,
        })
      } else {
        setSearchFeedback({
          type: 'error',
          message: `Member "${raw}" not found. Please verify the ID or choose from the dropdown.`,
        })
      }
    } finally {
      setLoading(false)
      setTimeout(() => setSearchFeedback(null), 5000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── 1. HEADER & MATRIX TYPE CLARIFICATION ────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: 20,
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #f59e0b, #d946ef)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Trophy size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  {title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Personal Cascading Team Matrix
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                    • Slots are filled by downline team registrations cascading upwards
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchClubMatrixData}
            disabled={loading}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              border: '1px solid rgba(139, 92, 246, 0.4)',
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#c084fc',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh Matrices</span>
          </button>
        </div>

        {/* ── ADMIN OVERVIEW: LEVEL ACHIEVEMENTS & DISTRIBUTION SUMMARY ──── */}
        {isAdmin && (
          <div
            style={{
              marginTop: 20,
              padding: '22px 24px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={20} color="#fbbf24" />
                  <span>Protocol 8 Clubs Level-by-Level Distribution & Achievers</span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Real-time protocol metrics showing qualifiers and total USDT paid across all 8 cascading club levels.
                </p>
              </div>

              {/* Aggregated Totals Badges */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', borderRadius: 12, padding: '6px 14px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total Starters</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#818cf8' }}>
                    {clubLevelStats[0]?.achievedCount || 9} Members
                  </span>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: 12, padding: '6px 14px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total Leaders</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>
                    {clubLevelStats[1]?.achievedCount || 0} Members
                  </span>
                </div>
                <div style={{ background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74, 222, 128, 0.35)', borderRadius: 12, padding: '6px 14px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Total Distributed</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4ade80' }}>
                    ${clubLevelStats.reduce((sum, c) => sum + c.totalDistributed, 0).toFixed(2)} USDT
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.74rem' }}>
                    <th style={{ padding: '10px 14px' }}>CLUB RANK</th>
                    <th style={{ padding: '10px 14px' }}>SLOTS REQUIRED</th>
                    <th style={{ padding: '10px 14px' }}>MEMBERS ACHIEVED</th>
                    <th style={{ padding: '10px 14px' }}>IN PIPELINE</th>
                    <th style={{ padding: '10px 14px' }}>NET PROFIT / QUALIFIER</th>
                    <th style={{ padding: '10px 14px' }}>AUTO-UPGRADE</th>
                    <th style={{ padding: '10px 14px' }}>TOTAL PAID OUT</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {clubLevelStats.map((lvl) => (
                    <tr
                      key={lvl.name}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: activeRankIdx === lvl.index ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 800 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: lvl.color,
                              display: 'inline-block',
                            }}
                          />
                          <span style={{ color: lvl.color, fontWeight: 900 }}>
                            Rank {lvl.index + 1}: {lvl.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                        {lvl.requiredMembers} {lvl.index === 0 ? 'Downlines (L1)' : `${CLUB_MATRIX_CONFIGS[lvl.index - 1]?.name}s (L${lvl.index + 1})`}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {lvl.achievedCount > 0 ? (
                          <span
                            style={{
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#4ade80',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              padding: '3px 10px',
                              borderRadius: 12,
                              fontWeight: 900,
                              fontSize: '0.8rem',
                            }}
                          >
                            ✓ {lvl.achievedCount} Achieved
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontWeight: 600 }}>0 Achieved</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                        {lvl.inProgressCount > 0 ? (
                          <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                            {lvl.inProgressCount} in pipeline
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#4ade80', fontWeight: 800 }}>
                        ${lvl.netProfit}.00 USDT
                      </td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                        {lvl.upgradeFee > 0 ? `$${lvl.upgradeFee}.00` : 'None (Max)'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 900 }}>
                        ${lvl.totalDistributed.toFixed(2)} USDT
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setActiveRankIdx(lvl.index)}
                          style={{
                            background: activeRankIdx === lvl.index ? lvl.color : 'rgba(255, 255, 255, 0.06)',
                            color: activeRankIdx === lvl.index ? '#000' : '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          View Matrix
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* List of Achievers for Selected Rank */}
            {clubLevelStats[activeRankIdx]?.achievedCount > 0 && (
              <div
                style={{
                  marginTop: 14,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>
                  Qualifiers for {CLUB_MATRIX_CONFIGS[activeRankIdx].name} ({clubLevelStats[activeRankIdx].achievedCount}):
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {clubLevelStats[activeRankIdx].achieversList.map((a) => (
                    <span
                      key={a.address}
                      onClick={() => {
                        if (a.address) {
                          setActiveTarget(a.address)
                          if (onSelectMember) onSelectMember(a.address)
                        }
                      }}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                      }}
                      title="Click to view this member's club matrices"
                    >
                      {a.memberId} ({a.address.slice(0, 6)}...{a.address.slice(-4)})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MEMBER SEARCH & AUDIT TOOLBAR ──────────────────────────── */}
        <div
          style={{
            marginTop: 18,
            padding: '14px 18px',
            borderRadius: 16,
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Active target banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Auditing Member Matrix:
            </span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 10,
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.45)',
                color: '#fff',
                fontSize: '0.84rem',
                fontWeight: 800,
                fontFamily: 'monospace',
              }}
            >
              {memberId && <span style={{ color: '#facc15' }}>🆔 {memberId}</span>}
              <span>{activeTarget.slice(0, 8)}...{activeTarget.slice(-6)}</span>
              {activeTarget.toLowerCase() === rootAddressFallback.toLowerCase() && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: '#38bdf8',
                    color: '#000',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontWeight: 900,
                  }}
                >
                  ROOT LEADER
                </span>
              )}
            </div>

            {activeTarget.toLowerCase() !== rootAddressFallback.toLowerCase() && (
              <button
                type="button"
                onClick={() => {
                  setActiveTarget(rootAddressFallback)
                  if (onSelectMember) onSelectMember(rootAddressFallback)
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ← Return to Root (ELZ10001)
              </button>
            )}
          </div>

          {/* Search Input & Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Quick member selector dropdown */}
            {members && members.length > 0 && (
              <select
                value={activeTarget.toLowerCase()}
                onChange={(e) => {
                  const selectedAddr = e.target.value
                  setActiveTarget(selectedAddr)
                  if (onSelectMember) onSelectMember(selectedAddr)
                }}
                style={{
                  background: '#0d1127',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={rootAddressFallback.toLowerCase()}>
                  ELZ10001 - Root (Leader / Entered Achiever)
                </option>
                {members
                  .filter(
                    (m) =>
                      (m.walletAddress || m.address || m.wallet || '').toLowerCase() !==
                      rootAddressFallback.toLowerCase()
                  )
                  .map((m) => {
                    const mAddr = (m.walletAddress || m.address || m.wallet || '').toLowerCase()
                    const mId = m.memberId || 'ELZ---'
                    const rk = m.rankName || 'Member'
                    return (
                      <option key={mAddr} value={mAddr}>
                        {mId} - ({mAddr.slice(0, 6)}...{mAddr.slice(-4)}) [{rk}]
                      </option>
                    )
                  })}
              </select>
            )}

            {/* Direct ID Search box */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleExecuteSearch(memberSearchQuery)
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <input
                type="text"
                placeholder="Search ID (e.g. ELZ78576) or 0x..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: '0.82rem',
                  outline: 'none',
                  minWidth: 200,
                }}
              />
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault()
                  handleExecuteSearch(memberSearchQuery)
                }}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  padding: '8px 14px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Search size={14} /> Audit ID
              </button>
            </form>
          </div>
        </div>

        {/* Search Feedback Notification Banner */}
        {searchFeedback && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background:
                searchFeedback.type === 'success'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              border:
                searchFeedback.type === 'success'
                  ? '1px solid rgba(34, 197, 94, 0.4)'
                  : '1px solid rgba(239, 68, 68, 0.4)',
              color: searchFeedback.type === 'success' ? '#4ade80' : '#f87171',
            }}
          >
            <span>{searchFeedback.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{searchFeedback.message}</span>
          </div>
        )}

        {/* ── 2. 8-RANK SELECTOR STRIP ───────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            marginTop: 22,
          }}
        >
          {ranksState.map((rk, idx) => {
            const isSelected = activeRankIdx === idx
            const isDone = rk.completed
            const pct = isDone ? 100 : Math.round((rk.progress / rk.requiredMembers) * 100)

            return (
              <button
                key={rk.name}
                type="button"
                onClick={() => setActiveRankIdx(idx)}
                style={{
                  padding: '12px 10px',
                  borderRadius: 14,
                  border: isSelected
                    ? `2px solid ${rk.color}`
                    : isDone
                    ? '1px solid rgba(34, 197, 94, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected
                    ? 'rgba(30, 41, 59, 0.95)'
                    : isDone
                    ? 'rgba(34, 197, 94, 0.08)'
                    : 'rgba(15, 23, 42, 0.6)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Top header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                    Club #{idx + 1}
                  </span>
                  {isDone ? (
                    <span style={{ color: '#22c55e', display: 'flex' }} title="Completed">
                      <CheckCircle2 size={14} />
                    </span>
                  ) : rk.progress > 0 ? (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: rk.color,
                        background: 'rgba(255,255,255,0.06)',
                        padding: '1px 5px',
                        borderRadius: 4,
                      }}
                    >
                      {pct}%
                    </span>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
                      <Lock size={12} />
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: isSelected ? '#fff' : rk.color, marginTop: 4 }}>
                  {rk.name}
                </div>

                <div style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 700, marginTop: 2 }}>
                  ${rk.grossIncome.toLocaleString()} Gross
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.1)',
                    marginTop: 8,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: isDone ? '#22c55e' : rk.color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>
                  <span>Slots</span>
                  <b style={{ color: '#fff' }}>
                    {rk.progress} / {rk.requiredMembers}
                  </b>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 3. SELECTED CLUB ECONOMICS & TELEMETRY ──────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {/* Card 1: Gross Income */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
            Gross Matrix Income
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: currentRankConfig.color, marginTop: 4 }}>
            ${currentRankConfig.grossIncome.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>USDT</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
            From {currentRankConfig.requiredMembers} team slot completions
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#22c55e', fontWeight: 800, textTransform: 'uppercase' }}>
            Instant Net Profit
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#22c55e', marginTop: 4 }}>
            ${currentRankConfig.netProfit.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>USDT</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#86efac', marginTop: 4 }}>
            Credited instantly to user wallet upon completion
          </div>
        </div>

        {/* Card 3: Upgrade Fee */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase' }}>
            Next Rank Upgrade Fee
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#c084fc', marginTop: 4 }}>
            ${currentRankConfig.upgradeFee.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>USDT</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#d8b4fe', marginTop: 4 }}>
            Auto-upgrades member to Club #{activeRankIdx + 2}
          </div>
        </div>

        {/* Card 4: Sponsor Bonus & Progress */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>
            Sponsor Bonus & Status
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
            ${currentRankConfig.sponsorIncome.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>USDT</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#fde68a', marginTop: 4 }}>
            Status:{' '}
            <b style={{ color: currentRankState.completed ? '#22c55e' : '#fbbf24' }}>
              {currentRankState.completed ? 'COMPLETED (100%)' : `${currentRankState.progress}/${currentRankState.requiredMembers} Filled (${completionPct}%)`}
            </b>
          </div>
        </div>
      </div>

      {/* ── 4. INTERACTIVE MATRIX GENEALOGY TREE CANVAS ────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: 20,
          padding: '24px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          minHeight: 540,
          overflowX: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Floating Zoom Controls */}
        <div
          style={{
            position: 'sticky',
            top: 10,
            alignSelf: 'flex-end',
            zIndex: 30,
            marginBottom: 16,
          }}
        >
          <TreeZoomControls zoom={zoom} setZoom={setZoom} min={0.3} max={1.6} step={0.1} />
        </div>

        {/* Scaled Tree Container */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: 'max-content',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 20px 40px',
          }}
        >
          {/* ROOT NODE: CURRENT FOCUS USER */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
              border: `2px solid ${currentRankConfig.color}`,
              borderRadius: 18,
              padding: '16px 22px',
              minWidth: 260,
              boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${currentRankConfig.color}25`,
              textAlign: 'center',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 20,
                background: currentRankConfig.color + '25',
                border: `1px solid ${currentRankConfig.color}60`,
                color: currentRankConfig.color,
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              <Trophy size={12} /> CLUB #{activeRankIdx + 1}: {currentRankConfig.name.toUpperCase()} MATRIX ROOT
            </div>

            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff', fontSize: '0.98rem' }}>
              {activeTarget ? `${activeTarget.slice(0, 8)}...${activeTarget.slice(-6)}` : '0x...'}
            </div>

            {memberId && (
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    background: 'rgba(234, 179, 8, 0.18)',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    color: '#facc15',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                  }}
                >
                  🆔 {memberId}
                </span>
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
              Matrix Progression:{' '}
              <b style={{ color: currentRankState.completed ? '#22c55e' : currentRankConfig.color }}>
                {currentRankState.progress} / {currentRankConfig.requiredMembers} Completed
              </b>
            </div>
          </div>

          {/* CONNECTOR LINE FROM ROOT */}
          <div
            style={{
              width: 2,
              height: 36,
              background: `linear-gradient(to bottom, ${currentRankConfig.color}, rgba(255,255,255,0.2))`,
            }}
          />

          {/* HORIZONTAL BUS BAR */}
          <div
            style={{
              width: '90%',
              maxWidth: Math.min(1200, Math.max(300, currentRankConfig.requiredMembers * 140)),
              height: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              position: 'relative',
              marginBottom: 20,
            }}
          />

          {/* MATRIX SLOTS GRID */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: currentRankConfig.requiredMembers > 16 ? 'wrap' : 'nowrap',
              justifyContent: 'center',
              maxWidth: 1200,
            }}
          >
            {downlineSlots.map((slot) => {
              const isFilled = slot.filled
              return (
                <div
                  key={slot.slotIndex}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {/* Vertical drop line */}
                  <div
                    style={{
                      width: 2,
                      height: 18,
                      background: isFilled ? '#22c55e' : 'rgba(255, 255, 255, 0.15)',
                      marginTop: -20,
                      marginBottom: 8,
                    }}
                  />

                  {/* Slot Card */}
                  <div
                    onClick={() => {
                      if (slot.address) {
                        setActiveTarget(slot.address)
                        if (onSelectMember) onSelectMember(slot.address)
                      }
                    }}
                    style={{
                      width: 140,
                      minHeight: 120,
                      borderRadius: 14,
                      padding: 12,
                      background: isFilled
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(15, 23, 42, 0.95))'
                        : 'rgba(15, 23, 42, 0.5)',
                      border: isFilled
                        ? '1.5px solid rgba(34, 197, 94, 0.5)'
                        : '1.5px dashed rgba(255, 255, 255, 0.15)',
                      boxShadow: isFilled ? '0 4px 16px rgba(34, 197, 94, 0.15)' : 'none',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: slot.address ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div>
                      {/* Slot Header */}
                      <div
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: isFilled ? '#22c55e' : '#94a3b8',
                          textTransform: 'uppercase',
                        }}
                      >
                        Slot #{slot.slotIndex} ({slot.position})
                      </div>

                      {/* Icon */}
                      <div style={{ margin: '8px 0' }}>
                        {isFilled ? (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'rgba(34, 197, 94, 0.2)',
                              border: '1px solid rgba(34, 197, 94, 0.5)',
                              color: '#22c55e',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={16} />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px dashed rgba(255, 255, 255, 0.2)',
                              color: '#64748b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Users size={15} />
                          </div>
                        )}
                      </div>

                      {/* Status / Address */}
                      {slot.address ? (
                        <div>
                          {slot.memberId && (
                            <div style={{ marginBottom: 4 }}>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  background: 'rgba(234, 179, 8, 0.2)',
                                  border: '1px solid rgba(234, 179, 8, 0.4)',
                                  color: '#facc15',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                }}
                              >
                                🆔 {slot.memberId}
                              </span>
                            </div>
                          )}
                          <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#fff', fontWeight: 700 }}>
                            {slot.address.slice(0, 6)}...{slot.address.slice(-4)}
                          </div>
                          {slot.label && (
                            <div style={{ fontSize: '0.65rem', color: isFilled ? '#86efac' : '#94a3b8', marginTop: 2 }}>
                              {slot.label}
                            </div>
                          )}
                          {slot.isDirect !== undefined && (
                            <div style={{ marginTop: 4 }}>
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  fontWeight: 800,
                                  background: slot.isDirect ? 'rgba(34, 197, 94, 0.25)' : 'rgba(168, 85, 247, 0.25)',
                                  color: slot.isDirect ? '#4ade80' : '#c084fc',
                                  border: `1px solid ${slot.isDirect ? 'rgba(34, 197, 94, 0.45)' : 'rgba(168, 85, 247, 0.45)'}`,
                                }}
                              >
                                {slot.isDirect ? '⭐ Direct' : '⚡ Spillover'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : isFilled ? (
                        <div style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 700 }}>
                          Filled Downline
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {slot.label || 'Awaiting Placement'}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: isFilled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: isFilled ? '#22c55e' : '#64748b',
                        marginTop: 6,
                      }}
                    >
                      {isFilled ? 'CONTRIBUTED' : 'OPEN'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 5. HOW CASCADING ENGINE WORKS ─────────────────────────── */}
        <div
          style={{
            marginTop: 20,
            width: '100%',
            maxWidth: 1000,
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: 14,
            padding: '16px 20px',
            fontSize: '0.82rem',
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c084fc', fontWeight: 800, marginBottom: 6 }}>
            <Sparkles size={16} /> How Cascading Club Matrix Progression Works:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 10 }}>
            <div>
              <b style={{ color: '#fff' }}>1. Personal Downline Fill:</b> New team registrations in your binary hierarchy increment your Club #1 (Starter) progress counter.
            </div>
            <div>
              <b style={{ color: '#22c55e' }}>2. Net Profit Distribution:</b> When all {currentRankConfig.requiredMembers} slots fill, ${currentRankConfig.netProfit} USDT net profit is instantly credited to your wallet.
            </div>
            <div>
              <b style={{ color: '#c084fc' }}>3. Auto-Upgrade & Cascade:</b> ${currentRankConfig.upgradeFee} USDT upgrade fee is deducted, and your completion triggers +1 progress to your binary parent in the next Club rank!
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
