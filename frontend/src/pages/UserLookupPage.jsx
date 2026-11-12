import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useChainId } from 'wagmi'
import { createPublicClient, http, formatUnits, isAddress } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import BackgroundCanvas from '../components/BackgroundCanvas'
import { getContractAddresses, getRpcUrl, ELZORA_GATEWAY_ABI } from '../web3/contracts'
import { useWalletAuth } from '../hooks/useWalletAuth'
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
  ArrowLeft,
  Zap,
  TrendingUp,
  RefreshCw,
  Crown,
  Share2,
  Copy,
  Check,
  Split,
  AlertCircle,
  Network,
  Award,
  ExternalLink,
  Lock,
  Eye,
  GitCommit,
  Clock,
  HelpCircle,
  Flame,
  Activity,
  Calendar,
} from 'lucide-react'

const RANK_CONFIGS = [
  { id: 1, name: 'Starter', members: 2, gross: 24, upgrade: 14, sponsor: 0, net: 10, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  { id: 2, name: 'Leader', members: 4, gross: 56, upgrade: 30, sponsor: 0, net: 26, color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)' },
  { id: 3, name: 'Achiever', members: 8, gross: 240, upgrade: 96, sponsor: 24, net: 120, color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
  { id: 4, name: 'Mentor', members: 16, gross: 1536, upgrade: 500, sponsor: 125, net: 911, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  { id: 5, name: 'Director', members: 32, gross: 16000, upgrade: 5000, sponsor: 1250, net: 9750, color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' },
  { id: 6, name: 'Elite', members: 64, gross: 320000, upgrade: 15000, sponsor: 3750, net: 301250, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 7, name: 'Crown', members: 128, gross: 1920000, upgrade: 30000, sponsor: 7500, net: 1882500, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' },
  { id: 8, name: 'Legend', members: 256, gross: 7680000, upgrade: 0, sponsor: 0, net: 7680000, color: '#ffd700', bg: 'rgba(255, 215, 0, 0.2)' },
]

const RANK_NAMES = {
  1: 'Starter',
  2: 'Leader',
  3: 'Achiever',
  4: 'Mentor',
  5: 'Director',
  6: 'Elite',
  7: 'Crown',
  8: 'Legend',
}

export function UserLookupPage() {
  const { id: urlParamId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryParamId = searchParams.get('id')
  const initialSearch = urlParamId || queryParamId || ''

  const navigate = useNavigate()
  const { address: connectedAddress } = useWalletAuth()
  const chainId = useChainId()
  const CONTRACT_ADDRESSES = getContractAddresses(chainId)
  const rpcUrl = getRpcUrl(chainId)
  const activeChain = Number(chainId) === 97 ? bscTestnet : bsc

  const [searchInput, setSearchInput] = useState(initialSearch)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [directsDossiers, setDirectsDossiers] = useState([])
  const [binaryChildrenDossiers, setBinaryChildrenDossiers] = useState({ left: null, right: null })
  const [copiedText, setCopiedText] = useState(null)
  const [activeTreeTab, setActiveTreeTab] = useState('directs') // 'directs' | 'binary'
  const [activeSection, setActiveSection] = useState('all') // 'all' | 'income' | 'tree' | 'ranks'

  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const fetchMemberDossier = useCallback(
    async (query) => {
      if (!query) return

      setLoading(true)
      setError(null)
      setDashboard(null)
      setDirectsDossiers([])
      setBinaryChildrenDossiers({ left: null, right: null })

      try {
        const publicClient = createPublicClient({ chain: activeChain, transport: http(rpcUrl) })
        let cleanQuery = query.toString().trim()
        let targetAddr = null

        if (isAddress(cleanQuery)) {
          targetAddr = cleanQuery
        } else {
          // Special quick aliases
          if (connectedAddress && (cleanQuery.toLowerCase() === 'me' || cleanQuery === '1')) {
            targetAddr = connectedAddress
          } else {
            targetAddr = CONTRACT_ADDRESSES.ROOT_ID || '0x23cC13FF391bBcbF573467138d5DF4D9174B64Eb'
          }
        }

        // 1. Fetch user dashboard from Gateway router
        const rawDashboard = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.GATEWAY,
          abi: ELZORA_GATEWAY_ABI,
          functionName: 'getUserDashboard',
          args: [targetAddr],
        })

        if (!rawDashboard || !rawDashboard.profile) {
          setError('No on-chain ELZORA profile data found for this address.')
          setLoading(false)
          return
        }

        const prof = rawDashboard.profile
        const inc = rawDashboard.income
        const directs = Array.isArray(rawDashboard.directReferrals) ? rawDashboard.directReferrals : []

        const parsedDashboard = {
          userAddress: targetAddr,
          sponsor: prof.sponsor,
          binaryParent: prof.parent,
          leftChild: prof.leftChild,
          rightChild: prof.rightChild,
          position: Number(prof.position || 0),
          currentRank: Number(prof.currentRank || 1),
          rankName: RANK_NAMES[Number(prof.currentRank || 1)] || 'Starter',
          directCount: Number(prof.directCount || 0n),
          leftDirectCount: Number(prof.leftDirectCount || 0n),
          rightDirectCount: Number(prof.rightDirectCount || 0n),
          leftTeamCount: Number(prof.leftTeamCount || 0n),
          rightTeamCount: Number(prof.rightTeamCount || 0n),
          leftCarryVolume: Number(prof.leftCarryVolume || 0n),
          rightCarryVolume: Number(prof.rightCarryVolume || 0n),
          isRegistered: Boolean(prof.isRegistered),
          totalIncomeEarned: formatUnits(prof.totalIncomeEarned || 0n, 6),
          withdrawableBalance: '0.00',
          totalWithdrawn: '0.00',
          completedLifetimeMilestones: Number(prof.completedLifetimeMilestones || 0n),
          incomeBreakdown: {
            directIncome: formatUnits(inc.directIncome || 0n, 6),
            affiliateIncome: formatUnits(inc.affiliateIncome || 0n, 6),
            clubIncome: formatUnits(inc.clubIncome || 0n, 6),
            matchingIncome: formatUnits(inc.matchingIncome || 0n, 6),
            championIncome: formatUnits(inc.championIncome || 0n, 6),
            weeklyIncome: formatUnits(inc.weeklyIncome || 0n, 6),
            lifetimeIncome: formatUnits(inc.lifetimeIncome || 0n, 6),
            globalClubIncome: formatUnits(inc.globalClubIncome || 0n, 6),
          },
          directReferrals: directs,
          isChampionEligible: Boolean(rawDashboard.isChampionEligible),
          pendingChampionReward: formatUnits(rawDashboard.pendingChampionReward || 0n, 6),
          isWeeklyEligibleCurrentEpoch: Boolean(rawDashboard.isWeeklyEligibleCurrentEpoch),
          currentWeeklyDirects: Number(rawDashboard.currentWeeklyDirects || 0n),
          currentWeeklyEpoch: Number(rawDashboard.currentWeeklyEpoch || 0n),
          todayMatchingPairs: Number(rawDashboard.todayMatchingPairs || 0n),
          globalClubEntriesCount: Number(rawDashboard.globalClubEntriesCount || 0n),
          globalClubCyclesCompleted: Number(rawDashboard.globalClubCyclesCompleted || 0n),
          milestoneStatus: Array.from(rawDashboard.milestoneStatus || []).map(Number),
        }

        setDashboard(parsedDashboard)

        // 2. Fetch Direct Referrals Dossiers in batch
        if (directs.length > 0) {
          try {
            const batchDirects = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.GATEWAY,
              abi: ELZORA_GATEWAY_ABI,
              functionName: 'getMultipleUserDashboards',
              args: [directs.slice(0, 50)],
            })

            const parsedDirects = batchDirects.map((d, idx) => ({
              address: directs[idx],
              rank: Number(d.profile.currentRank || 1),
              rankName: RANK_NAMES[Number(d.profile.currentRank || 1)] || 'Starter',
              isRegistered: Boolean(d.profile.isRegistered),
              directCount: Number(d.profile.directCount || 0n),
              teamVolume: Number(d.profile.leftTeamCount || 0n) + Number(d.profile.rightTeamCount || 0n),
              totalEarned: formatUnits(d.profile.totalIncomeEarned || 0n, 6),
            }))
            setDirectsDossiers(parsedDirects)
          } catch (e) {
            console.warn('Could not fetch directs batch:', e)
          }
        }

        // 3. Fetch Binary Children Dossiers
        const binaryChildren = [prof.leftChild, prof.rightChild].filter(
          (a) => a && a !== '0x0000000000000000000000000000000000000000'
        )

        if (binaryChildren.length > 0) {
          try {
            const childrenDash = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.GATEWAY,
              abi: ELZORA_GATEWAY_ABI,
              functionName: 'getMultipleUserDashboards',
              args: [binaryChildren],
            })

            const childMap = {}
            childrenDash.forEach((cd) => {
              const u = cd.profile.userAddress.toLowerCase()
              childMap[u] = {
                address: cd.profile.userAddress,
                leftChild: cd.profile.leftChild,
                rightChild: cd.profile.rightChild,
                rank: Number(cd.profile.currentRank || 1),
                rankName: RANK_NAMES[Number(cd.profile.currentRank || 1)] || 'Starter',
                leftTeamCount: Number(cd.profile.leftTeamCount || 0n),
                rightTeamCount: Number(cd.profile.rightTeamCount || 0n),
                directCount: Number(cd.profile.directCount || 0n),
                totalEarned: formatUnits(cd.profile.totalIncomeEarned || 0n, 6),
                isRegistered: Boolean(cd.profile.isRegistered),
              }
            })

            setBinaryChildrenDossiers({
              left: prof.leftChild ? childMap[prof.leftChild.toLowerCase()] : null,
              right: prof.rightChild ? childMap[prof.rightChild.toLowerCase()] : null,
            })
          } catch (e) {
            console.warn('Could not fetch binary children:', e)
          }
        }
      } catch (err) {
        console.error(err)
        setError('Failed to query member dossier from ELZORA Gateway router.')
      } finally {
        setLoading(false)
      }
    },
    [activeChain, connectedAddress, CONTRACT_ADDRESSES.GATEWAY, CONTRACT_ADDRESSES.ROOT_ID, rpcUrl]
  )

  useEffect(() => {
    if (initialSearch) {
      fetchMemberDossier(initialSearch)
    } else {
      // Default to root ID on landing
      const defaultAddr = CONTRACT_ADDRESSES.ROOT_ID || '0x23cC13FF391bBcbF573467138d5DF4D9174B64Eb'
      setSearchInput(defaultAddr)
      fetchMemberDossier(defaultAddr)
    }
  }, [initialSearch, fetchMemberDossier, CONTRACT_ADDRESSES.ROOT_ID])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchInput.trim()) {
      setError('Please enter a BSC Wallet Address (0x...)')
      return
    }
    setSearchParams({ id: searchInput.trim() })
    fetchMemberDossier(searchInput.trim())
  }

  const inspectAddress = (addr) => {
    if (!addr || addr === '0x0000000000000000000000000000000000000000') return
    setSearchInput(addr)
    setSearchParams({ id: addr })
    fetchMemberDossier(addr)
    window.scrollTo({ top: 180, behavior: 'smooth' })
  }

  // Calculate sum of 8 income streams
  const computedIncomeSum = dashboard
    ? Object.values(dashboard.incomeBreakdown).reduce((acc, curr) => acc + Number(curr || 0), 0)
    : 0

  const isBinaryMatchingQualified = Boolean(
    dashboard && dashboard.leftDirectCount >= 1 && dashboard.rightDirectCount >= 1
  )

  return (
    <div
      className="login-container elzora-page-enter"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#050611',
      }}
    >
      <BackgroundCanvas />

      {/* TOP NAVBAR */}
      <header
        className="nav"
        style={{
          position: 'relative',
          zIndex: 100,
          borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          background: 'rgba(6, 8, 20, 0.88)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="wrap nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
          <div
            className="brand"
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <img
              src="/logo.png"
              alt="ELZORA"
              style={{
                height: 32,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 10px rgba(245, 158, 11, 0.35))',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                color: '#00e5ff',
                fontSize: '0.78rem',
                fontWeight: 800,
              }}
            >
              <Shield size={13} /> PUBLIC AUDIT TELEMETRY
            </span>

            <button
              onClick={() => navigate('/login')}
              className="btn btn-ghost btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                color: 'var(--purple-light)',
                borderRadius: 10,
                padding: '6px 14px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <ArrowLeft size={15} /> Member Login
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 1320,
          width: '100%',
          padding: '0 20px',
          margin: '20px auto 60px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {/* PUBLIC NON-ACTIONABLE AUDIT BANNER */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: 16,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff' }}>
              <Eye size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                100% Non-Actionable Public Audit Inspector
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                Anyone can inspect any member’s on-chain dossier, genealogy, and 8 income streams. No transactions or state modifications can be performed from this page.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.74rem', color: '#00ff88', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={14} /> LIVE BSC RPC
            </span>
          </div>
        </div>

        {/* SEARCH HEADER CARD */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: '24px 28px',
            borderRadius: 22,
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 21, 54, 0.95) 0%, rgba(11, 15, 36, 0.98) 100%)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                borderRadius: 20,
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                color: 'var(--purple-light)',
                fontSize: '0.78rem',
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              <Sparkles size={14} color="#ffd700" /> DECENTRALIZED ON-CHAIN AUDIT ENGINE
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
              ELZORA User Account Dossier
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
              Inspect complete real-time participation metrics, binary genealogy tree, sponsor direct referrals, 8 income streams, club rank progression, and global queue status.
            </p>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 860, margin: '0 auto' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setError(null)
                }}
                placeholder="Enter any BSC Wallet Address (0x...)"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.45)',
                  border: error ? '1px solid #ef4444' : '1px solid rgba(139, 92, 246, 0.45)',
                  padding: '14px 44px 14px 16px',
                  borderRadius: 14,
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
                }}
              />
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--purple-light)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                fontSize: '0.95rem',
                fontWeight: 900,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: loading ? 'wait' : 'pointer',
                background: 'linear-gradient(135deg, #ffd700 0%, #f59e0b 100%)',
                color: '#05070e',
                border: 'none',
              }}
            >
              {loading ? <RefreshCw size={17} className="animate-spin" /> : <Search size={17} />}
              <span>{loading ? 'Inspecting...' : 'Audit Dossier'}</span>
            </button>
          </form>

          {/* Quick Select Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>Quick Audit:</span>
            <button
              type="button"
              onClick={() => inspectAddress(CONTRACT_ADDRESSES.ROOT_ID || '0x23cC13FF391bBcbF573467138d5DF4D9174B64Eb')}
              style={{
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: '0.74rem',
                fontWeight: 800,
                background: 'rgba(255, 215, 0, 0.12)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: '#ffd700',
                cursor: 'pointer',
              }}
            >
              👑 Genesis Root (#1)
            </button>

            {connectedAddress && (
              <button
                type="button"
                onClick={() => inspectAddress(connectedAddress)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  background: 'rgba(0, 229, 255, 0.12)',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                  color: '#00e5ff',
                  cursor: 'pointer',
                }}
              >
                💼 My Wallet
              </button>
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: 16,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: '0.86rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                maxWidth: 860,
                margin: '16px auto 0',
              }}
            >
              <AlertCircle size={18} /> {error}
            </div>
          )}
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div
            className="glass-card"
            style={{
              padding: 48,
              textAlign: 'center',
              borderRadius: 24,
              color: 'var(--purple-light)',
            }}
          >
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block', color: '#ffd700' }} />
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              Fetching On-Chain Member Dossier...
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 6 }}>
              Querying ElzoraGateway router, binary matrices, 8 income streams, and direct referrals from BSC Testnet
            </div>
          </div>
        )}

        {/* DOSSIER RESULT */}
        {!loading && dashboard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 1. PROFILE HEADER CARD (ACCOUNT & CORE PACKAGE DOSSIER) */}
            <div
              className="glass-card glass-card-glow"
              style={{
                padding: '24px 28px',
                borderRadius: 24,
                border: '1px solid rgba(255, 215, 0, 0.25)',
                background: 'linear-gradient(135deg, rgba(20, 16, 48, 0.95) 0%, rgba(11, 15, 36, 0.98) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                {/* Left: Identity & Badges */}
                <div style={{ flex: '1 1 500px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    {/* Rank Badge */}
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 900,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                      }}
                    >
                      <Crown size={15} color="#ffd700" />
                      Rank {dashboard.currentRank}: {dashboard.rankName}
                    </span>

                    {/* Registration Package Badge */}
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: 12,
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: dashboard.isRegistered ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: dashboard.isRegistered ? '#4ade80' : '#f87171',
                        border: `1px solid ${dashboard.isRegistered ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {dashboard.isRegistered ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {dashboard.isRegistered ? 'Core Registration ($50 Package) Active' : 'Unregistered / Awaiting Package'}
                    </span>

                    {/* 100% Instant Payout Pill */}
                    <span
                      style={{
                        padding: '5px 10px',
                        borderRadius: 12,
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        background: 'rgba(0, 229, 255, 0.1)',
                        color: '#00e5ff',
                        border: '1px solid rgba(0, 229, 255, 0.25)',
                      }}
                    >
                      ⚡ Instant Wallet Transfers
                    </span>
                  </div>

                  {/* Inspected Wallet Address */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#fff',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {dashboard.userAddress}
                    </h2>
                    <button
                      onClick={() => copyToClipboard(dashboard.userAddress)}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        color: copiedText === dashboard.userAddress ? '#00ff88' : 'var(--muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                      }}
                    >
                      {copiedText === dashboard.userAddress ? <Check size={14} /> : <Copy size={14} />}
                      {copiedText === dashboard.userAddress ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      href={`https://testnet.bscscan.com/address/${dashboard.userAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.76rem',
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={14} /> BscScan
                    </a>
                  </div>

                  {/* Lineage Info (Sponsor & Parent) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 14 }}>
                    {/* Sponsor Info */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Direct Sponsor (Referrer)</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                          {dashboard.sponsor !== '0x0000000000000000000000000000000000000000'
                            ? `${dashboard.sponsor.slice(0, 10)}...${dashboard.sponsor.slice(-6)}`
                            : '👑 Genesis Root (No Sponsor)'}
                        </span>
                        {dashboard.sponsor !== '0x0000000000000000000000000000000000000000' && (
                          <button
                            onClick={() => inspectAddress(dashboard.sponsor)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#38bdf8',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            Inspect →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Binary Parent Info */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Binary Matrix Placement Parent</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#a855f7', fontWeight: 700 }}>
                          {dashboard.binaryParent !== '0x0000000000000000000000000000000000000000'
                            ? `${dashboard.binaryParent.slice(0, 10)}...${dashboard.binaryParent.slice(-6)}`
                            : '👑 Origin Root (Top of Tree)'}
                        </span>
                        {dashboard.binaryParent !== '0x0000000000000000000000000000000000000000' && (
                          <button
                            onClick={() => inspectAddress(dashboard.binaryParent)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#a855f7',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            Inspect →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Total Earnings Highlight */}
                <div
                  style={{
                    background: 'rgba(0, 255, 136, 0.06)',
                    border: '1px solid rgba(0, 255, 136, 0.25)',
                    padding: '20px 24px',
                    borderRadius: 20,
                    textAlign: 'center',
                    minWidth: 240,
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Instant Total Earnings
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#00ff88', margin: '4px 0' }}>
                    ${Number(dashboard.totalIncomeEarned).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#00e5ff', fontWeight: 700 }}>
                    USDT (100% Transferred On-Chain)
                  </div>
                  <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--muted)' }}>
                    <span>Direct Referrals:</span>
                    <b style={{ color: '#fff' }}>{dashboard.directCount} Members</b>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ALL INCOME DETAILS (8-STREAM LEDGER) */}
            <div
              className="glass-card"
              style={{
                padding: '24px 28px',
                borderRadius: 22,
                border: '1px solid rgba(139, 92, 246, 0.25)',
                background: 'rgba(11, 15, 36, 0.88)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <DollarSign size={22} color="#00ff88" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
                    7+1 Income Streams Breakdown Ledger
                  </h3>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  Total Streams Sum: <b style={{ color: '#00ff88', fontSize: '0.95rem' }}>${computedIncomeSum.toFixed(2)} USDT</b>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {[
                  {
                    id: 1,
                    title: '1. Direct Income',
                    pct: '20% ($10)',
                    desc: 'Instant per direct referral',
                    amount: dashboard.incomeBreakdown.directIncome,
                    color: '#38bdf8',
                    icon: Zap,
                  },
                  {
                    id: 2,
                    title: '2. Affiliate / Level',
                    pct: '14% ($7)',
                    desc: '20 levels ($0.40 L1-10, $0.30 L11-20)',
                    amount: dashboard.incomeBreakdown.affiliateIncome,
                    color: '#60a5fa',
                    icon: Network,
                  },
                  {
                    id: 3,
                    title: '3. Club Rank Matrix',
                    pct: '24% ($12)',
                    desc: 'Cascading team progression',
                    amount: dashboard.incomeBreakdown.clubIncome,
                    color: '#c084fc',
                    icon: Layers,
                  },
                  {
                    id: 4,
                    title: '4. Binary Matching',
                    pct: '$2 / Pair',
                    desc: '2:1 / 1:2 first pair, then 1:1',
                    amount: dashboard.incomeBreakdown.matchingIncome,
                    color: '#4ade80',
                    icon: Split,
                  },
                  {
                    id: 5,
                    title: '5. Champion Club',
                    pct: '6% ($3/reg)',
                    desc: 'Monthly batched turnover pool',
                    amount: dashboard.incomeBreakdown.championIncome,
                    color: '#fbbf24',
                    icon: Crown,
                  },
                  {
                    id: 6,
                    title: '6. Weekly Performance',
                    pct: '6% ($3/reg)',
                    desc: 'Sunday-Saturday top sponsors',
                    amount: dashboard.incomeBreakdown.weeklyIncome,
                    color: '#f43f5e',
                    icon: Award,
                  },
                  {
                    id: 7,
                    title: '7. Lifetime Milestones',
                    pct: '10% ($5/reg)',
                    desc: '27 milestone achievement ranks',
                    amount: dashboard.incomeBreakdown.lifetimeIncome,
                    color: '#818cf8',
                    icon: TrendingUp,
                  },
                  {
                    id: 8,
                    title: '8. Single Leg / Global',
                    pct: '$25 / Cycle',
                    desc: '1-to-2 automated queue + re-entry',
                    amount: dashboard.incomeBreakdown.globalClubIncome,
                    color: '#06b6d4',
                    icon: RefreshCw,
                  },
                ].map((s) => {
                  const Icon = s.icon
                  return (
                    <div
                      key={s.id}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '16px 18px',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon size={14} color={s.color} /> {s.title}
                          </span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: s.color, fontWeight: 800 }}>
                            {s.pct}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 10px', fontSize: '0.74rem', color: 'var(--muted)' }}>
                          {s.desc}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Earned:</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: Number(s.amount) > 0 ? s.color : '#fff' }}>
                          ${Number(s.amount).toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>USDT</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 3. BINARY TEAM BALANCE & MATCHING STATUS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
              {/* Left Leg */}
              <div
                className="glass-card"
                style={{
                  padding: '22px 24px',
                  borderRadius: 20,
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(11, 15, 36, 0.95) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Split size={18} color="#38bdf8" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8' }}>LEFT LEG MATRIX</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Subtree Team</span>
                </div>

                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                  {dashboard.leftTeamCount} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Members</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>Direct Referrals</span>
                    <b style={{ fontSize: '1.1rem', color: '#fff' }}>{dashboard.leftDirectCount}</b>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>Carry Forward</span>
                    <b style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{dashboard.leftCarryVolume}</b>
                  </div>
                </div>
              </div>

              {/* Right Leg */}
              <div
                className="glass-card"
                style={{
                  padding: '22px 24px',
                  borderRadius: 20,
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                  background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05) 0%, rgba(11, 15, 36, 0.95) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Split size={18} style={{ transform: 'scaleX(-1)' }} color="#00e5ff" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#00e5ff' }}>RIGHT LEG MATRIX</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Subtree Team</span>
                </div>

                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: 8 }}>
                  {dashboard.rightTeamCount} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Members</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>Direct Referrals</span>
                    <b style={{ fontSize: '1.1rem', color: '#fff' }}>{dashboard.rightDirectCount}</b>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>Carry Forward</span>
                    <b style={{ fontSize: '1.1rem', color: '#00e5ff' }}>{dashboard.rightCarryVolume}</b>
                  </div>
                </div>
              </div>

              {/* Binary Matching Eligibility */}
              <div
                className="glass-card"
                style={{
                  padding: '22px 24px',
                  borderRadius: 20,
                  border: isBinaryMatchingQualified ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid rgba(251, 191, 36, 0.3)',
                  background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.95) 0%, rgba(11, 15, 36, 0.98) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={18} color={isBinaryMatchingQualified ? '#4ade80' : '#fbbf24'} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isBinaryMatchingQualified ? '#4ade80' : '#fbbf24' }}>
                      BINARY MATCHING STATUS
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>$2 / Matched Pair</span>
                </div>

                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: isBinaryMatchingQualified ? '#4ade80' : '#fbbf24', marginBottom: 8 }}>
                  {isBinaryMatchingQualified ? 'QUALIFIED (1:1 Active) ✅' : 'PENDING QUALIFICATION ⏳'}
                </div>

                <p style={{ margin: '0 0 12px', fontSize: '0.76rem', color: 'var(--muted)' }}>
                  Rule: Requires min 1 Left Direct & 1 Right Direct. First pair matched at 2:1 or 1:2, then 1:1 pair matching perpetually.
                </p>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--muted)' }}>
                  <span>Today Matched Pairs:</span>
                  <b style={{ color: '#fff' }}>{dashboard.todayMatchingPairs} / 50 Max Daily</b>
                </div>
              </div>
            </div>

            {/* 4. CHAMPION & WEEKLY CLUBS & SINGLE LEG STATUS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
              {/* Champion Club Card */}
              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: 22,
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(11, 15, 36, 0.95) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Crown size={22} color="#fbbf24" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 800 }}>
                        Champion Club (Monthly Pool)
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>6% Company Turnover Pool</span>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: dashboard.isChampionEligible ? 'rgba(0, 255, 136, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                      color: dashboard.isChampionEligible ? '#00ff88' : '#fbbf24',
                      border: `1px solid ${dashboard.isChampionEligible ? 'rgba(0, 255, 136, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                    }}
                  >
                    {dashboard.isChampionEligible ? 'Qualified (Active) ✅' : 'In Progress ⏳'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--muted)' }}>Direct Referrals Requirement:</span>
                    <b style={{ color: '#fff' }}>{dashboard.directCount} / 3 Directs</b>
                  </div>
                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, (dashboard.directCount / 3) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 12 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>Received Champion Income</span>
                    <b style={{ fontSize: '1.1rem', color: '#fbbf24' }}>${Number(dashboard.incomeBreakdown.championIncome).toFixed(2)} USDT</b>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 12 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>Pending Snapshot Reward</span>
                    <b style={{ fontSize: '1.1rem', color: '#00ff88' }}>${Number(dashboard.pendingChampionReward).toFixed(2)} USDT</b>
                  </div>
                </div>
              </div>

              {/* Weekly Performance Pool Card */}
              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: 22,
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(11, 15, 36, 0.95) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Flame size={22} color="#f43f5e" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 800 }}>
                        Weekly Performance Pool
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 700 }}>6% Weekly Epoch Pool (Week #{dashboard.currentWeeklyEpoch})</span>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: dashboard.isWeeklyEligibleCurrentEpoch ? 'rgba(0, 255, 136, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: dashboard.isWeeklyEligibleCurrentEpoch ? '#00ff88' : '#f43f5e',
                      border: `1px solid ${dashboard.isWeeklyEligibleCurrentEpoch ? 'rgba(0, 255, 136, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                    }}
                  >
                    {dashboard.isWeeklyEligibleCurrentEpoch ? 'Qualified This Week ✅' : 'In Progress ⏳'}
                  </span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--muted)' }}>Directs This Week (Sunday-Saturday):</span>
                    <b style={{ color: '#fff' }}>{dashboard.currentWeeklyDirects} / 3 Directs</b>
                  </div>
                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, (dashboard.currentWeeklyDirects / 3) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #f43f5e, #be123c)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 12 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>Received Weekly Income</span>
                    <b style={{ fontSize: '1.1rem', color: '#f43f5e' }}>${Number(dashboard.incomeBreakdown.weeklyIncome).toFixed(2)} USDT</b>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 12 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>Weekly Epoch Cycle</span>
                    <b style={{ fontSize: '1.1rem', color: '#fff' }}>Sunday 00:00 UTC</b>
                  </div>
                </div>
              </div>

              {/* Single Leg / Global Club ($25 Queue) Card */}
              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: 22,
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(11, 15, 36, 0.95) 100%)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <RefreshCw size={22} color="#06b6d4" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 800 }}>
                        Single Leg / Global Club ($25)
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 700 }}>Autonomous 1-to-2 Queue Matrix</span>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: dashboard.globalClubEntriesCount > 0 ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      color: dashboard.globalClubEntriesCount > 0 ? '#00ff88' : 'var(--muted)',
                      border: `1px solid ${dashboard.globalClubEntriesCount > 0 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
                    }}
                  >
                    {dashboard.globalClubEntriesCount > 0 ? 'Queue Active ✅' : 'Not Activated'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>Queue Positions</span>
                    <b style={{ fontSize: '1.3rem', color: '#06b6d4' }}>{dashboard.globalClubEntriesCount}</b>
                    <span style={{ fontSize: '0.68rem', color: 'var(--muted)', display: 'block', marginTop: 2 }}>Initial + Auto Re-entries</span>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>Completed Cycles</span>
                    <b style={{ fontSize: '1.3rem', color: '#00ff88' }}>{dashboard.globalClubCyclesCompleted}</b>
                    <span style={{ fontSize: '0.68rem', color: 'var(--muted)', display: 'block', marginTop: 2 }}>$25 payout each</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Global Club Income Earned:</span>
                  <b style={{ fontSize: '1.15rem', color: '#06b6d4' }}>${Number(dashboard.incomeBreakdown.globalClubIncome).toFixed(2)} USDT</b>
                </div>
              </div>
            </div>

            {/* 5. GENEALOGY TREE & DIRECT MEMBERS LINEAGE */}
            <div
              className="glass-card"
              style={{
                padding: '24px 28px',
                borderRadius: 24,
                border: '1px solid rgba(139, 92, 246, 0.25)',
                background: 'rgba(11, 15, 36, 0.9)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Network size={22} color="#c084fc" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
                    Genealogy Lineage Explorer
                  </h3>
                </div>

                {/* Sub-Tabs: Direct Referrals vs Binary Tree */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTreeTab('directs')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: activeTreeTab === 'directs' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                      color: activeTreeTab === 'directs' ? '#fff' : 'var(--muted)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Users size={14} /> Direct Sponsor Tree ({dashboard.directCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTreeTab('binary')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: activeTreeTab === 'binary' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                      color: activeTreeTab === 'binary' ? '#fff' : 'var(--muted)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Split size={14} /> Binary Tree Hierarchy
                  </button>
                </div>
              </div>

              {/* VIEW A: DIRECT REFERRALS SPONSOR LIST */}
              {activeTreeTab === 'directs' && (
                <div>
                  {directsDossiers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--muted)' }}>
                      <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>No Direct Referrals Yet</div>
                      <div style={{ fontSize: '0.78rem', marginTop: 4 }}>This account has not personally sponsored any members.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                      {directsDossiers.map((dir, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '16px 18px',
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.07)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 800 }}>DIRECT #{idx + 1}</span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: 8,
                                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                  color: '#fff',
                                  fontWeight: 800,
                                }}
                              >
                                {dir.rankName}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#fff', fontWeight: 700, marginBottom: 8, wordBreak: 'break-all' }}>
                              {dir.address}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.74rem', color: 'var(--muted)', marginBottom: 12 }}>
                              <div>
                                <span>Subtree Team:</span> <b style={{ color: '#fff' }}>{dir.teamVolume}</b>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span>Directs:</span> <b style={{ color: '#38bdf8' }}>{dir.directCount}</b>
                              </div>
                            </div>
                          </div>

                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block' }}>Earned:</span>
                              <b style={{ color: '#00ff88', fontSize: '0.9rem' }}>${Number(dir.totalEarned).toFixed(2)} USDT</b>
                            </div>
                            <button
                              onClick={() => inspectAddress(dir.address)}
                              style={{
                                background: 'rgba(0, 229, 255, 0.12)',
                                border: '1px solid rgba(0, 229, 255, 0.3)',
                                borderRadius: 10,
                                padding: '6px 12px',
                                color: '#00e5ff',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Eye size={13} /> Inspect Dossier
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW B: BINARY TREE PLACEMENT MINI-EXPLORER */}
              {activeTreeTab === 'binary' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '10px 0' }}>
                  {/* Top Node (Inspected Member) */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(11, 15, 36, 0.95) 100%)',
                      border: '2px solid #8b5cf6',
                      borderRadius: 18,
                      padding: '16px 24px',
                      textAlign: 'center',
                      maxWidth: 360,
                      width: '100%',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#ffd700', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <Crown size={13} /> INSPECTED APEX NODE
                    </span>
                    <div style={{ fontSize: '0.86rem', fontFamily: 'monospace', color: '#fff', fontWeight: 800, wordBreak: 'break-all' }}>
                      {dashboard.userAddress}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: '0.74rem', color: 'var(--muted)', marginTop: 8 }}>
                      <span>L: <b style={{ color: '#38bdf8' }}>{dashboard.leftTeamCount}</b></span>
                      <span>R: <b style={{ color: '#00e5ff' }}>{dashboard.rightTeamCount}</b></span>
                      <span>Earned: <b style={{ color: '#00ff88' }}>${Number(dashboard.totalIncomeEarned).toFixed(2)}</b></span>
                    </div>
                  </div>

                  {/* Branches Line */}
                  <div style={{ width: 2, height: 24, background: 'rgba(139, 92, 246, 0.5)' }} />

                  {/* Level 1: Left and Right Children */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, width: '100%', maxWidth: 760 }}>
                    {/* Left Child Node */}
                    <div
                      style={{
                        background: binaryChildrenDossiers.left
                          ? 'rgba(56, 189, 248, 0.08)'
                          : 'rgba(255,255,255,0.02)',
                        border: binaryChildrenDossiers.left
                          ? '1px solid rgba(56, 189, 248, 0.35)'
                          : '1px dashed rgba(255,255,255,0.15)',
                        borderRadius: 16,
                        padding: '16px 20px',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                        LEFT CHILD SLOT
                      </span>

                      {binaryChildrenDossiers.left ? (
                        <div>
                          <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#fff', fontWeight: 700, wordBreak: 'break-all', marginBottom: 6 }}>
                            {binaryChildrenDossiers.left.address}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 10 }}>
                            <span style={{ padding: '2px 6px', borderRadius: 6, background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', fontWeight: 700 }}>
                              {binaryChildrenDossiers.left.rankName}
                            </span>
                            <span>Team: {binaryChildrenDossiers.left.leftTeamCount + binaryChildrenDossiers.left.rightTeamCount}</span>
                          </div>
                          <button
                            onClick={() => inspectAddress(binaryChildrenDossiers.left.address)}
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid #38bdf8',
                              borderRadius: 8,
                              padding: '5px 12px',
                              color: '#38bdf8',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Drill Down Left →
                          </button>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem', padding: '10px 0' }}>
                          Empty Left Placement Slot
                        </div>
                      )}
                    </div>

                    {/* Right Child Node */}
                    <div
                      style={{
                        background: binaryChildrenDossiers.right
                          ? 'rgba(0, 229, 255, 0.08)'
                          : 'rgba(255,255,255,0.02)',
                        border: binaryChildrenDossiers.right
                          ? '1px solid rgba(0, 229, 255, 0.35)'
                          : '1px dashed rgba(255,255,255,0.15)',
                        borderRadius: 16,
                        padding: '16px 20px',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#00e5ff', fontWeight: 800, display: 'block', marginBottom: 4 }}>
                        RIGHT CHILD SLOT
                      </span>

                      {binaryChildrenDossiers.right ? (
                        <div>
                          <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#fff', fontWeight: 700, wordBreak: 'break-all', marginBottom: 6 }}>
                            {binaryChildrenDossiers.right.address}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 10 }}>
                            <span style={{ padding: '2px 6px', borderRadius: 6, background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', fontWeight: 700 }}>
                              {binaryChildrenDossiers.right.rankName}
                            </span>
                            <span>Team: {binaryChildrenDossiers.right.leftTeamCount + binaryChildrenDossiers.right.rightTeamCount}</span>
                          </div>
                          <button
                            onClick={() => inspectAddress(binaryChildrenDossiers.right.address)}
                            style={{
                              background: 'rgba(0, 229, 255, 0.15)',
                              border: '1px solid #00e5ff',
                              borderRadius: 8,
                              padding: '5px 12px',
                              color: '#00e5ff',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Drill Down Right →
                          </button>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem', padding: '10px 0' }}>
                          Empty Right Placement Slot
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. 8 CLUB RANKS PROGRESSION MATRIX */}
            <div
              className="glass-card"
              style={{
                padding: '24px 28px',
                borderRadius: 24,
                border: '1px solid rgba(255, 215, 0, 0.2)',
                background: 'rgba(11, 15, 36, 0.9)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Crown size={22} color="#ffd700" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
                    8-Rank Cascading Club Matrix Status
                  </h3>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  Current Rank: <b style={{ color: '#ffd700' }}>Rank #{dashboard.currentRank} ({dashboard.rankName})</b>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {RANK_CONFIGS.map((rc) => {
                  const isCurrent = dashboard.currentRank === rc.id
                  const isPassed = dashboard.currentRank > rc.id
                  const isLocked = dashboard.currentRank < rc.id

                  return (
                    <div
                      key={rc.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 16,
                        background: isCurrent
                          ? rc.bg
                          : isPassed
                          ? 'rgba(0, 255, 136, 0.04)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isCurrent
                          ? `2px solid ${rc.color}`
                          : isPassed
                          ? '1px solid rgba(0, 255, 136, 0.25)'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        position: 'relative',
                        boxShadow: isCurrent ? `0 0 20px ${rc.bg}` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: isCurrent ? rc.color : isPassed ? '#00ff88' : '#fff' }}>
                          Rank #{rc.id}: {rc.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: 8,
                            fontWeight: 800,
                            background: isCurrent ? rc.color : isPassed ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            color: isCurrent ? '#000' : isPassed ? '#00ff88' : 'var(--muted)',
                          }}
                        >
                          {isCurrent ? 'ACTIVE NOW' : isPassed ? 'COMPLETED ✅' : 'LOCKED 🔒'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginBottom: 8 }}>
                        Requirement: <b style={{ color: '#fff' }}>{rc.members} Personal Team Members</b>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Net Profit:</span>
                        <b style={{ color: isPassed || isCurrent ? '#00ff88' : 'var(--muted)', fontWeight: 800 }}>
                          ${rc.net.toLocaleString()} USDT
                        </b>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 7. LIFETIME MILESTONES SUMMARY */}
            <div
              className="glass-card"
              style={{
                padding: '20px 24px',
                borderRadius: 20,
                border: '1px solid rgba(129, 140, 248, 0.25)',
                background: 'rgba(11, 15, 36, 0.85)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrendingUp size={20} color="#818cf8" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 800 }}>
                      Lifetime Milestone Progression (27 Tiers)
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                      Achieved & Paid: <b style={{ color: '#818cf8' }}>{dashboard.completedLifetimeMilestones} / 27 Milestones</b>
                      {' • '}
                      Team Matching: <b style={{ color: '#38bdf8' }}>{dashboard.binarySummary?.leftTotalMembers || 0} Left : {dashboard.binarySummary?.rightTotalMembers || 0} Right</b>
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>Milestone Income Earned</span>
                  <b style={{ fontSize: '1.2rem', color: '#818cf8' }}>${Number(dashboard.incomeBreakdown.lifetimeIncome).toFixed(2)} USDT</b>
                </div>
              </div>

              {dashboard.completedLifetimeMilestones === 0 &&
                Number(dashboard.binarySummary?.leftTotalMembers || 0) >= 5 &&
                Number(dashboard.binarySummary?.rightTotalMembers || 0) >= 5 && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#34d399',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>
                      🎉 <b>Milestone #1 Qualified (5:5 Binary Matching Met)</b>: Paid Instantly ($25 USDT or Auto-funded Single Leg Queue Entry). Next Milestone #2 Target: 20 Left : 20 Right (cumulative: only 15 more needed per leg).
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserLookupPage
