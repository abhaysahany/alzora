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
} from 'lucide-react'

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

export function UserLookupPage() {
  const { id: urlParamId } = useParams()
  const [searchParams] = useSearchParams()
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
  const [copiedText, setCopiedText] = useState(null)

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

      try {
        const publicClient = createPublicClient({ chain: activeChain, transport: http(rpcUrl) })
        let cleanQuery = query.toString().trim()
        let targetAddr = null

        if (isAddress(cleanQuery)) {
          targetAddr = cleanQuery
        } else {
          // If query is connected address fallback
          if (connectedAddress && (cleanQuery.toLowerCase() === 'me' || cleanQuery === '1')) {
            targetAddr = connectedAddress
          } else {
            targetAddr = CONTRACT_ADDRESSES.ROOT_ID || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5'
          }
        }

        // Fetch user dashboard from Gateway router
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

        setDashboard({
          userAddress: targetAddr,
          sponsor: prof.sponsor,
          binaryParent: prof.binaryParent,
          leftChild: prof.leftChild,
          rightChild: prof.rightChild,
          currentRank: Number(prof.currentRank || 1),
          rankName: RANK_NAMES[Number(prof.currentRank || 1)] || 'Starter',
          directCount: Number(prof.directCount || 0n),
          leftDirectCount: Number(prof.leftDirectCount || 0n),
          rightDirectCount: Number(prof.rightDirectCount || 0n),
          leftTeamCount: Number(prof.leftTeamCount || 0n),
          rightTeamCount: Number(prof.rightTeamCount || 0n),
          leftCarryVolume: Number(prof.leftCarryVolume || 0n),
          rightCarryVolume: Number(prof.rightCarryVolume || 0n),
          hasMatchedFirstPair: Boolean(prof.hasMatchedFirstPair),
          isRegistered: Boolean(prof.isRegistered),
          totalIncomeEarned: formatUnits(prof.totalIncomeEarned || 0n, 6),
          withdrawableBalance: formatUnits(prof.withdrawableBalance || 0n, 6),
          totalWithdrawn: formatUnits(prof.totalWithdrawn || 0n, 6),
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
          directReferrals: rawDashboard.directReferrals || [],
          isChampionEligible: Boolean(rawDashboard.isChampionEligible),
          currentWeeklyDirects: Number(rawDashboard.currentWeeklyDirects || 0n),
          globalClubEntriesCount: Number(rawDashboard.globalClubEntriesCount || 0n),
        })
      } catch (err) {
        console.error(err)
        setError('Failed to query member dossier from ELZORA Gateway.')
      } finally {
        setLoading(false)
      }
    },
    [activeChain, connectedAddress, CONTRACT_ADDRESSES.GATEWAY, CONTRACT_ADDRESSES.ROOT_ID, rpcUrl]
  )

  useEffect(() => {
    if (initialSearch) {
      fetchMemberDossier(initialSearch)
    }
  }, [initialSearch, fetchMemberDossier])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchInput.trim()) {
      setError('Please enter a BSC Wallet Address (0x...)')
      return
    }
    fetchMemberDossier(searchInput)
  }

  return (
    <div className="login-container" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#060814' }}>
      <BackgroundCanvas />

      {/* Top Header */}
      <header className="nav" style={{ position: 'relative', zIndex: 100, borderBottom: '1px solid rgba(139, 92, 246, 0.15)', background: 'rgba(6, 8, 20, 0.85)' }}>
        <div className="wrap nav-inner">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/login')}>
            <span style={{ fontWeight: 900, fontSize: '1.4rem', background: 'linear-gradient(135deg, #e2e8f0, #c084fc 40%, #6366f1 80%, #38bdf8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', letterSpacing: '0.08em' }}>
              ELZORA
            </span>
          </div>
          <button onClick={() => navigate('/login')} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--purple-light)' }}>
            <ArrowLeft size={16} /> Back to Login
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1040, width: '100%', padding: 20, margin: '20px auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* SEARCH HEADER CARD */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: '28px 32px',
            borderRadius: 24,
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 21, 54, 0.9) 0%, rgba(11, 15, 36, 0.98) 100%)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 20, background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: 'var(--purple-light)', fontSize: '0.8rem', fontWeight: 800, marginBottom: 10 }}>
              <Sparkles size={14} /> ON-CHAIN DOSSIER & AUDIT INSPECTOR
            </div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
              ELZORA Member Lookup
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
              Search any member by <b>BSC Wallet Address (0x...)</b> to audit their binary lineage and income.
            </p>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setError(null)
                }}
                placeholder="Enter 0x... Wallet Address"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  border: error ? '1px solid #ef4444' : '1px solid rgba(139, 92, 246, 0.4)',
                  padding: '16px 44px 16px 16px',
                  borderRadius: 16,
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
              <Search size={20} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--purple-light)' }} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: '16px 28px',
                fontSize: '1rem',
                fontWeight: 900,
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
              <span>{loading ? 'Inspecting...' : 'Search Dossier'}</span>
            </button>
          </form>

          {error && (
            <div style={{ marginTop: 16, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', color: '#f87171', padding: 14, borderRadius: 14, fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', borderRadius: 24, color: 'var(--purple-light)' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Fetching On-Chain Member Dossier...</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>Reading profile, binary tree, and 7 streams from BSC Testnet</div>
          </div>
        )}

        {/* DOSSIER RESULT */}
        {!loading && dashboard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* PROFILE BANNER */}
            <div className="glass-card glass-card-glow" style={{ padding: 28, borderRadius: 24, background: 'rgba(11, 15, 36, 0.9)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ padding: '6px 14px', borderRadius: 14, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', fontSize: '0.9rem', fontWeight: 900 }}>
                      {dashboard.rankName}
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, background: dashboard.isRegistered ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.08)', color: dashboard.isRegistered ? '#4ade80' : 'var(--muted)', border: dashboard.isRegistered ? '1px solid #4ade80' : 'none' }}>
                      {dashboard.isRegistered ? '● REGISTERED ($50 PACKAGE)' : 'UNREGISTERED'}
                    </span>
                  </div>

                  <h2 style={{ margin: '8px 0 4px', fontSize: '1.35rem', fontWeight: 900, color: '#fff', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {dashboard.userAddress}
                  </h2>

                  <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>Sponsor:</span>
                    <b style={{ color: 'var(--purple-light)', fontFamily: 'monospace' }}>
                      {dashboard.sponsor !== '0x0000000000000000000000000000000000000000' ? dashboard.sponsor : 'Genesis Root'}
                    </b>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Total Earnings</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#4ade80' }}>
                    ${Number(dashboard.totalIncomeEarned).toFixed(2)} USDT
                  </div>
                </div>
              </div>
            </div>

            {/* BINARY LINEAGE METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              
              <div className="glass-card" style={{ padding: 22, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--purple-light)' }}>LEFT LEG</span>
                  <Split size={18} style={{ color: 'var(--purple-light)' }} />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>
                  {dashboard.leftTeamCount} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Members</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 8 }}>
                  <span>Directs: <b style={{ color: '#fff' }}>{dashboard.leftDirectCount}</b></span>
                  <span>Carry: <b style={{ color: 'var(--purple-light)' }}>{dashboard.leftCarryVolume}</b></span>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 22, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--cyan)' }}>RIGHT LEG</span>
                  <Split size={18} style={{ transform: 'scaleX(-1)', color: 'var(--cyan)' }} />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>
                  {dashboard.rightTeamCount} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Members</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 8 }}>
                  <span>Directs: <b style={{ color: '#fff' }}>{dashboard.rightDirectCount}</b></span>
                  <span>Carry: <b style={{ color: 'var(--cyan)' }}>{dashboard.rightCarryVolume}</b></span>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 22, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#facc15' }}>BINARY MATCHING QUALIFICATION</span>
                  <Award size={18} style={{ color: '#facc15' }} />
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: (dashboard.leftDirectCount >= 1 && dashboard.rightDirectCount >= 1) ? '#4ade80' : '#facc15' }}>
                  {(dashboard.leftDirectCount >= 1 && dashboard.rightDirectCount >= 1) ? 'QUALIFIED (1:1 Active) ✅' : 'PENDING ⏳'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 8 }}>
                  Condition: <b style={{ color: '#fff' }}>Min 1 Left & 1 Right Direct</b>
                </div>
              </div>

            </div>

            {/* 7 STREAMS INCOME BREAKDOWN */}
            <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>
                7 Financial Streams Breakdown
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {[
                  { label: 'Direct Commission (20%)', amount: dashboard.incomeBreakdown.directIncome, color: '#c084fc' },
                  { label: '20-Level Affiliate (14%)', amount: dashboard.incomeBreakdown.affiliateIncome, color: '#38bdf8' },
                  { label: 'Club Matrix (24%)', amount: dashboard.incomeBreakdown.clubIncome, color: '#a855f7' },
                  { label: 'Binary Matching (20%)', amount: dashboard.incomeBreakdown.matchingIncome, color: '#4ade80' },
                  { label: 'Champion Club (6%)', amount: dashboard.incomeBreakdown.championIncome, color: '#fbbf24' },
                  { label: 'Weekly Rewards (6%)', amount: dashboard.incomeBreakdown.weeklyIncome, color: '#f43f5e' },
                  { label: 'Lifetime Milestones (10%)', amount: dashboard.incomeBreakdown.lifetimeIncome, color: '#818cf8' },
                  { label: 'Single Leg / Global Club ($25)', amount: dashboard.incomeBreakdown.globalClubIncome, color: '#06b6d4' },
                ].map((s, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>{s.label}</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: Number(s.amount) > 0 ? s.color : '#fff' }}>
                      ${Number(s.amount).toFixed(2)} USDT
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default UserLookupPage
