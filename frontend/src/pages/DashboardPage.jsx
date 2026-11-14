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
    milestoneStatus,
    claimLifetimeMilestone,
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

  const leftTeam = Number(profile?.leftTeamCount || 0)
  const rightTeam = Number(profile?.rightTeamCount || 0)
  const completedMilestones = Number(profile?.completedLifetimeMilestones || 0)

  // Find first claimable milestone that hasn't already been completed
  const claimableMilestoneIdx = Array.isArray(milestoneStatus)
    ? milestoneStatus.findIndex((status, idx) => status === 1 && idx >= completedMilestones)
    : -1

  const handleClaimMilestone = async (idx) => {
    setTxSuccessMsg('')
    try {
      await claimLifetimeMilestone(idx)
      setTxSuccessMsg(`🎉 Lifetime Milestone #${idx + 1} Reward Claimed Successfully!`)
      setTimeout(() => setTxSuccessMsg(''), 6000)
    } catch (err) {
      console.error(err)
    }
  }

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
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* TOP HERO BANNER */}
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
        {claimableMilestoneIdx >= 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(16, 185, 129, 0.25)', color: '#34d399' }}>
                <Award size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1rem' }}>
                  🎉 Lifetime Milestone #{claimableMilestoneIdx + 1} Qualified & Ready to Claim!
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>
                  You have achieved the required binary matching ({leftTeam} Left : {rightTeam} Right)!
                </div>
              </div>
            </div>
            <button
              onClick={() => handleClaimMilestone(claimableMilestoneIdx)}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Award size={16} />
              <span>{loading ? 'Claiming Reward...' : `Claim Milestone #${claimableMilestoneIdx + 1} Reward`}</span>
            </button>
          </div>
        )}

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          
          {/* Card 1: Instant Direct Earnings */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c084fc', letterSpacing: '0.06em' }}>
                  INSTANT TOTAL EARNINGS
                </span>
                <div style={{ padding: 6, borderRadius: 8, background: 'rgba(192, 132, 252, 0.15)' }}>
                  <Wallet size={18} color="#c084fc" />
                </div>
              </div>

              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#4ade80', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                ${totalEarnedVal.toFixed(2)}
                <span style={{ fontSize: '0.9rem', color: '#c084fc', fontWeight: 700 }}>USDT</span>
              </div>

              <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(74, 222, 128, 0.25)', marginTop: 10 }}>
                <span style={{ fontSize: '0.74rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <CheckCircle2 size={15} /> 100% INSTANT WALLET TRANSFERS ACTIVE
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: 2 }}>
                  All commissions are transferred directly to your connected BSC wallet without manual withdrawal.
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Single Leg Active Entries:</span>
              <b style={{ color: '#38bdf8', fontSize: '1rem' }}>{globalClub.entriesCount}</b>
            </div>
          </div>

          {/* Card 2: Binary Placement Team Stats */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.06em' }}>
                  BINARY TEAM BALANCE
                </span>
                <div style={{ padding: 6, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)' }}>
                  <GitCommit size={18} color="#818cf8" />
                </div>
              </div>

              {/* Left vs Right Comparison Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {/* Left Side */}
                <div style={{ background: 'rgba(6, 8, 20, 0.8)', padding: 10, borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#818cf8', letterSpacing: '0.05em' }}>LEFT LEG</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0' }}>{leftTeamCount}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Directs: <strong style={{ color: '#cbd5e1' }}>{profile?.leftDirectCount || 0}</strong> • Carry: <strong style={{ color: '#38bdf8' }}>{profile?.leftCarryVolume || 0}</strong>
                  </div>
                </div>

                {/* Right Side */}
                <div style={{ background: 'rgba(6, 8, 20, 0.8)', padding: 10, borderRadius: 12, border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#c084fc', letterSpacing: '0.05em' }}>RIGHT LEG</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0' }}>{rightTeamCount}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Directs: <strong style={{ color: '#cbd5e1' }}>{profile?.rightDirectCount || 0}</strong> • Carry: <strong style={{ color: '#38bdf8' }}>{profile?.rightCarryVolume || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Visual Balance Ratio Bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginBottom: 3 }}>
                  <span>Left: {leftRatio}%</span>
                  <span>Right: {rightRatio}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${leftRatio}%`, background: '#6366f1', transition: 'width 0.3s' }} />
                  <div style={{ width: `${rightRatio}%`, background: '#c084fc', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', padding: '8px 12px', borderRadius: 10, background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>1:1 Pair Matching:</span>
              <span style={{ fontWeight: 800, color: (profile?.leftDirectCount >= 1 && profile?.rightDirectCount >= 1) ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                {(profile?.leftDirectCount >= 1 && profile?.rightDirectCount >= 1) ? 'QUALIFIED (1L & 1R Active) ✅' : 'PENDING (Need 1L & 1R) ⏳'}
              </span>
            </div>
          </div>

          {/* Card 3: Global Club ($25 Re-entry System) */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
              border: '1px solid rgba(217, 70, 239, 0.35)',
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ec4899', letterSpacing: '0.06em' }}>
                  GLOBAL CLUB ($25 RE-ENTRY)
                </span>
                <div style={{ padding: 6, borderRadius: 8, background: 'rgba(236, 72, 153, 0.15)' }}>
                  <RefreshCw size={18} color="#ec4899" />
                </div>
              </div>

              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', marginBottom: 4, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                {globalClub.cyclesCompleted} <span style={{ fontSize: '0.9rem', color: '#f472b6', fontWeight: 700 }}>Cycles Completed</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5, margin: '6px 0 10px' }}>
                1-to-2 automated queue: 2 users enter below you → earn $25 cycle reward + 1 automatic re-entry position!
              </p>

              <div style={{ background: 'rgba(6, 8, 20, 0.8)', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(236, 72, 153, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Your Active Queue Positions:</span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#f472b6' }}>{globalClub.entriesCount}</span>
              </div>
            </div>

            <Link
              to="/packages"
              style={{
                marginTop: 16,
                padding: '11px 16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(168, 85, 247, 0.25))',
                border: '1px solid rgba(236, 72, 153, 0.45)',
                color: '#f8fafc',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 6px 16px rgba(236, 72, 153, 0.2)',
                transition: 'all 0.2s',
              }}
            >
              <span>Manage Global Club Entries</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* CHAMPION CLUB & WEEKLY REWARD PERFORMANCE STRATEGY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          
          {/* Champion Club Strategy Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(20, 24, 62, 0.9) 0%, rgba(12, 16, 42, 0.98) 100%)',
              border: champion.isEligible ? '1px solid rgba(251, 191, 36, 0.6)' : '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 20,
              padding: 20,
              boxShadow: champion.isEligible ? '0 10px 30px rgba(251, 191, 36, 0.15)' : '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ padding: 8, borderRadius: 10, background: 'rgba(251, 191, 36, 0.18)' }}>
                    <Sparkles size={18} color="#fbbf24" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc' }}>
                      Champion Club (Monthly Pool)
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>$3 per registration across whole company</span>
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 16,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: champion.isEligible ? 'rgba(74, 222, 128, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                    color: champion.isEligible ? '#4ade80' : '#fbbf24',
                    border: champion.isEligible ? '1px solid #4ade80' : '1px solid rgba(251, 191, 36, 0.4)',
                  }}
                >
                  {champion.isEligible ? 'QUALIFIED ✅' : 'IN PROGRESS ⏳'}
                </span>
              </div>

              {/* Progress Bar & Status */}
              <div style={{ background: 'rgba(6, 8, 20, 0.6)', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 5 }}>
                  <span style={{ color: '#cbd5e1' }}>Direct Referrals Requirement:</span>
                  <strong style={{ color: '#fbbf24' }}>{profile?.directCount || 0} / 30 Directs</strong>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 6 }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.round(((profile?.directCount || 0) / 30) * 100))}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                      height: '100%',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {champion.isEligible
                    ? '🎉 You have achieved Champion Club qualification! You receive an equal share of the monthly pool in batches directly to your wallet.'
                    : `Achieve 30 directs to lock your lifetime qualification in the monthly turnover royalty pool.`}
                </span>
              </div>

              {/* Earnings & Pool Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Your Received Champion Income</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fbbf24' }}>
                    ${Number(incomeBreakdown?.championIncome || 0).toFixed(2)} <span style={{ fontSize: '0.72rem' }}>USDT</span>
                  </span>
                </div>
                <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Current Monthly Pool</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4ade80' }}>
                    ${Number(overview?.championPoolBalance || 0).toFixed(2)} <span style={{ fontSize: '0.72rem' }}>USDT</span>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color="#fbbf24" />
              <span>Monthly closing handled by Admin. Distributed directly to member wallets in batches of 50-100.</span>
            </div>
          </div>

          {/* Weekly Reward Strategy Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(20, 24, 62, 0.9) 0%, rgba(12, 16, 42, 0.98) 100%)',
              border: weekly.isEligible ? '1px solid rgba(236, 72, 153, 0.6)' : '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: 20,
              padding: 20,
              boxShadow: weekly.isEligible ? '0 10px 30px rgba(236, 72, 153, 0.15)' : '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ padding: 8, borderRadius: 10, background: 'rgba(236, 72, 153, 0.18)' }}>
                    <Award size={18} color="#ec4899" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc' }}>
                      Weekly Performance Reward (Sun–Sat)
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>$3 per registration during the 7-day cycle</span>
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 16,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: weekly.isEligible ? 'rgba(74, 222, 128, 0.15)' : 'rgba(236, 72, 153, 0.15)',
                    color: weekly.isEligible ? '#4ade80' : '#ec4899',
                    border: weekly.isEligible ? '1px solid #4ade80' : '1px solid rgba(236, 72, 153, 0.4)',
                  }}
                >
                  {weekly.isEligible ? 'QUALIFIED THIS WEEK ✅' : 'IN PROGRESS ⏳'}
                </span>
              </div>

              {/* Progress Bar & Status */}
              <div style={{ background: 'rgba(6, 8, 20, 0.6)', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 5 }}>
                  <span style={{ color: '#cbd5e1' }}>Directs This Week (Sunday–Saturday):</span>
                  <strong style={{ color: '#ec4899' }}>{weekly.currentDirects} / 3 Directs</strong>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 6 }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.round((weekly.currentDirects / 3) * 100))}%`,
                      background: 'linear-gradient(90deg, #db2777, #ec4899)',
                      height: '100%',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {weekly.isEligible
                    ? '🎉 You have qualified for this week’s pool! On Sunday morning, admin will close and distribute your equal share directly to your wallet.'
                    : `Sponsor ${3 - Math.min(3, weekly.currentDirects)} more direct${3 - Math.min(3, weekly.currentDirects) === 1 ? '' : 's'} before Saturday 23:59 UTC to qualify for the weekly pool dividend.`}
                </span>
              </div>

              {/* Earnings & Pool Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Your Received Weekly Income</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ec4899' }}>
                    ${Number(incomeBreakdown?.weeklyIncome || 0).toFixed(2)} <span style={{ fontSize: '0.72rem' }}>USDT</span>
                  </span>
                </div>
                <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Active Weekly Pool</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4ade80' }}>
                    ${Number(overview?.weeklyPoolBalance || 0).toFixed(2)} <span style={{ fontSize: '0.72rem' }}>USDT</span>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color="#ec4899" />
              <span>Closing: Every Sunday morning. Distributed by Admin in batches of 50-100 directly to member wallets.</span>
            </div>
          </div>

        </div>

        {/* 7 INCOME STREAMS BREAKDOWN GRID */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                7 Comprehensive Income Streams
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '3px 0 0' }}>
                Automated smart contract distribution from every $50 registration and team expansion
              </p>
            </div>
            <Link
              to="/earnings"
              style={{
                fontSize: '0.82rem',
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
            
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
            <div style={{ background: 'rgba(13, 18, 45, 0.75)', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>7. LIFETIME MILESTONES (10%)</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0 6px' }}>
                  ${Number(incomeBreakdown?.lifetimeIncome || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#fb923c', fontWeight: 600, marginBottom: 8 }}>
                  {profile?.completedLifetimeMilestones || 0}/27 Milestones Claimed
                </div>
              </div>
              {claimableMilestoneIdx >= 0 ? (
                <button
                  onClick={() => handleClaimMilestone(claimableMilestoneIdx)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Award size={14} />
                  <span>{loading ? 'Claiming...' : `Claim Milestone #${claimableMilestoneIdx + 1}`}</span>
                </button>
              ) : (
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Matching: {leftTeam} Left • {rightTeam} Right
                </div>
              )}
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
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ padding: 8, borderRadius: 10, background: 'rgba(168, 85, 247, 0.2)' }}>
              <Share2 size={18} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                Binary Placement Referral Links
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '2px 0 0' }}>
                Direct new members to join specifically on your Left or Right leg to balance your binary matrix:
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 14 }}>
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
