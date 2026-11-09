import React, { useState } from 'react'
import { MemberLayout } from '../components/MemberLayout'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  Award,
  CheckCircle2,
  Sparkles,
  Users,
  DollarSign,
  ShieldCheck,
  Check,
  ArrowRight,
  TrendingUp,
  Coins,
  Crown,
} from 'lucide-react'

const CLUB_RANKS = [
  { rank: 1, name: 'Starter', members: 2, gross: '$24', upgrade: '$14', sponsor: '$0', net: '$10' },
  { rank: 2, name: 'Leader', members: 4, gross: '$56', upgrade: '$30', sponsor: '$0', net: '$26' },
  { rank: 3, name: 'Achiever', members: 8, gross: '$240', upgrade: '$96', sponsor: '$24', net: '$120' },
  { rank: 4, name: 'Mentor', members: 16, gross: '$1,536', upgrade: '$500', sponsor: '$125', net: '$911' },
  { rank: 5, name: 'Director', members: 32, gross: '$16,000', upgrade: '$5,000', sponsor: '$1,250', net: '$9,750' },
  { rank: 6, name: 'Elite', members: 64, gross: '$320,000', upgrade: '$15,000', sponsor: '$3,750', net: '$301,250' },
  { rank: 7, name: 'Crown', members: 128, gross: '$1,920,000', upgrade: '$30,000', sponsor: '$7,500', net: '$1,882,500' },
  { rank: 8, name: 'Legend', members: 256, gross: '$7,680,000', upgrade: 'Re-top Up', sponsor: '$0', net: '$7,680,000' },
]

export function RanksPage() {
  const { profile, champion, overview, claimChampionReward, loading, error } = useTetherStream()
  const [successMsg, setSuccessMsg] = useState('')

  const handleClaimChampion = async () => {
    setSuccessMsg('')
    try {
      await claimChampionReward()
      setSuccessMsg('Champion Club Dividend claimed successfully!')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      console.error(err)
    }
  }

  const currentRankNum = Number(profile?.currentRank || 1)
  const directCount = Number(profile?.directCount || 0)
  const championTarget = 30
  const championProgress = Math.min(100, Math.round((directCount / championTarget) * 100))

  return (
    <MemberLayout pageTitle="8 Club Ranks & Champion Club">
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Banner */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 20,
            border: '1px solid rgba(217, 70, 239, 0.4)',
            background: 'linear-gradient(135deg, rgba(20, 15, 60, 0.95) 0%, rgba(9, 13, 35, 0.98) 100%)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
            position: 'relative',
            overflow: 'hidden',
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
                  background: 'rgba(217, 70, 239, 0.2)',
                  border: '1px solid rgba(217, 70, 239, 0.4)',
                  color: '#f472b6',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> 24% CLUB MATRIX ALLOCATION
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                8 Club Ranks & Automated Upgrades
              </h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.84rem' }}>
                Cascading 2-matrix queue where qualifying members advance through automated contract upgrades.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(6, 8, 20, 0.8)',
                padding: '12px 18px',
                borderRadius: 14,
                border: '1px solid rgba(168, 85, 247, 0.35)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', fontWeight: 700, letterSpacing: '0.06em' }}>YOUR CURRENT RANK</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#c084fc' }}>
                {profile?.rankName || 'Starter'} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>(Rank {currentRankNum})</span>
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

        {/* CHAMPION CLUB HERO CARD */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
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
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 6 }}>
              <Crown size={16} /> CHAMPION CLUB (6% LIFETIME ROYALTY POOL)
            </div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc' }}>
              30 Direct Referrals Requirement
            </h3>
            <p style={{ margin: '6px 0 12px', color: '#cbd5e1', fontSize: '0.86rem' }}>
              Direct Sponsors: <strong style={{ color: '#38bdf8' }}>{directCount} / {championTarget}</strong> • 
              Status: <strong style={{ color: champion.isEligible ? '#4ade80' : '#fbbf24' }}>{champion.isEligible ? 'QUALIFIED CHAMPION ✅' : 'IN PROGRESS'}</strong>
            </p>

            {/* Progress bar */}
            <div style={{ maxWidth: 420 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>
                <span>Progress to Royalty</span>
                <span>{championProgress}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${championProgress}%`, height: '100%', background: champion.isEligible ? '#4ade80' : 'linear-gradient(90deg, #fbbf24, #f59e0b)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right', background: 'rgba(6, 8, 20, 0.8)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(251, 191, 36, 0.25)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>UNCLAIMED DIVIDEND</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4ade80' }}>${Number(champion.pendingReward || 0).toFixed(2)} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>USDT</span></div>
            </div>

            <button
              onClick={handleClaimChampion}
              disabled={loading || !champion.isEligible || Number(champion.pendingReward || 0) <= 0}
              style={{
                padding: '14px 24px',
                borderRadius: 14,
                border: 'none',
                background: champion.isEligible && Number(champion.pendingReward || 0) > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)',
                color: champion.isEligible && Number(champion.pendingReward || 0) > 0 ? '#fff' : '#64748b',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: champion.isEligible && Number(champion.pendingReward || 0) > 0 ? 'pointer' : 'not-allowed',
                boxShadow: champion.isEligible && Number(champion.pendingReward || 0) > 0 ? '0 10px 25px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Claiming...' : 'Claim Royalty Dividend'}
            </button>
          </div>
        </div>

        {/* 8 CLUB RANKS TABLE */}
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
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
              Club Rank Progression Schedule (Official 8-Stage Matrix)
            </h3>
            <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
              Starter to Legend rank progression conditions, automated package upgrade deductions, sponsor commissions, and net profit.
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 720, fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.35)', color: '#c084fc', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px 14px' }}>Rank</th>
                <th style={{ padding: '10px 14px' }}>Rank Name</th>
                <th style={{ padding: '10px 14px' }}>Team Members</th>
                <th style={{ padding: '10px 14px' }}>Gross Income</th>
                <th style={{ padding: '10px 14px' }}>Package Upgrade</th>
                <th style={{ padding: '10px 14px' }}>Sponsor Income</th>
                <th style={{ padding: '10px 14px' }}>Net Profit</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {CLUB_RANKS.map((r) => {
                const isCurrent = currentRankNum === r.rank
                const isCompleted = currentRankNum > r.rank

                return (
                  <tr
                    key={r.rank}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: isCurrent ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: isCurrent ? '#c084fc' : '#94a3b8' }}>
                      #{r.rank}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: isCurrent ? '#f8fafc' : '#cbd5e1' }}>
                      {r.name}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1', fontWeight: 600 }}>{r.members}</td>
                    <td style={{ padding: '12px 14px', color: '#38bdf8', fontWeight: 800 }}>{r.gross}</td>
                    <td style={{ padding: '12px 14px', color: '#f472b6', fontWeight: 600 }}>{r.upgrade}</td>
                    <td style={{ padding: '12px 14px', color: '#fbbf24', fontWeight: 600 }}>{r.sponsor}</td>
                    <td style={{ padding: '12px 14px', color: '#4ade80', fontWeight: 900 }}>{r.net}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {isCompleted ? (
                        <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={14} /> COMPLETED
                        </span>
                      ) : isCurrent ? (
                        <span style={{ padding: '4px 10px', borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff', fontWeight: 800, fontSize: '0.72rem', boxShadow: '0 2px 10px rgba(124, 58, 237, 0.4)' }}>
                          ACTIVE NOW
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 700 }}>LOCKED</span>
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

export default RanksPage
