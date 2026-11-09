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
    <MemberLayout pageTitle="Binary Network & Lineage">
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* HERO BANNER */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 20,
            border: '1px solid rgba(139, 92, 246, 0.4)',
            background: 'linear-gradient(135deg, rgba(16, 21, 54, 0.95) 0%, rgba(11, 15, 36, 0.98) 100%)',
            boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  color: '#c084fc',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                <Sparkles size={13} /> DUAL-LEG BINARY & 20-LEVEL AFFILIATE STREAM
              </div>
              <h1 style={{ margin: '0 0 4px', fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Binary Network & Team Organization
              </h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.84rem', maxWidth: 640 }}>
                Track your Left and Right binary team volume, matching pair rewards (<b style={{ color: '#c084fc' }}>$2/pair</b>), and 20-tier level affiliate payouts.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/tree')}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                }}
              >
                <Network size={16} />
                <span>Sponsor Tree & Directs</span>
              </button>

              <button
                onClick={handleCopyLink}
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy Referral'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* BINARY TREE PERFORMANCE OVERVIEW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          
          {/* LEFT LEG METRICS */}
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(11, 15, 36, 0.85) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--purple-light)' }}>
                LEFT BINARY LEG
              </span>
              <Split size={18} style={{ color: 'var(--purple-light)' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: 6 }}>
              {profile?.leftTeamCount || 0} <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>Members</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Directs: <b style={{ color: '#fff' }}>{profile?.leftDirectCount || 0}</b></span>
              <span>Carry Volume: <b style={{ color: 'var(--purple-light)' }}>{profile?.leftCarryVolume || 0}</b></span>
            </div>
          </div>

          {/* RIGHT LEG METRICS */}
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(11, 15, 36, 0.85) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--cyan)' }}>
                RIGHT BINARY LEG
              </span>
              <Split size={18} style={{ transform: 'scaleX(-1)', color: 'var(--cyan)' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: 6 }}>
              {profile?.rightTeamCount || 0} <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>Members</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Directs: <b style={{ color: '#fff' }}>{profile?.rightDirectCount || 0}</b></span>
              <span>Carry Volume: <b style={{ color: 'var(--cyan)' }}>{profile?.rightCarryVolume || 0}</b></span>
            </div>
          </div>

          {/* BINARY MATCHING EARNINGS */}
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              border: '1px solid rgba(74, 222, 128, 0.3)',
              background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(11, 15, 36, 0.85) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#4ade80' }}>
                MATCHING REWARD EARNED
              </span>
              <Award size={18} style={{ color: '#4ade80' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ade80', marginBottom: 6 }}>
              ${Number(incomeBreakdown?.matchingIncome || 0).toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>USDT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span>1:1 Condition: <b style={{ color: isBinaryQualified ? '#4ade80' : '#facc15' }}>{isBinaryQualified ? 'Qualified (1L & 1R)' : 'Pending (Need 1L & 1R)'}</b></span>
            </div>
          </div>

          {/* LEVEL AFFILIATE EARNINGS */}
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              border: '1px solid rgba(234, 179, 8, 0.3)',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(11, 15, 36, 0.85) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#facc15' }}>
                20-LEVEL AFFILIATE EARNED
              </span>
              <Layers size={18} style={{ color: '#facc15' }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#facc15', marginBottom: 6 }}>
              ${Number(incomeBreakdown?.affiliateIncome || 0).toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>USDT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Levels Active: <b style={{ color: '#fff' }}>20 / 20 Unlocked</b></span>
            </div>
          </div>

        </div>

        {/* 20-LEVEL AFFILIATE ARCHITECTURE TABLE */}
        <div style={{ padding: 20, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 900 }}>
                20-Level Affiliate Commission Structure
              </h3>
              <p style={{ margin: '3px 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
                $7.00 (14%) from every $50 registration package is distributed through 20 upline levels.
              </p>
            </div>
            <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)', color: 'var(--purple-light)', fontSize: '0.76rem', fontWeight: 800 }}>
              100% On-Chain Auto-Distributed
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600, fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: '0.76rem', fontWeight: 800 }}>TIER LEVEL RANGE</th>
                  <th style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: '0.76rem', fontWeight: 800 }}>PAYOUT PER MEMBER</th>
                  <th style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: '0.76rem', fontWeight: 800 }}>PERCENTAGE SHARE</th>
                  <th style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: '0.76rem', fontWeight: 800 }}>TIER POOL TOTAL</th>
                  <th style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: '0.76rem', fontWeight: 800 }}>CLASSIFICATION</th>
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
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#fff' }}>{item.range}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: 'var(--purple-light)' }}>{item.perMember}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--cyan)' }}>{item.pct}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#4ade80' }}>{item.poolShare}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: '0.8rem' }}>{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BINARY SYSTEM RULES & QUALIFICATION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          
          <div style={{ padding: 18, borderRadius: 18, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
            <h4 style={{ margin: '0 0 10px', color: '#fff', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} style={{ color: 'var(--purple-light)' }} />
              Binary Matching Logic
            </h4>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <li>Every $50 registration contributes to Left/Right binary point volume.</li>
              <li><b>1:1 Matching:</b> Matches at 1:1 ratio. Each matched pair awards <b>$2.00 USDT</b>.</li>
              <li><b>Condition:</b> Requires 1 Left Direct and 1 Right Direct active.</li>
              <li>Unmatched volume carries forward indefinitely on the stronger leg.</li>
            </ul>
          </div>

          <div style={{ padding: 18, borderRadius: 18, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
            <h4 style={{ margin: '0 0 10px', color: '#fff', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} style={{ color: 'var(--cyan)' }} />
              Direct Sponsor Requirements
            </h4>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <li>To earn Binary Matching bonuses, you must sponsor at least <b>1 Left Direct</b> and <b>1 Right Direct</b>.</li>
              <li>Current Left Directs: <b style={{ color: (profile?.leftDirectCount || 0) >= 1 ? '#4ade80' : '#facc15' }}>{profile?.leftDirectCount || 0} / 1</b></li>
              <li>Current Right Directs: <b style={{ color: (profile?.rightDirectCount || 0) >= 1 ? '#4ade80' : '#facc15' }}>{profile?.rightDirectCount || 0} / 1</b></li>
              <li>Sponsor 3 directs to qualify for <b>Champion Club</b> & <b>Weekly Reward</b>.</li>
            </ul>
          </div>

        </div>

      </div>
    </MemberLayout>
  )
}
