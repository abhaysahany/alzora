import React, { useState } from 'react'
import { MemberLayout } from '../components/MemberLayout'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Sparkles,
  DollarSign,
  AlertCircle,
  GitCommit,
  Check,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Gift,
} from 'lucide-react'

// 27 Lifetime Milestones
const LIFETIME_MILESTONES = [
  { index: 0, left: 5, right: 5, reward: 25 },
  { index: 1, left: 20, right: 20, reward: 75 },
  { index: 2, left: 50, right: 50, reward: 150 },
  { index: 3, left: 100, right: 100, reward: 300 },
  { index: 4, left: 250, right: 250, reward: 750 },
  { index: 5, left: 500, right: 500, reward: 1500 },
  { index: 6, left: 1000, right: 1000, reward: 3000 },
  { index: 7, left: 2000, right: 2000, reward: 6000 },
  { index: 8, left: 4000, right: 4000, reward: 12000 },
  { index: 9, left: 8000, right: 8000, reward: 25000 },
  { index: 10, left: 15000, right: 15000, reward: 50000 },
  { index: 11, left: 30000, right: 30000, reward: 100000 },
  { index: 12, left: 60000, right: 60000, reward: 200000 },
  { index: 13, left: 120000, right: 120000, reward: 400000 },
  { index: 14, left: 250000, right: 250000, reward: 800000 },
  { index: 15, left: 500000, right: 500000, reward: 1500000 },
  { index: 16, left: 1000000, right: 1000000, reward: 3000000 },
  { index: 17, left: 1500000, right: 1500000, reward: 4500000 },
  { index: 18, left: 2000000, right: 2000000, reward: 6000000 },
  { index: 19, left: 2500000, right: 2500000, reward: 7500000 },
  { index: 20, left: 3000000, right: 3000000, reward: 9000000 },
  { index: 21, left: 3500000, right: 3500000, reward: 10500000 },
  { index: 22, left: 4000000, right: 4000000, reward: 12000000 },
  { index: 23, left: 4500000, right: 4500000, reward: 13500000 },
  { index: 24, left: 5000000, right: 5000000, reward: 15000000 },
  { index: 25, left: 6000000, right: 6000000, reward: 18000000 },
  { index: 26, left: 7000000, right: 7000000, reward: 21000000 },
]

export function EarningsPage() {
  const {
    profile,
    incomeBreakdown,
    weekly,
    milestoneStatus,
    claimLifetimeMilestone,
    claimWeeklyReward,
    loading,
    error,
  } = useTetherStream()

  const [successMsg, setSuccessMsg] = useState('')

  const handleClaimMilestone = async (idx) => {
    setSuccessMsg('')
    try {
      await claimLifetimeMilestone(idx)
      setSuccessMsg(`Milestone #${idx + 1} reward claimed successfully!`)
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      console.error(err)
    }
  }

  const handleClaimWeekly = async () => {
    if (weekly.currentEpoch <= 0) return
    setSuccessMsg('')
    try {
      await claimWeeklyReward(weekly.currentEpoch - 1)
      setSuccessMsg('Weekly performance reward claimed successfully!')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      console.error(err)
    }
  }

  const leftTeam = Number(profile?.leftTeamCount || 0)
  const rightTeam = Number(profile?.rightTeamCount || 0)

  return (
    <MemberLayout pageTitle="Earnings & 27 Lifetime Milestones">
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* BANNER */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 20,
            border: '1px solid rgba(139, 92, 246, 0.4)',
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.95) 0%, rgba(9, 13, 35, 0.98) 100%)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
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
                <Sparkles size={13} /> 10% LIFETIME REWARD MILESTONES
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Cumulative 27 Milestones & Weekly Pool
              </h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.84rem' }}>
                Lifetime rewards scale automatically as your Left and Right binary team grows. Cumulative counts never reset!
              </p>
            </div>

            <div
              style={{
                background: 'rgba(6, 8, 20, 0.8)',
                padding: '12px 18px',
                borderRadius: 14,
                border: '1px solid rgba(139, 92, 246, 0.35)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', fontWeight: 700, letterSpacing: '0.06em' }}>MILESTONES CLAIMED</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8' }}>
                {profile?.completedLifetimeMilestones || 0} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ 27</span>
              </span>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {successMsg && (
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
            <span>{successMsg}</span>
          </div>
        )}

        {/* WEEKLY REWARD STATUS CARD */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 22,
            padding: 26,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#c084fc', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 6 }}>
              <Clock size={16} /> 6% WEEKLY PERFORMANCE POOL (SUN–SAT)
            </div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
              Weekly Direct Referrals: {weekly.currentDirects} / 3
            </h3>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.86rem' }}>
              Sponsor ≥ 3 direct members in any weekly window to qualify for an equal share of that week's total pool!
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                padding: '8px 16px',
                borderRadius: 12,
                background: weekly.isEligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: weekly.isEligible ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                color: weekly.isEligible ? '#34d399' : '#fbbf24',
              }}
            >
              {weekly.isEligible ? 'QUALIFIED THIS WEEK ✅' : `${Math.max(0, 3 - weekly.currentDirects)} more directs needed`}
            </span>

            {weekly.isEligible && (
              <button
                onClick={handleClaimWeekly}
                disabled={loading}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                }}
              >
                Claim Weekly Pool
              </button>
            )}
          </div>
        </div>

        {/* 27 LIFETIME MILESTONES TABLE */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                27 Lifetime Reward Milestones Schedule
              </h3>
              <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                Current Team Counts: <strong style={{ color: '#818cf8' }}>{leftTeam.toLocaleString()} Left</strong> & <strong style={{ color: '#c084fc' }}>{rightTeam.toLocaleString()} Right</strong>
              </p>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', background: 'rgba(6, 8, 20, 0.7)', padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              10% Pool Cap Distribution
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700, fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.35)', color: '#c084fc', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '10px 14px' }}>Tier</th>
                <th style={{ padding: '10px 14px' }}>Required Left</th>
                <th style={{ padding: '10px 14px' }}>Required Right</th>
                <th style={{ padding: '10px 14px' }}>Reward Amount</th>
                <th style={{ padding: '10px 14px' }}>Progress</th>
                <th style={{ padding: '10px 14px' }}>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {LIFETIME_MILESTONES.map((m) => {
                const completedMilestones = Number(profile?.completedLifetimeMilestones || 0)
                const isClaimed = m.index < completedMilestones || milestoneStatus[m.index] === 2
                const isClaimable = !isClaimed && (milestoneStatus[m.index] === 1 || (leftTeam >= m.left && rightTeam >= m.right))
                const leftMet = leftTeam >= m.left
                const rightMet = rightTeam >= m.right
                const progressPct = Math.min(100, Math.round(((Math.min(leftTeam, m.left) + Math.min(rightTeam, m.right)) / (m.left + m.right)) * 100))

                return (
                  <tr
                    key={m.index}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: isClaimed ? 'rgba(16, 185, 129, 0.05)' : isClaimable ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#94a3b8' }}>#{m.index + 1}</td>
                    <td style={{ padding: '12px 14px', color: leftMet ? '#4ade80' : '#cbd5e1', fontWeight: 600 }}>
                      {m.left.toLocaleString()} {leftMet && '✓'}
                    </td>
                    <td style={{ padding: '12px 14px', color: rightMet ? '#4ade80' : '#cbd5e1', fontWeight: 600 }}>
                      {m.right.toLocaleString()} {rightMet && '✓'}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: '#38bdf8' }}>
                      ${m.reward.toLocaleString()} <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{m.index === 0 ? 'USDT (or Auto Single Leg)' : 'USDT'}</span>
                    </td>
                    <td style={{ padding: '12px 14px', minWidth: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: isClaimed ? '#10b981' : isClaimable ? '#38bdf8' : '#8b5cf6' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', width: 32 }}>{progressPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {isClaimed ? (
                        <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={14} /> ACHIEVED (INSTANT)
                        </span>
                      ) : isClaimable ? (
                        <button
                          onClick={() => handleClaimMilestone(m.index)}
                          disabled={loading}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.35)',
                          }}
                        >
                          {loading ? 'Processing...' : 'Instant Sync'}
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 700 }}>IN PROGRESS</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </MemberLayout>
  )
}

export default EarningsPage
