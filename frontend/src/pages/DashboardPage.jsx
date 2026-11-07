import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MemberLayout } from '../components/MemberLayout'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  TrendingUp,
  Zap,
  RefreshCw,
  Globe,
  Users,
  ShieldCheck,
  Award,
  DollarSign,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Share2,
  ArrowRight,
  Wallet,
  Coins,
  GitCommit,
  Check,
  Copy,
  Clock,
  Layers,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react'

export function DashboardPage() {
  const {
    address,
    profile,
    incomeBreakdown,
    overview,
    champion,
    weekly,
    matching,
    globalClub,
    usdtBalance,
    loading,
    error,
    withdrawIncome,
    claimChampionReward,
    refreshAll,
  } = useTetherStream()

  const [copiedLeg, setCopiedLeg] = useState(null)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [txSuccessMsg, setTxSuccessMsg] = useState('')

  const handleWithdraw = async () => {
    setTxSuccessMsg('')
    try {
      await withdrawIncome()
      setTxSuccessMsg('Withdrawal successful! USDT transferred directly to your wallet.')
      setTimeout(() => setTxSuccessMsg(''), 5000)
    } catch (err) {
      console.error(err)
    }
  }

  const copyRefLink = (leg) => {
    const origin = window.location.origin
    const link = `${origin}/register?ref=${address}&pos=${leg}`
    navigator.clipboard.writeText(link)
    setCopiedLeg(leg)
    setTimeout(() => setCopiedLeg(null), 2500)
  }

  const copyAddr = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const withdrawableVal = parseFloat(profile?.withdrawableBalance || '0')
  const totalEarnedVal = parseFloat(profile?.totalIncomeEarned || '0')
  const totalWithdrawnVal = parseFloat(profile?.totalWithdrawn || '0')
  const leftTeamCount = Number(profile?.leftTeamCount || 0)
  const rightTeamCount = Number(profile?.rightTeamCount || 0)
  const totalTeam = leftTeamCount + rightTeamCount
  const leftRatio = totalTeam > 0 ? Math.round((leftTeamCount / totalTeam) * 100) : 50
  const rightRatio = totalTeam > 0 ? 100 - leftRatio : 50

  return (
    <MemberLayout pageTitle="ELZORA Dashboard">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* TOP HERO BANNER */}
        <div
          style={{
            padding: '28px 32px',
            borderRadius: 24,
            border: '1px solid rgba(139, 92, 246, 0.4)',
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.95) 0%, rgba(10, 14, 38, 0.98) 100%)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15)',
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, position: 'relative', zIndex: 1 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 20,
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#c084fc',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> ELZORA DECENTRALIZED MEMBER
              </div>
              <h1 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Account & Binary Matrix Overview
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Wallet:</span>
                <span
                  onClick={copyAddr}
                  title="Click to copy full address"
                  style={{
                    color: '#818cf8',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    background: 'rgba(15, 23, 42, 0.7)',
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '0x...'}
                  {copiedAddress ? <Check size={13} color="#22c55e" /> : <Copy size={13} color="#94a3b8" />}
                </span>

                {profile?.sponsor && profile.sponsor !== '0x0000000000000000000000000000000000000000' && (
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    • Sponsor: <b style={{ color: '#c084fc', fontFamily: 'monospace' }}>{profile.sponsor.slice(0, 6)}...{profile.sponsor.slice(-4)}</b>
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div
                style={{
                  padding: '10px 18px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(217, 70, 239, 0.2))',
                  border: '1px solid rgba(168, 85, 247, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 8px 20px rgba(139, 92, 246, 0.2)',
                }}
              >
                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(168, 85, 247, 0.3)' }}>
                  <Award size={22} color="#c084fc" />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.06em' }}>CURRENT RANK</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>{profile?.rankName || 'Starter'}</div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(6, 8, 20, 0.8)',
                  padding: '10px 18px',
                  borderRadius: 16,
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', fontWeight: 700, letterSpacing: '0.06em' }}>USDT BALANCE</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>${Number(usdtBalance).toFixed(2)} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>USDT</span></span>
              </div>

              <button
                onClick={refreshAll}
                style={{
                  padding: '14px',
                  borderRadius: 16,
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#c084fc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                title="Refresh All On-Chain Data"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {txSuccessMsg && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: 16,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)',
            }}
          >
            <CheckCircle2 size={20} color="#22c55e" />
            <span>{txSuccessMsg}</span>
          </div>
        )}

        {/* 3 TOP CARDS: TOTAL EARNED, WITHDRAWABLE BALANCE, BINARY SUMMARY */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          
          {/* Card 1: Instant Direct Earnings */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: 22,
              padding: 26,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c084fc', letterSpacing: '0.06em' }}>
                  INSTANT TOTAL EARNINGS
                </span>
                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(192, 132, 252, 0.15)' }}>
                  <Wallet size={20} color="#c084fc" />
                </div>
              </div>

              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#4ade80', marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                ${totalEarnedVal.toFixed(2)}
                <span style={{ fontSize: '1rem', color: '#c084fc', fontWeight: 700 }}>USDT</span>
              </div>

              <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(74, 222, 128, 0.25)', marginTop: 14 }}>
                <span style={{ fontSize: '0.76rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> 100% INSTANT WALLET TRANSFERS ACTIVE
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: 4 }}>
                  All commissions are transferred directly to your connected BSC wallet without manual withdrawal.
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: 22,
                width: '100%',
                padding: '14px 20px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Single Leg Active Entries:</span>
              <b style={{ color: '#38bdf8', fontSize: '1.05rem' }}>{globalClub.entriesCount}</b>
            </div>
          </div>

          {/* Card 2: Binary Placement Team Stats */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: 22,
              padding: 26,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.06em' }}>
                  BINARY TEAM BALANCE
                </span>
                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)' }}>
                  <GitCommit size={20} color="#818cf8" />
                </div>
              </div>

              {/* Left vs Right Comparison Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {/* Left Side */}
                <div style={{ background: 'rgba(6, 8, 20, 0.8)', padding: 14, borderRadius: 14, border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.05em' }}>LEFT LEG</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0' }}>{leftTeamCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Directs: <strong style={{ color: '#cbd5e1' }}>{profile?.leftDirectCount || 0}</strong> • Carry: <strong style={{ color: '#38bdf8' }}>{profile?.leftCarryVolume || 0}</strong>
                  </div>
                </div>

                {/* Right Side */}
                <div style={{ background: 'rgba(6, 8, 20, 0.8)', padding: 14, borderRadius: 14, border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#c084fc', letterSpacing: '0.05em' }}>RIGHT LEG</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0' }}>{rightTeamCount}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Directs: <strong style={{ color: '#cbd5e1' }}>{profile?.rightDirectCount || 0}</strong> • Carry: <strong style={{ color: '#38bdf8' }}>{profile?.rightCarryVolume || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Visual Balance Ratio Bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>
                  <span>Left: {leftRatio}%</span>
                  <span>Right: {rightRatio}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${leftRatio}%`, background: '#6366f1', transition: 'width 0.3s' }} />
                  <div style={{ width: `${rightRatio}%`, background: '#c084fc', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', padding: '10px 14px', borderRadius: 12, background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>First Pair (2:1 / 1:2):</span>
              <span style={{ fontWeight: 800, color: profile?.hasMatchedFirstPair ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                {profile?.hasMatchedFirstPair ? 'QUALIFIED ✅' : 'PENDING ⏳'}
              </span>
            </div>
          </div>

          {/* Card 3: Global Club ($25 Re-entry System) */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
              border: '1px solid rgba(217, 70, 239, 0.35)',
              borderRadius: 22,
              padding: 26,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ec4899', letterSpacing: '0.06em' }}>
                  GLOBAL CLUB ($25 RE-ENTRY)
                </span>
                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(236, 72, 153, 0.15)' }}>
                  <RefreshCw size={20} color="#ec4899" />
                </div>
              </div>

              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                {globalClub.cyclesCompleted} <span style={{ fontSize: '1rem', color: '#f472b6', fontWeight: 700 }}>Cycles Completed</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6, margin: '8px 0 14px' }}>
                1-to-2 automated queue: 2 users enter below you → earn $25 cycle reward + 1 automatic re-entry position!
              </p>

              <div style={{ background: 'rgba(6, 8, 20, 0.8)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(236, 72, 153, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Your Active Queue Positions:</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f472b6' }}>{globalClub.entriesCount}</span>
              </div>
            </div>

            <Link
              to="/packages"
              style={{
                marginTop: 22,
                padding: '14px 20px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(168, 85, 247, 0.25))',
                border: '1px solid rgba(236, 72, 153, 0.45)',
                color: '#f8fafc',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.94rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 20px rgba(236, 72, 153, 0.2)',
                transition: 'all 0.2s',
              }}
            >
              <span>Manage Global Club Entries</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* 7 INCOME STREAMS BREAKDOWN GRID */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                7 Comprehensive Income Streams
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Automated smart contract distribution from every $50 registration and team expansion
              </p>
            </div>
            <Link
              to="/earnings"
              style={{
                fontSize: '0.85rem',
                color: '#c084fc',
                textDecoration: 'none',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <span>View Detailed Ledger</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            
            {/* Stream 1: Direct Income */}
            <div style={{ background: 'rgba(13, 18, 45, 0.75)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>1. DIRECT INCOME (20%)</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px' }}>
                ${Number(incomeBreakdown?.directIncome || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>$10 USDT per direct referral ({profile?.directCount || 0} directs)</div>
            </div>

            {/* Stream 2: Affiliate 20 Levels */}
            <div style={{ background: 'rgba(13, 18, 45, 0.75)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>2. AFFILIATE 20-LEVELS</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px' }}>
                ${Number(incomeBreakdown?.affiliateIncome || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>20 Upline levels ($0.40 L1-10, $0.30 L11-20)</div>
            </div>

            {/* Stream 3: Club Rank Matrix */}
            <div style={{ background: 'rgba(13, 18, 45, 0.75)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>3. CLUB MATRIX (24%)</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px' }}>
                ${Number(incomeBreakdown?.clubIncome || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 600 }}>8 Cascading Ranks (Starter → Legend)</div>
            </div>

            {/* Stream 4: Binary Matching */}
            <div style={{ background: 'rgba(13, 18, 45, 0.75)', border: '1px solid rgba(74, 222, 128, 0.25)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>4. BINARY MATCHING (20%)</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px' }}>
                ${Number(incomeBreakdown?.matchingIncome || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 600 }}>$2 per matched pair (Today: {matching.todayPairs} pairs)</div>
            </div>

            {/* Stream 5: Champion Club */}
            <div style={{ background: 'rgba(13, 18, 45, 0.75)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>5. CHAMPION CLUB (6%)</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px' }}>
                ${Number(incomeBreakdown?.championIncome || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: champion.isEligible ? '#10b981' : '#fbbf24', fontWeight: 600 }}>
                {champion.isEligible ? 'Eligible Champion Member ✅' : `${profile?.directCount || 0}/30 Directs to Qualify`}
              </div>
            </div>

            {/* Stream 6: Weekly Rewards */}
            <div style={{ background: 'rgba(13, 18, 45, 0.75)', border: '1px solid rgba(236, 72, 153, 0.25)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>6. WEEKLY REWARDS (6%)</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px' }}>
                ${Number(incomeBreakdown?.weeklyIncome || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: weekly.isEligible ? '#10b981' : '#f472b6', fontWeight: 600 }}>
                {weekly.currentDirects}/3 Directs this week (Sun–Sat)
              </div>
            </div>

            {/* Stream 7: Lifetime Rewards */}
            <div style={{ background: 'rgba(13, 18, 45, 0.75)', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>7. LIFETIME MILESTONES (10%)</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px' }}>
                ${Number(incomeBreakdown?.lifetimeIncome || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fb923c', fontWeight: 600 }}>
                {profile?.completedLifetimeMilestones || 0}/27 Milestones Claimed
              </div>
            </div>

            {/* Stream 8: Single Leg Income */}
            <div style={{ background: 'rgba(13, 18, 45, 0.75)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>8. SINGLE LEG / GLOBAL ($25)</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px' }}>
                ${Number(incomeBreakdown?.globalClubIncome || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#06b6d4', fontWeight: 600 }}>
                {globalClub.cyclesCompleted} Cycles Completed ($25/cycle)
              </div>
            </div>

          </div>
        </div>

        {/* DUAL REFERRAL LINK BOX (LEFT / RIGHT PLACEMENT) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: 22,
            padding: 26,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(168, 85, 247, 0.2)' }}>
              <Share2 size={20} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                Binary Placement Referral Links
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '2px 0 0' }}>
                Direct new members to join specifically on your Left or Right leg to balance your binary matrix:
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 18 }}>
            {/* Left Referral Link */}
            <div style={{ background: 'rgba(6, 8, 20, 0.85)', padding: 16, borderRadius: 16, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.05em' }}>LEFT LEG LINK (POS = 1)</span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Places in Left sub-tree</span>
              </div>
              <div style={{ display: 'flex', gap: 8, background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/register?ref=${address}&pos=1`}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => copyRefLink(1)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: copiedLeg === 1 ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {copiedLeg === 1 ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLeg === 1 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Right Referral Link */}
            <div style={{ background: 'rgba(6, 8, 20, 0.85)', padding: 16, borderRadius: 16, border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c084fc', letterSpacing: '0.05em' }}>RIGHT LEG LINK (POS = 2)</span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Places in Right sub-tree</span>
              </div>
              <div style={{ display: 'flex', gap: 8, background: 'rgba(15, 23, 42, 0.6)', padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/register?ref=${address}&pos=2`}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => copyRefLink(2)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: copiedLeg === 2 ? '#10b981' : 'linear-gradient(135deg, #a855f7, #d946ef)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {copiedLeg === 2 ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLeg === 2 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </MemberLayout>
  )
}

export default DashboardPage
