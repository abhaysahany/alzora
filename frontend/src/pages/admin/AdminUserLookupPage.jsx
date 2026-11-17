import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { useAdminMembers } from '../../hooks/useAdminMembers'
import { useChainId } from 'wagmi'
import { createPublicClient, http, formatUnits, isAddress, getAddress } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import {
  getContractAddresses,
  getRpcUrl,
  getTokenDecimals,
  ELZORA_GATEWAY_ABI,
  ELZORA_MAIN_ABI,
} from '../../web3/contracts'
import {
  Search,
  User,
  Shield,
  ArrowRight,
  Sparkles,
  Users,
  DollarSign,
  Layers,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Crown,
  Copy,
  Check,
  Split,
  Network,
  Award,
  ExternalLink,
  GitCommit,
  GitFork,
  Activity,
  Calendar,
  Wallet,
} from 'lucide-react'

const CLUB_RANKS = [
  'Member',
  'Starter',
  'Leader',
  'Achiever',
  'Mentor',
  'Director',
  'Elite',
  'Crown',
  'Legend',
]

const RANK_BADGE_COLORS = {
  None: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
  Member: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
  Starter: { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 0.4)', text: '#818cf8' },
  Leader: { bg: 'rgba(56, 189, 248, 0.2)', border: 'rgba(56, 189, 248, 0.4)', text: '#38bdf8' },
  Achiever: { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: '#c084fc' },
  Mentor: { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 0.4)', text: '#f472b6' },
  Director: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24' },
  Elite: { bg: 'rgba(74, 222, 128, 0.2)', border: 'rgba(74, 222, 128, 0.4)', text: '#4ade80' },
  Crown: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.4)', text: '#fb923c' },
  Legend: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171' },
}

export function AdminUserLookupPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParamId = searchParams.get('id') || searchParams.get('address') || searchParams.get('user') || ''
  const navigate = useNavigate()

  const { members = [] } = useAdminMembers()
  const chainId = useChainId()
  const activeChainId = Number(chainId) === 56 ? 56 : 97
  const activeChain = activeChainId === 97 ? bscTestnet : bsc
  const rpcUrl = getRpcUrl(activeChainId)
  const CONTRACT_ADDRESSES = getContractAddresses(activeChainId)
  const tokenDecimals = getTokenDecimals(activeChainId)
  const rootAddress = CONTRACT_ADDRESSES.ROOT_ID || '0x23cC13FF391bBcbF573467138d5DF4D9174B64Eb'

  const [searchInput, setSearchInput] = useState(queryParamId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copiedText, setCopiedText] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [directsDossiers, setDirectsDossiers] = useState([])

  const copyToClipboard = (text, e) => {
    if (e) e.stopPropagation()
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // Lookup dossier for any user
  const fetchMemberDossier = useCallback(
    async (query) => {
      if (!query || !query.trim()) return

      setLoading(true)
      setError(null)
      setDashboard(null)
      setDirectsDossiers([])

      try {
        const client = createPublicClient({ chain: activeChain, transport: http(rpcUrl) })
        let cleanQuery = query.toString().trim()
        let targetAddr = null

        // 1. Check if matches loaded members
        if (Array.isArray(members) && members.length > 0) {
          const q = cleanQuery.toLowerCase()
          const matched = members.find(
            (m) =>
              m.wallet?.toLowerCase() === q ||
              m.address?.toLowerCase() === q ||
              (m.memberId && m.memberId.toLowerCase() === q) ||
              (m.memberIdRaw && String(m.memberIdRaw) === q) ||
              `elz${m.memberIdRaw}` === q ||
              `#${m.memberIdRaw}` === q ||
              `#${m.id}` === q ||
              String(m.id) === q
          )
          if (matched) {
            targetAddr = matched.wallet || matched.address
          }
        }

        // 2. Check if valid 0x address
        if (!targetAddr && /^0x[a-fA-F0-9]{40}$/i.test(cleanQuery)) {
          try {
            targetAddr = getAddress(cleanQuery)
          } catch {
            targetAddr = cleanQuery
          }
        }

        // 3. Check if numeric or ELZ Member ID
        if (!targetAddr) {
          const numStr = cleanQuery.replace(/^#|^elz|^id\s*/i, '').trim()
          if (/^\d+$/.test(numStr)) {
            const numericId = parseInt(numStr, 10)
            if (numericId === 1) {
              targetAddr = CONTRACT_ADDRESSES.ROOT_ID || '0xE60746348b128D3D99546d78E646946599a0311e'
            } else {
              try {
                const resolved = await client.readContract({
                  address: CONTRACT_ADDRESSES.GATEWAY,
                  abi: ELZORA_GATEWAY_ABI,
                  functionName: 'getAddressByMemberId',
                  args: [BigInt(numericId)],
                })
                if (resolved && resolved !== '0x0000000000000000000000000000000000000000') {
                  targetAddr = getAddress(resolved)
                }
              } catch (err) {
                console.warn('Member ID resolution failed:', err)
              }

              // Fallback: Check Global Matrix ID on ELZORA Main
              if (!targetAddr && numericId <= 10000) {
                try {
                  const matrixAddr = await client.readContract({
                    address: CONTRACT_ADDRESSES.ELZORA,
                    abi: ELZORA_MAIN_ABI,
                    functionName: 'globalMatrixUsers',
                    args: [BigInt(numericId)],
                  })
                  if (matrixAddr && matrixAddr !== '0x0000000000000000000000000000000000000000') {
                    targetAddr = getAddress(matrixAddr)
                  }
                } catch (err) {
                  console.warn('Matrix ID resolution failed:', err)
                }
              }
            }
          }
        }

        if (!targetAddr) {
          setError(`No registered user found for "${cleanQuery}". Please verify the wallet address or Member ID.`)
          setLoading(false)
          return
        }

        // Fetch Dashboard from Gateway
        const rawDashboard = await client.readContract({
          address: CONTRACT_ADDRESSES.GATEWAY,
          abi: ELZORA_GATEWAY_ABI,
          functionName: 'getUserDashboard',
          args: [targetAddr],
        })

        if (!rawDashboard || !rawDashboard.profile || !rawDashboard.profile.isRegistered) {
          setError(`Address ${targetAddr} is not registered in the ELZORA smart contract system.`)
          setLoading(false)
          return
        }

        // Fetch Member ID
        let resolvedMemberId = null
        try {
          const mIdNum = await client.readContract({
            address: CONTRACT_ADDRESSES.GATEWAY,
            abi: ELZORA_GATEWAY_ABI,
            functionName: 'getMemberId',
            args: [targetAddr],
          })
          if (mIdNum && Number(mIdNum) > 0) {
            resolvedMemberId = `ELZ${mIdNum.toString()}`
          }
        } catch {}

        const prof = rawDashboard.profile
        const inc = rawDashboard.income
        const directs = Array.isArray(rawDashboard.directReferrals) ? rawDashboard.directReferrals : []

        const divisor = Math.pow(10, tokenDecimals)
        const rNum = Number(prof.currentRank || 1)
        const rankName = CLUB_RANKS[rNum] || 'Starter'

        // Fetch Pending Income Deduction (for overpayment reconciliation from Main contract)
        let pendingDeductionAmount = 0
        try {
          const pendingRaw = await client.readContract({
            address: CONTRACT_ADDRESSES.ELZORA,
            abi: ELZORA_MAIN_ABI,
            functionName: 'pendingIncomeDeduction',
            args: [targetAddr],
          })
          if (pendingRaw && pendingRaw > 0n) {
            pendingDeductionAmount = Number(formatUnits(pendingRaw, tokenDecimals))
          }
        } catch (e) {
          console.error("Error reading pendingIncomeDeduction in Admin Lookup:", e)
        }

        const parsedDashboard = {
          userAddress: targetAddr,
          memberId: resolvedMemberId,
          sponsor: prof.sponsor,
          binaryParent: prof.parent,
          leftChild: prof.leftChild && prof.leftChild !== '0x0000000000000000000000000000000000000000' ? prof.leftChild : null,
          rightChild: prof.rightChild && prof.rightChild !== '0x0000000000000000000000000000000000000000' ? prof.rightChild : null,
          position: Number(prof.position || 0),
          currentRank: rNum,
          rankName,
          directCount: Number(prof.directCount || 0n),
          leftDirectCount: Number(prof.leftDirectCount || 0n),
          rightDirectCount: Number(prof.rightDirectCount || 0n),
          leftTeamCount: Number(prof.leftTeamCount || 0n),
          rightTeamCount: Number(prof.rightTeamCount || 0n),
          leftCarryVolume: Number(prof.leftCarryVolume || 0n),
          rightCarryVolume: Number(prof.rightCarryVolume || 0n),
          isRegistered: Boolean(prof.isRegistered),
          totalIncomeEarned: Number(prof.totalIncomeEarned || 0n) / divisor,
          pendingDeduction: pendingDeductionAmount,
          completedLifetimeMilestones: Number(prof.completedLifetimeMilestones || 0n),
          incomeBreakdown: {
            directIncome: Number(inc.directIncome || 0n) / divisor,
            affiliateIncome: Number(inc.affiliateIncome || 0n) / divisor,
            clubIncome: Number(inc.clubIncome || 0n) / divisor,
            matchingIncome: Number(inc.matchingIncome || 0n) / divisor,
            championIncome: Number(inc.championIncome || 0n) / divisor,
            weeklyIncome: Number(inc.weeklyIncome || 0n) / divisor,
            lifetimeIncome: Number(inc.lifetimeIncome || 0n) / divisor,
            globalClubIncome: Number(inc.globalClubIncome || 0n) / divisor,
          },
          directReferrals: directs,
          isChampionEligible: Boolean(rawDashboard.isChampionEligible),
          isWeeklyEligibleCurrentEpoch: Boolean(rawDashboard.isWeeklyEligibleCurrentEpoch),
          currentWeeklyDirects: Number(rawDashboard.currentWeeklyDirects || 0n),
          todayMatchingPairs: Number(rawDashboard.todayMatchingPairs || 0n),
          globalClubEntriesCount: Number(rawDashboard.globalClubEntriesCount || 0n),
          globalClubCyclesCompleted: Number(rawDashboard.globalClubCyclesCompleted || 0n),
        }

        setDashboard(parsedDashboard)

        // Fetch Direct Referrals profiles (up to 30)
        if (directs.length > 0) {
          try {
            const batchDash = await client.readContract({
              address: CONTRACT_ADDRESSES.GATEWAY,
              abi: ELZORA_GATEWAY_ABI,
              functionName: 'getMultipleUserDashboards',
              args: [directs.slice(0, 30)],
            })

            const parsedDirects = batchDash.map((d, idx) => {
              const dRank = Number(d.profile.currentRank || 1)
              return {
                address: directs[idx],
                rank: dRank,
                rankName: CLUB_RANKS[dRank] || 'Member',
                directCount: Number(d.profile.directCount || 0n),
                teamVolume: Number(d.profile.leftTeamCount || 0n) + Number(d.profile.rightTeamCount || 0n),
                totalEarned: Number(d.profile.totalIncomeEarned || 0n) / divisor,
              }
            })
            setDirectsDossiers(parsedDirects)
          } catch (err) {
            console.warn('Failed to batch-fetch directs:', err)
          }
        }
      } catch (err) {
        console.error('Failed to query user dossier:', err)
        setError('Error reading user data from blockchain. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [activeChain, rpcUrl, CONTRACT_ADDRESSES.GATEWAY, tokenDecimals, members]
  )

  useEffect(() => {
    if (queryParamId) {
      setSearchInput(queryParamId)
      fetchMemberDossier(queryParamId)
    }
  }, [queryParamId, fetchMemberDossier])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setSearchParams({ id: searchInput.trim() })
    fetchMemberDossier(searchInput.trim())
  }

  const handleQuickLookup = (addr) => {
    setSearchInput(addr)
    setSearchParams({ id: addr })
    fetchMemberDossier(addr)
  }

  const rankBadgeStyle = dashboard
    ? RANK_BADGE_COLORS[dashboard.rankName] || RANK_BADGE_COLORS.Member
    : RANK_BADGE_COLORS.Member

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1380, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* HEADER BAR */}
        <div
          className="glass-card"
          style={{
            padding: '24px 28px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.9) 0%, rgba(10, 14, 38, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: '0.78rem',
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              <Shield size={14} /> COMPLETE ON-CHAIN MEMBER AUDIT
            </div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
              User Deep Lookup & Lineage Dossier
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>
              Inspect all registration data, 8 income streams, matrix placements, team volumes, and directs of any member.
            </p>
          </div>

          {/* Quick Root button */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleQuickLookup(rootAddress)}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid rgba(251, 191, 36, 0.35)',
                background: 'rgba(251, 191, 36, 0.12)',
                color: '#ffd700',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Crown size={15} />
              <span>Inspect Master Root (#1)</span>
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            borderRadius: 20,
            background: 'rgba(11, 15, 36, 0.85)',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 320px' }}>
              <Search size={18} color="var(--muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by 0x wallet address or Member ID (e.g. 0xd3bada... or ELZ1)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 26px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
              <span>Audit Member</span>
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div style={{ padding: 80, textAlign: 'center', color: '#c084fc' }}>
            <RefreshCw size={40} className="spin" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Loading On-Chain Dossier...</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 6 }}>
              Querying profile, 8-stream earnings, matrix positions, and directs from ELZORA Gateway router...
            </div>
          </div>
        )}

        {/* MEMBER DOSSIER DETAILS */}
        {!loading && dashboard && (
          <>
            {/* DOSSIER HEADER CARD */}
            <div
              className="glass-card"
              style={{
                padding: 24,
                borderRadius: 24,
                background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  <User size={28} color="#fff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                      {dashboard.userAddress.slice(0, 8)}...{dashboard.userAddress.slice(-6)}
                    </h3>
                    <button
                      onClick={(e) => copyToClipboard(dashboard.userAddress, e)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: copiedText === dashboard.userAddress ? '#10b981' : '#cbd5e1',
                        padding: '4px 8px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.75rem',
                      }}
                    >
                      {copiedText === dashboard.userAddress ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedText === dashboard.userAddress ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={activeChainId === 56 ? `https://bscscan.com/address/${dashboard.userAddress}` : `https://testnet.bscscan.com/address/${dashboard.userAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#cbd5e1',
                        padding: '4px 8px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.75rem',
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={12} />
                      <span>BSCScan</span>
                    </a>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    {dashboard.memberId && (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: '#38bdf8',
                          padding: '2px 10px',
                          borderRadius: 8,
                        }}
                      >
                        Member ID: {dashboard.memberId}
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: rankBadgeStyle.bg,
                        border: `1px solid ${rankBadgeStyle.border}`,
                        color: rankBadgeStyle.text,
                        padding: '2px 10px',
                        borderRadius: 8,
                      }}
                    >
                      Rank: {dashboard.rankName} (Tier {dashboard.currentRank})
                    </span>

                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: dashboard.isRegistered ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: dashboard.isRegistered ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                        color: dashboard.isRegistered ? '#4ade80' : '#f87171',
                        padding: '2px 10px',
                        borderRadius: 8,
                      }}
                    >
                      Status: {dashboard.isRegistered ? 'Active Account ($50 Paid)' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Jump to trees) */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  to={`/admin/tree?focus=${dashboard.userAddress}&tab=binary`}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <GitCommit size={15} />
                  <span>Inspect Binary Tree</span>
                </Link>

                <Link
                  to={`/admin/affiliate-matrix?focus=${dashboard.userAddress}`}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Network size={15} />
                  <span>Inspect Affiliate Matrix</span>
                </Link>

                <Link
                  to={`/admin/tree?focus=${dashboard.userAddress}&tab=sponsor`}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Users size={15} />
                  <span>Sponsor Lineage</span>
                </Link>
              </div>
            </div>

            {/* ADVANCE PAYMENT / PENDING DEDUCTION CARD */}
            {dashboard.pendingDeduction > 0 && (
              <div
                style={{
                  padding: '20px 26px',
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(245, 158, 11, 0.12) 100%)',
                  border: '1.5px solid rgba(239, 68, 68, 0.45)',
                  boxShadow: '0 12px 30px rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 20,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 280 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'rgba(239, 68, 68, 0.25)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AlertTriangle size={26} color="#ef4444" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fecaca', letterSpacing: '0.02em' }}>
                        Advance Payment Adjustment Active (अग्रिम भुगतान रिकवरी सक्रिय)
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(239, 68, 68, 0.3)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          color: '#fca5a5',
                          textTransform: 'uppercase',
                        }}
                      >
                        Live Auto-Deduction
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: 4, maxWidth: 720, lineHeight: 1.5 }}>
                      इस यूजर को पूर्व में <strong>${dashboard.pendingDeduction.toFixed(2)} USDT</strong> की अतिरिक्त/अग्रिम राशि का भुगतान हो चुका है। आगामी कमाई (बाइनरी मैचिंग, ग्लोबल अफिलिएट, क्लब इनकम) से यह बकाया ऑन-चेन स्मार्ट कॉन्ट्रैक्ट द्वारा स्वतः काटा जाएगा। जैसे-जैसे नई इनकम जनरेट होगी, यह बैलेंस स्वतः घटता जाएगा और <strong>$0.00</strong> होने के बाद नई इनकम सीधे यूजर के वॉलेट में जाएगी।
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.4)', padding: '12px 22px', borderRadius: 14, border: '1px solid rgba(239, 68, 68, 0.35)', minWidth: 200 }}>
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 800 }}>शेष अग्रिम राशि (Remaining Advance)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444', marginTop: 2 }}>
                    ${dashboard.pendingDeduction.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>USDT</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>
                    Deduction in Progress
                  </div>
                </div>
              </div>
            )}

            {/* KEY METRICS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="glass-card" style={{ padding: 20, borderRadius: 16, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(74, 222, 128, 0.25)' }}>
                <div style={{ fontSize: '0.74rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>Total Earned to Wallet</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#4ade80', marginTop: 4 }}>
                  ${dashboard.totalIncomeEarned.toFixed(2)} <span style={{ fontSize: '0.85rem' }}>USDT</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>Instant Web3 Payouts</div>
              </div>

              <div className="glass-card" style={{ padding: 20, borderRadius: 16, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                <div style={{ fontSize: '0.74rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase' }}>Direct Referrals</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#c084fc', marginTop: 4 }}>
                  {dashboard.directCount} <span style={{ fontSize: '0.85rem' }}>Members</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                  L: {dashboard.leftDirectCount} | R: {dashboard.rightDirectCount}
                </div>
              </div>

              <div className="glass-card" style={{ padding: 20, borderRadius: 16, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>Left / Right Subtrees</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                  {dashboard.leftTeamCount} / {dashboard.rightTeamCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                  Carry: L {dashboard.leftCarryVolume} | R {dashboard.rightCarryVolume}
                </div>
              </div>

              <div className="glass-card" style={{ padding: 20, borderRadius: 16, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                <div style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>Single Leg Queue</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
                  {dashboard.globalClubEntriesCount} <span style={{ fontSize: '0.85rem' }}>Entries</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                  Completed Cycles: {dashboard.globalClubCyclesCompleted}
                </div>
              </div>
            </div>

            {/* 8-STREAM INCOME BREAKDOWN */}
            <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                8-Stream Financial Income Breakdown
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>1. Direct Income (20% = $10)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                    ${dashboard.incomeBreakdown.directIncome.toFixed(2)} USDT
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>2. 20-Level Affiliate (14% = $7)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                    ${dashboard.incomeBreakdown.affiliateIncome.toFixed(2)} USDT
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>3. 8 Club Matrices (24% = $12)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
                    ${dashboard.incomeBreakdown.clubIncome.toFixed(2)} USDT
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>4. Binary Matching ($2 / Pair)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#c084fc', marginTop: 4 }}>
                    ${dashboard.incomeBreakdown.matchingIncome.toFixed(2)} USDT
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                    {(dashboard.incomeBreakdown.matchingIncome / 2).toFixed(0)} Pairs Matched (Today: {dashboard.todayMatchingPairs})
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>5. Champion Club Pool (6% = $3)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f472b6', marginTop: 4 }}>
                    ${dashboard.incomeBreakdown.championIncome.toFixed(2)} USDT
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>6. Weekly Reward Pool (6% = $3)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#4ade80', marginTop: 4 }}>
                    ${dashboard.incomeBreakdown.weeklyIncome.toFixed(2)} USDT
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>7. Lifetime Milestones (10% = $5)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f97316', marginTop: 4 }}>
                    ${dashboard.incomeBreakdown.lifetimeIncome.toFixed(2)} USDT
                  </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>8. Single Leg / Global Club ($25)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#06b6d4', marginTop: 4 }}>
                    ${dashboard.incomeBreakdown.globalClubIncome.toFixed(2)} USDT
                  </div>
                </div>
              </div>
            </div>

            {/* PLACEMENT & LINEAGE INFO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* Sponsor & Parent */}
              <div className="glass-card" style={{ padding: 20, borderRadius: 18, background: 'rgba(11, 15, 36, 0.85)' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                  Lineage Upline & Placement
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--muted)' }}>Direct Sponsor:</span>
                    {dashboard.sponsor && dashboard.sponsor !== '0x0000000000000000000000000000000000000000' ? (
                      <button
                        onClick={() => handleQuickLookup(dashboard.sponsor)}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontFamily: 'monospace', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {dashboard.sponsor.slice(0, 8)}...{dashboard.sponsor.slice(-6)}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>None (Master Root)</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--muted)' }}>Binary Tree Parent:</span>
                    {dashboard.binaryParent && dashboard.binaryParent !== '0x0000000000000000000000000000000000000000' ? (
                      <button
                        onClick={() => handleQuickLookup(dashboard.binaryParent)}
                        style={{ background: 'transparent', border: 'none', color: '#c084fc', fontFamily: 'monospace', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {dashboard.binaryParent.slice(0, 8)}...{dashboard.binaryParent.slice(-6)}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>None (Master Root)</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--muted)' }}>Placement Position:</span>
                    <span style={{ fontWeight: 800, color: dashboard.position === 1 ? '#38bdf8' : dashboard.position === 2 ? '#a855f7' : '#ffd700' }}>
                      {dashboard.position === 1 ? 'Left Branch' : dashboard.position === 2 ? 'Right Branch' : 'Root Position'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Binary Children */}
              <div className="glass-card" style={{ padding: 20, borderRadius: 18, background: 'rgba(11, 15, 36, 0.85)' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                  Direct Binary Downline
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>Left Child:</span>
                    {dashboard.leftChild ? (
                      <button
                        onClick={() => handleQuickLookup(dashboard.leftChild)}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontFamily: 'monospace', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {dashboard.leftChild.slice(0, 8)}...{dashboard.leftChild.slice(-6)}
                      </button>
                    ) : (
                      <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>[ Vacant Spot ]</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#a855f7', fontWeight: 700 }}>Right Child:</span>
                    {dashboard.rightChild ? (
                      <button
                        onClick={() => handleQuickLookup(dashboard.rightChild)}
                        style={{ background: 'transparent', border: 'none', color: '#a855f7', fontFamily: 'monospace', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {dashboard.rightChild.slice(0, 8)}...{dashboard.rightChild.slice(-6)}
                      </button>
                    ) : (
                      <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>[ Vacant Spot ]</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DIRECT REFERRALS DOSSIER TABLE */}
            <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                  Direct Sponsoring Dossier ({dashboard.directCount} Members)
                </h3>
              </div>

              {directsDossiers.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
                  {dashboard.directCount === 0 ? 'This member has not sponsored any direct referrals yet.' : 'Loading direct referrals...'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--muted)' }}>
                        <th style={{ padding: '10px 14px' }}>#</th>
                        <th style={{ padding: '10px 14px' }}>MEMBER WALLET</th>
                        <th style={{ padding: '10px 14px' }}>RANK</th>
                        <th style={{ padding: '10px 14px' }}>DIRECTS</th>
                        <th style={{ padding: '10px 14px' }}>TEAM VOLUME</th>
                        <th style={{ padding: '10px 14px' }}>TOTAL EARNED</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {directsDossiers.map((dir, idx) => (
                        <tr key={dir.address} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#fff' }}>
                            {dir.address.slice(0, 8)}...{dir.address.slice(-6)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 700 }}>
                              {dir.rankName}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 700 }}>{dir.directCount}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{dir.teamVolume} nodes</td>
                          <td style={{ padding: '12px 14px', color: '#10b981', fontWeight: 700 }}>
                            ${dir.totalEarned.toFixed(2)} USDT
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleQuickLookup(dir.address)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                color: '#38bdf8',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Audit Member
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminUserLookupPage
