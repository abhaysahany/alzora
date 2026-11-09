import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MemberLayout } from '../components/MemberLayout'
import { useTetherStream } from '../hooks/useTetherStream'
import { useWalletAuth } from '../hooks/useWalletAuth'
import {
  TrendingUp,
  Users,
  Award,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Globe,
  Wallet,
  Clock,
  RefreshCw,
  ArrowRight,
  Coins,
} from 'lucide-react'

export function IncomeHistoryPage() {
  const { address } = useWalletAuth()
  const { profile, incomeBreakdown, globalClub, refreshAll, loading } = useTetherStream()

  const [activeTab, setActiveTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Construct ledger of ELZORA 8 income streams
  const streams = [
    {
      id: 'SINGLE_LEG',
      category: 'GLOBAL_CLUB',
      title: 'Single Leg / Global Club ($25 Queue)',
      amountUsd: Number(incomeBreakdown?.globalClubIncome || 0),
      desc: '1-to-2 automated decentralized queue ($25 cycle payout + 1 auto re-entry position)',
      details: `${globalClub?.cyclesCompleted || 0} Cycles Completed • ${globalClub?.entriesCount || 0} Active Queue Positions`,
      color: '#06b6d4',
      tag: '1-to-2 Re-entry Queue',
      status: 'Instant Transfer to BSC Wallet',
      link: '/packages',
      linkText: 'Manage Single Leg Queue',
    },
    {
      id: 'DIRECT',
      category: 'DIRECT',
      title: 'Direct Referral Commission',
      amountUsd: Number(incomeBreakdown?.directIncome || 0),
      desc: '$10.00 (20%) per directly sponsored member',
      details: `${profile?.directCount || 0} Direct Members Sponsored ($10.00 each)`,
      color: '#c084fc',
      tag: '20% Direct',
      status: 'Instant Transfer to BSC Wallet',
      link: '/referrals',
      linkText: 'View Referral Hub',
    },
    {
      id: 'AFFILIATE',
      category: 'AFFILIATE',
      title: '20-Level Affiliate Income',
      amountUsd: Number(incomeBreakdown?.affiliateIncome || 0),
      desc: '$0.40 (L1-10) & $0.30 (L11-20) network upline stream',
      details: '20 Upline & Downline Tiers Active',
      color: '#38bdf8',
      tag: '14% 20-Levels',
      status: 'Instant Transfer to BSC Wallet',
      link: '/team',
      linkText: 'View 20 Levels',
    },
    {
      id: 'CLUB',
      category: 'CLUB',
      title: '8 Cascading Club Matrices',
      amountUsd: Number(incomeBreakdown?.clubIncome || 0),
      desc: 'Automatic personal downline queue payouts (Starter → Legend)',
      details: `Current Rank: ${profile?.rankName || 'Starter'} (Club ${profile?.currentRank || 1}/8)`,
      color: '#a855f7',
      tag: '24% Club Matrices',
      status: 'Instant Transfer to BSC Wallet',
      link: '/ranks',
      linkText: 'View 8 Club Matrices',
    },
    {
      id: 'MATCHING',
      category: 'MATCHING',
      title: 'Binary Matching Pool',
      amountUsd: Number(incomeBreakdown?.matchingIncome || 0),
      desc: '$2.00 per 1:1 pair (Qualified with 1 Left & 1 Right direct)',
      details: `Status: ${(profile?.leftDirectCount || 0) >= 1 && (profile?.rightDirectCount || 0) >= 1 ? '1:1 Qualified ✅' : 'Pending Directs ⏳'} • ${profile?.leftCarryVolume || 0} Left / ${profile?.rightCarryVolume || 0} Right Carry`,
      color: '#4ade80',
      tag: '20% Matching',
      status: 'Instant Transfer to BSC Wallet',
      link: '/team',
      linkText: 'View Binary Balance',
    },
    {
      id: 'CHAMPION',
      category: 'CHAMPION',
      title: 'Champion Club Royalty Pool',
      amountUsd: Number(incomeBreakdown?.championIncome || 0),
      desc: '6% monthly pool distributed by Admin in batches to qualifiers',
      details: `${profile?.directCount || 0} Directs achieved (Requirement: 3 directs for testing)`,
      color: '#fbbf24',
      tag: '6% Monthly Turnover',
      status: 'Batched Direct to BSC Wallet',
      link: '/ranks',
      linkText: 'View Champion Status',
    },
    {
      id: 'WEEKLY',
      category: 'WEEKLY',
      title: 'Weekly Performance Pool',
      amountUsd: Number(incomeBreakdown?.weeklyIncome || 0),
      desc: '6% weekly pool distributed every Sunday morning to qualifiers',
      details: 'Evaluated each weekly cycle based on new direct sponsorships',
      color: '#ec4899',
      tag: '6% Weekly Pool',
      status: 'Batched Direct to BSC Wallet',
      link: '/dashboard',
      linkText: 'View Weekly Cycle',
    },
    {
      id: 'LIFETIME',
      category: 'LIFETIME',
      title: '27 Lifetime Milestone Rewards',
      amountUsd: Number(incomeBreakdown?.lifetimeIncome || 0),
      desc: 'Cumulative balanced volume milestones from $25 up to $21,000,000',
      details: `${profile?.completedLifetimeMilestones || 0} of 27 Milestones Claimed`,
      color: '#f97316',
      tag: '10% Lifetime Pool',
      status: 'Instant Transfer to BSC Wallet',
      link: '/earnings',
      linkText: 'View 27 Milestones',
    },
  ]

  const totalCalculated = streams.reduce((sum, item) => sum + item.amountUsd, 0)
  const totalEarnedVal = Number(profile?.totalIncomeEarned || totalCalculated)

  const filteredLogs = streams.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === 'SINGLE_LEG') return matchesSearch && log.category === 'GLOBAL_CLUB'
    if (activeTab === 'DIRECT') return matchesSearch && log.category === 'DIRECT'
    if (activeTab === 'AFFILIATE') return matchesSearch && log.category === 'AFFILIATE'
    if (activeTab === 'MATCHING') return matchesSearch && log.category === 'MATCHING'
    if (activeTab === 'CLUB') return matchesSearch && log.category === 'CLUB'
    if (activeTab === 'ROYALTY') return matchesSearch && (log.category === 'CHAMPION' || log.category === 'WEEKLY' || log.category === 'LIFETIME')
    return matchesSearch
  })

  return (
    <MemberLayout pageTitle="Income Streams Ledger">
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* HERO BANNER */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 20,
            border: '1px solid rgba(139, 92, 246, 0.4)',
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.95) 0%, rgba(10, 14, 38, 0.98) 100%)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45), 0 0 24px rgba(139, 92, 246, 0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glowing ambient orb */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#c084fc',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                <Sparkles size={13} /> ON-CHAIN 8-STREAM FINANCIAL LEDGER
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Income Streams Ledger
              </h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.82rem', maxWidth: 640 }}>
                Real-time tracking of Direct, 20-Level Affiliate, Club Matrix, Binary Matching, Champion, Weekly, Lifetime, and Single Leg rewards.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div
                style={{
                  background: 'rgba(6, 8, 20, 0.8)',
                  padding: '10px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', fontWeight: 700, letterSpacing: '0.04em' }}>
                  TOTAL LIFETIME EARNED
                </span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#4ade80' }}>
                  ${totalEarnedVal.toFixed(2)} <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>USDT</span>
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(74, 222, 128, 0.1)',
                  padding: '10px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <ShieldCheck size={22} color="#4ade80" />
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#4ade80', display: 'block', fontWeight: 800 }}>TRANSFER STATUS</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#f8fafc' }}>
                    100% Instant To Wallet
                  </span>
                </div>
              </div>

              <button
                onClick={refreshAll}
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: 14,
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#c084fc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Refresh Ledger Data"
              >
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* METRICS ROW CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          <div style={{ background: 'rgba(16, 23, 60, 0.85)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: 18, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#06b6d4' }}>SINGLE LEG / GLOBAL ($25)</span>
              <RefreshCw size={16} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#06b6d4' }}>
              ${Number(incomeBreakdown?.globalClubIncome || 0).toFixed(2)}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {globalClub?.cyclesCompleted || 0} Cycles • {globalClub?.entriesCount || 0} Positions
            </span>
          </div>

          <div style={{ background: 'rgba(16, 23, 60, 0.85)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 18, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#c084fc' }}>DIRECT & AFFILIATE</span>
              <Coins size={16} color="#c084fc" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc' }}>
              ${(Number(incomeBreakdown?.directIncome || 0) + Number(incomeBreakdown?.affiliateIncome || 0)).toFixed(2)}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Direct ($10) + 20 Levels Network</span>
          </div>

          <div style={{ background: 'rgba(16, 23, 60, 0.85)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: 18, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4ade80' }}>BINARY MATCHING</span>
              <TrendingUp size={16} color="#4ade80" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#4ade80' }}>
              ${Number(incomeBreakdown?.matchingIncome || 0).toFixed(2)}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>$2.00 per 1:1 balanced pair</span>
          </div>

          <div style={{ background: 'rgba(16, 23, 60, 0.85)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 18, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a855f7' }}>8 CLUB MATRICES</span>
              <Layers size={16} color="#a855f7" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc' }}>
              ${Number(incomeBreakdown?.clubIncome || 0).toFixed(2)}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Starter → Legend personal team</span>
          </div>

          <div style={{ background: 'rgba(16, 23, 60, 0.85)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 18, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24' }}>ROYALTY & LIFETIME</span>
              <Award size={16} color="#fbbf24" />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fbbf24' }}>
              ${(Number(incomeBreakdown?.championIncome || 0) + Number(incomeBreakdown?.weeklyIncome || 0) + Number(incomeBreakdown?.lifetimeIncome || 0)).toFixed(2)}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Champion + Weekly + 27 Milestones</span>
          </div>
        </div>

        {/* DEDICATED SINGLE LEG PERFORMANCE CARD */}
        {(activeTab === 'ALL' || activeTab === 'SINGLE_LEG') && (
          <div
            style={{
              padding: '18px 20px',
              borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(11, 15, 36, 0.95) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: '#06b6d4',
                  }}
                >
                  <RefreshCw size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                      Single Leg / Global Club ($25 Queue) Details
                    </h3>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#06b6d4',
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        padding: '2px 8px',
                        borderRadius: 8,
                      }}
                    >
                      1-to-2 Auto Re-entry
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Decentralized single-line queue: 2 entries behind you triggers $25 instant USDT payout + 1 automatic re-entry spot
                  </span>
                </div>
              </div>

              <Link
                to="/packages"
                className="btn btn-outline btn-sm"
                style={{
                  borderColor: '#06b6d4',
                  color: '#06b6d4',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                }}
              >
                <span>Manage / Buy Positions</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
              <div style={{ background: 'rgba(6, 8, 20, 0.65)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>TOTAL SINGLE LEG INCOME</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#06b6d4' }}>
                  ${Number(incomeBreakdown?.globalClubIncome || 0).toFixed(2)} <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>USDT</span>
                </span>
              </div>

              <div style={{ background: 'rgba(6, 8, 20, 0.65)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>COMPLETED CYCLES</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#4ade80' }}>
                  {globalClub?.cyclesCompleted || 0} Cycles
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>$25 earned per cycle</span>
              </div>

              <div style={{ background: 'rgba(6, 8, 20, 0.65)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(192, 132, 252, 0.2)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>ACTIVE QUEUE POSITIONS</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#c084fc' }}>
                  {globalClub?.entriesCount || 0} Positions
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Cycling sequentially</span>
              </div>

              <div style={{ background: 'rgba(6, 8, 20, 0.65)', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>TRANSFER DESTINATION</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <CheckCircle2 size={15} color="#4ade80" /> Direct to BSC Wallet
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Zero withdrawal wait</span>
              </div>
            </div>
          </div>
        )}

        {/* FILTERS & SEARCH ROW */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            background: 'rgba(11, 15, 36, 0.85)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Streams (8)' },
              { id: 'SINGLE_LEG', label: 'Single Leg ($25)' },
              { id: 'DIRECT', label: 'Direct (20%)' },
              { id: 'AFFILIATE', label: '20-Level Affiliate' },
              { id: 'MATCHING', label: 'Binary Matching' },
              { id: 'CLUB', label: '8 Club Matrices' },
              { id: 'ROYALTY', label: 'Royalty & Milestones' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === tab.id ? '#fff' : '#94a3b8',
                  border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 260 }}>
            <input
              type="text"
              placeholder="Search income stream..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(6, 8, 20, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '7px 34px 7px 12px',
                borderRadius: 10,
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
            <Search size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={18} color="#c084fc" />
              <span>Income Streams Breakdown ({filteredLogs.length})</span>
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              All payouts execute directly on BNB Smart Chain via SafeERC20
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.25)', color: '#94a3b8', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '10px 14px' }}>INCOME STREAM & LIVE DETAILS</th>
                  <th style={{ padding: '10px 14px' }}>DISTRIBUTION ALLOCATION</th>
                  <th style={{ padding: '10px 14px' }}>TOTAL ACCRUED</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>TRANSFER STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                    }}
                  >
                    {/* Stream Name & Details */}
                    <td style={{ padding: '14px', fontWeight: 800, color: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: log.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{log.title}</span>
                            {log.link && (
                              <Link
                                to={log.link}
                                style={{
                                  fontSize: '0.7rem',
                                  color: log.color,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  opacity: 0.85,
                                }}
                              >
                                <span>{log.linkText}</span>
                                <ArrowUpRight size={11} />
                              </Link>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: log.color,
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1px 6px',
                                borderRadius: 6,
                              }}
                            >
                              {log.tag}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                              • {log.details}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Distribution Formula */}
                    <td style={{ padding: '14px', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {log.desc}
                    </td>

                    {/* Total Earned */}
                    <td style={{ padding: '14px', fontWeight: 900, color: log.amountUsd > 0 ? '#4ade80' : '#cbd5e1', fontSize: '1.05rem' }}>
                      ${log.amountUsd.toFixed(2)} <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>USDT</span>
                    </td>

                    {/* Transfer Status */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 16,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: 'rgba(74, 222, 128, 0.1)',
                          color: '#4ade80',
                          border: '1px solid rgba(74, 222, 128, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={13} color="#4ade80" />
                        <span>{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MemberLayout>
  )
}

export default IncomeHistoryPage
