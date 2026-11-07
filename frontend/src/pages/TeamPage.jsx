import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MemberLayout } from '../components/MemberLayout'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  Users,
  Layers,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  Award,
  Zap,
  Split,
  ChevronRight,
  ShieldCheck,
  Network,
} from 'lucide-react'

export function TeamPage() {
  const { profile, incomeBreakdown, isRegistered } = useTetherStream()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const userAddress = profile?.userAddress || ''
  const referralLink = userAddress
    ? `${window.location.origin}/register?ref=${userAddress}`
    : `${window.location.origin}/register`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  // 20 Level Affiliate Breakdown
  const levelCommissionTable = [
    { range: 'Level 1 – 10', perMember: '$0.40 USDT', pct: '0.8%', poolShare: '$4.00 (8.0%)', desc: 'Direct & Inner Core Network' },
    { range: 'Level 11 – 20', perMember: '$0.30 USDT', pct: '0.6%', poolShare: '$3.00 (6.0%)', desc: 'Deep Network Expansion Levels' },
  ]

  const isBinaryQualified = (profile?.leftDirectCount || 0) >= 1 && (profile?.rightDirectCount || 0) >= 1

  return (
    <MemberLayout pageTitle="ELZORA Binary Network & 20-Level Lineage">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* HERO BANNER */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: 32,
            borderRadius: 24,
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 21, 54, 0.9) 0%, rgba(11, 15, 36, 0.98) 100%)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 20,
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: 'var(--purple-light)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> DUAL-LEG BINARY & 20-LEVEL AFFILIATE STREAM
              </div>
              <h1 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
                Binary Network & Team Organization
              </h1>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.94rem', maxWidth: 680 }}>
                Track your Left and Right binary team volume, matching pair rewards (<b style={{ color: '#c084fc' }}>$2/pair</b>), and 20-tier level affiliate payouts.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/tree')}
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  borderRadius: 14,
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Network size={18} />
                <span>Interactive Binary Tree</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="btn btn-outline"
                style={{
                  padding: '12px 20px',
                  borderRadius: 14,
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy Referral'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* BINARY TREE PERFORMANCE OVERVIEW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          
          {/* LEFT LEG METRICS */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              borderRadius: 20,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(11, 15, 36, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--purple-light)' }}>
                LEFT BINARY LEG
              </span>
              <Split size={20} style={{ color: 'var(--purple-light)' }} />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', marginBottom: 8 }}>
              {profile?.leftTeamCount || 0} <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>Members</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--muted)', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Directs: <b style={{ color: '#fff' }}>{profile?.leftDirectCount || 0}</b></span>
              <span>Carry Volume: <b style={{ color: 'var(--purple-light)' }}>{profile?.leftCarryVolume || 0}</b></span>
            </div>
          </div>

          {/* RIGHT LEG METRICS */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              borderRadius: 20,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(11, 15, 36, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--cyan)' }}>
                RIGHT BINARY LEG
              </span>
              <Split size={20} style={{ transform: 'scaleX(-1)', color: 'var(--cyan)' }} />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', marginBottom: 8 }}>
              {profile?.rightTeamCount || 0} <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>Members</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--muted)', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Directs: <b style={{ color: '#fff' }}>{profile?.rightDirectCount || 0}</b></span>
              <span>Carry Volume: <b style={{ color: 'var(--cyan)' }}>{profile?.rightCarryVolume || 0}</b></span>
            </div>
          </div>

          {/* BINARY MATCHING EARNINGS */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              borderRadius: 20,
              border: '1px solid rgba(74, 222, 128, 0.3)',
              background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.08) 0%, rgba(11, 15, 36, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4ade80' }}>
                MATCHING REWARD EARNED
              </span>
              <Award size={20} style={{ color: '#4ade80' }} />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#4ade80', marginBottom: 8 }}>
              ${Number(incomeBreakdown?.matchingIncome || 0).toFixed(2)} <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>USDT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--muted)', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span>First Pair: <b style={{ color: profile?.hasMatchedFirstPair ? '#4ade80' : '#facc15' }}>{profile?.hasMatchedFirstPair ? 'Cleared (1:1 Active)' : 'Pending (2:1 / 1:2)'}</b></span>
            </div>
          </div>

          {/* LEVEL AFFILIATE EARNINGS */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              borderRadius: 20,
              border: '1px solid rgba(234, 179, 8, 0.3)',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(11, 15, 36, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#facc15' }}>
                20-LEVEL AFFILIATE EARNED
              </span>
              <Layers size={20} style={{ color: '#facc15' }} />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#facc15', marginBottom: 8 }}>
              ${Number(incomeBreakdown?.affiliateIncome || 0).toFixed(2)} <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500 }}>USDT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--muted)', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Levels Active: <b style={{ color: '#fff' }}>20 / 20 Unlocked</b></span>
            </div>
          </div>

        </div>

        {/* 20-LEVEL AFFILIATE ARCHITECTURE TABLE */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 900 }}>
                20-Level Affiliate Commission Structure
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.86rem' }}>
                $7.00 (14%) from every $50 registration package is distributed through 20 upline levels.
              </p>
            </div>
            <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: 12, background: 'rgba(139, 92, 246, 0.12)', color: 'var(--purple-light)', fontSize: '0.82rem', fontWeight: 800 }}>
              100% On-Chain Auto-Distributed
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 800 }}>TIER LEVEL RANGE</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 800 }}>PAYOUT PER MEMBER</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 800 }}>PERCENTAGE SHARE</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 800 }}>TIER POOL TOTAL</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 800 }}>CLASSIFICATION</th>
                </tr>
              </thead>
              <tbody>
                {levelCommissionTable.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '16px', fontWeight: 800, color: '#fff' }}>{item.range}</td>
                    <td style={{ padding: '16px', fontWeight: 900, color: 'var(--purple-light)' }}>{item.perMember}</td>
                    <td style={{ padding: '16px', fontWeight: 800, color: 'var(--cyan)' }}>{item.pct}</td>
                    <td style={{ padding: '16px', fontWeight: 800, color: '#4ade80' }}>{item.poolShare}</td>
                    <td style={{ padding: '16px', color: 'var(--muted)', fontSize: '0.84rem' }}>{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BINARY SYSTEM RULES & QUALIFICATION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          
          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)' }}>
            <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} style={{ color: 'var(--purple-light)' }} />
              Binary Matching Logic
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
              <li>Every $50 registration contributes to Left/Right binary point volume.</li>
              <li><b>First Pair Qualification:</b> Requires 2:1 or 1:2 ratio to establish binary qualification.</li>
              <li><b>Subsequent Pairs:</b> Matches at a 1:1 ratio. Each matched pair awards <b>$2.00 USDT</b>.</li>
              <li>Unmatched volume carries forward indefinitely on the stronger leg.</li>
            </ul>
          </div>

          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)' }}>
            <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} style={{ color: 'var(--cyan)' }} />
              Direct Sponsor Requirements
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
              <li>To earn Binary Matching bonuses, you must sponsor at least <b>1 Left Direct</b> and <b>1 Right Direct</b>.</li>
              <li>Current Left Directs: <b style={{ color: (profile?.leftDirectCount || 0) >= 1 ? '#4ade80' : '#facc15' }}>{profile?.leftDirectCount || 0} / 1</b></li>
              <li>Current Right Directs: <b style={{ color: (profile?.rightDirectCount || 0) >= 1 ? '#4ade80' : '#facc15' }}>{profile?.rightDirectCount || 0} / 1</b></li>
              <li>Sponsor 30 directs to unlock the <b>Champion Club</b> (6% Global Royalty Pool).</li>
            </ul>
          </div>

        </div>

      </div>
    </MemberLayout>
  )
}
