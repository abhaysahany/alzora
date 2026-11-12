import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PublicNavbar } from '../components/PublicNavbar'
import BackgroundCanvas from '../components/BackgroundCanvas'
import { useWalletAuth } from '../hooks/useWalletAuth'
import {
  Sparkles,
  Zap,
  Layers,
  Award,
  GitCommit,
  Crown,
  Gift,
  Coins,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  Users,
  Volume2,
  Bot,
} from 'lucide-react'

export function BusinessPlanPage() {
  const navigate = useNavigate()
  const { isConnected } = useWalletAuth()

  const streams = [
    {
      title: 'Direct Referral Commission',
      pct: '20%',
      amount: '$10.00',
      color: '#c084fc',
      icon: Zap,
      desc: 'Instant direct reward credited immediately to your BSC wallet for every sponsored direct registrant ($50 USDT package).',
      tag: 'Instant 20%',
    },
    {
      title: '20-Level Network Affiliate',
      pct: '14%',
      amount: '$7.00',
      color: '#38bdf8',
      icon: Layers,
      desc: '$0.40 allocated across Levels 1–10 and $0.30 across Levels 11–20 to reward deep organizational expansion.',
      tag: '14% 20 Generations',
    },
    {
      title: '8 Cascading Club Matrices',
      pct: '24%',
      amount: '$12.00',
      color: '#a855f7',
      icon: Award,
      desc: 'Automated personal team queues progressing from Starter to Legend with auto-funded upgrades and zero re-investment required.',
      tag: '24% Dynamic Clubs',
    },
    {
      title: 'Binary Matching Pool',
      pct: '20%',
      amount: '$10.00',
      color: '#4ade80',
      icon: GitCommit,
      desc: '$2.00 per 1:1 matched binary pair. Unmatched volume carries forward perpetually with dynamic daily caps scaling by rank.',
      tag: '20% 1:1 Pairs',
    },
    {
      title: 'Champion Royalty Pool',
      pct: '6%',
      amount: '$3.00',
      color: '#fbbf24',
      icon: Crown,
      desc: 'Lifetime royalty dividend pool sharing 6% of entire global turnover among top leaders who achieve direct sponsorship qualification.',
      tag: '6% Monthly Turnover',
    },
    {
      title: 'Weekly Performance Pool',
      pct: '6%',
      amount: '$3.00',
      color: '#ec4899',
      icon: Gift,
      desc: 'Equal revenue share pool distributed every Sunday morning to proactive sponsors qualifying in that weekly epoch.',
      tag: '6% Weekly Pool',
    },
    {
      title: '27 Lifetime Milestone Rewards',
      pct: '10%',
      amount: '$5.00',
      color: '#f97316',
      icon: Coins,
      desc: 'Balanced cumulative volume milestone rewards scaling from $25 up to $21,000,000 paid directly without expiration dates.',
      tag: '10% Milestones',
    },
    {
      title: 'Single Leg / Global Club ($25)',
      pct: 'Autonomous',
      amount: '$25 / Cycle',
      color: '#06b6d4',
      icon: RefreshCw,
      desc: 'Autonomous 1-to-2 decentralized queue: every 2 entries cycling behind you triggers a $25 USDT instant payout + 1 automatic re-entry spot.',
      tag: '1-to-2 Re-entry Queue',
    },
  ]

  const clubRanks = [
    { rank: 1, name: 'Starter', entry: '$12.00', profit: '$10.00', upgrade: '$14.00' },
    { rank: 2, name: 'Bronze Club', entry: '$14.00', profit: '$12.00', upgrade: '$16.00' },
    { rank: 3, name: 'Silver Club', entry: '$16.00', profit: '$16.00', upgrade: '$16.00' },
    { rank: 4, name: 'Gold Club', entry: '$16.00', profit: '$16.00', upgrade: '$16.00' },
    { rank: 5, name: 'Platinum Club', entry: '$16.00', profit: '$16.00', upgrade: '$16.00' },
    { rank: 6, name: 'Diamond Club', entry: '$16.00', profit: '$16.00', upgrade: '$16.00' },
    { rank: 7, name: 'Crown Diamond', entry: '$16.00', profit: '$16.00', upgrade: '$16.00' },
    { rank: 8, name: 'Legend', entry: '$16.00', profit: '$32.00 (Max)', upgrade: 'Max Rank' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060814',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <BackgroundCanvas />
      <PublicNavbar />

      <main style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', zIndex: 10 }}>
        
        {/* HERO BANNER */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: '32px 36px',
            borderRadius: 24,
            border: '1px solid rgba(139, 92, 246, 0.35)',
            background: 'linear-gradient(135deg, rgba(16, 21, 54, 0.95) 0%, rgba(10, 14, 38, 0.98) 100%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(139, 92, 246, 0.15)',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'rgba(139, 92, 246, 0.18)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc', fontSize: '0.8rem', fontWeight: 800, marginBottom: 12 }}>
            <Sparkles size={14} /> OFFICIAL SPECIFICATION & MATHEMATICAL FORMULA
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 10px', color: '#fff', letterSpacing: '-0.02em' }}>
            ELZORA Decentralized Business Plan
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: 840, lineHeight: 1.6, margin: '0 0 20px' }}>
            A mathematically guaranteed, non-custodial MLM protocol built on BNB Smart Chain. 100% of all $50 USDT package registration fees are routed in real-time across 7 core income streams plus an autonomous $25 Single Leg Global Club.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => navigate(isConnected ? '/dashboard' : '/login')}
              className="btn btn-primary"
              style={{ padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>{isConnected ? 'Open Dashboard' : 'Join ELZORA ($50 USDT)'}</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/ai/plan-explainer')}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(43, 232, 107, 0.14)',
                border: '1px solid rgba(43, 232, 107, 0.45)',
                color: '#86efac',
                cursor: 'pointer',
              }}
            >
              <Volume2 size={16} />
              <span>Plan Explainer Voice AI</span>
            </button>
            <button
              type="button"
              className="open-ai-chat-trigger"
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.38)',
                color: '#7dd3fc',
                cursor: 'pointer',
              }}
            >
              <Bot size={16} />
              <span>Ask Sentinel Guard AI</span>
            </button>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                color: '#4ade80',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={16} />
              <span>100% Instant To BSC Wallets (Zero Withdrawal Delays)</span>
            </div>
          </div>
        </div>

        {/* 100% PACKAGE DISTRIBUTION SUMMARY STRIP */}
        <div
          style={{
            padding: 24,
            borderRadius: 20,
            background: 'rgba(11, 15, 36, 0.85)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              MATHEMATICAL PURITY & SOLVENCY
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: '4px 0 6px' }}>
              How Every $50 USDT Package Is Distributed
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
              $50.00 IN = $50.00 OUT. Zero admin float, zero custodial locking, and 100% verifiable on BSC.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Direct Sponsor', pct: '20%', usd: '$10.00', color: '#c084fc' },
              { label: '20 Levels Affiliate', pct: '14%', usd: '$7.00', color: '#38bdf8' },
              { label: '8 Club Matrices', pct: '24%', usd: '$12.00', color: '#a855f7' },
              { label: 'Binary Matching', pct: '20%', usd: '$10.00', color: '#4ade80' },
              { label: 'Champion Royalty', pct: '6%', usd: '$3.00', color: '#fbbf24' },
              { label: 'Weekly Rewards', pct: '6%', usd: '$3.00', color: '#ec4899' },
              { label: '27 Milestones', pct: '10%', usd: '$5.00', color: '#f97316' },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(6, 8, 20, 0.7)',
                  border: `1px solid ${item.color}35`,
                  borderRadius: 14,
                  padding: 14,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: item.color, margin: '4px 0 2px' }}>
                  {item.pct}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 800 }}>{item.usd} USDT</div>
              </div>
            ))}
          </div>
        </div>

        {/* 8 STREAMS DETAILED GRID */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
              8 INDEPENDENT WEALTH CHANNELS
            </span>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fff', margin: '4px 0' }}>
              Detailed Income Streams Specification
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {streams.map((s, idx) => {
              const Icon = s.icon
              return (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    padding: 20,
                    borderRadius: 18,
                    background: 'rgba(11, 15, 36, 0.85)',
                    border: `1px solid ${s.color}35`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ padding: 8, borderRadius: 10, background: `${s.color}20`, color: s.color }}>
                        <Icon size={20} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: s.color,
                          background: 'rgba(255,255,255,0.05)',
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}
                      >
                        {s.tag}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                      {s.title}
                    </h3>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.5 }}>
                      {s.desc}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Payout Amount:</span>
                    <strong style={{ fontSize: '1.15rem', color: s.color, fontWeight: 900 }}>
                      {s.amount}
                    </strong>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 1:1 BINARY SYSTEM & 8 CLUB MATRIX SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          
          {/* BINARY DETAILS */}
          <div
            className="glass-card"
            style={{
              padding: 22,
              borderRadius: 20,
              background: 'rgba(11, 15, 36, 0.9)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>
                <GitCommit size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  1:1 Binary Matching Architecture
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>$2.00 per 1:1 Balanced Pair</span>
              </div>
            </div>

            <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.7 }}>
              <li>
                <b>Qualification Condition:</b> Must sponsor minimum <b>1 Left Direct & 1 Right Direct</b> active member.
              </li>
              <li>
                <b>Matching Ratio:</b> Pure 1:1 pair matching algorithm across infinite depth.
              </li>
              <li>
                <b>Carry Forward:</b> Unmatched volume on your power leg never flushes; it carries forward perpetually.
              </li>
              <li>
                <b>Dynamic Daily Capping:</b> Scales up as you advance through the 8 Club Matrices (from $10/day up to $1,000+/day).
              </li>
            </ul>
          </div>

          {/* SINGLE LEG GLOBAL CLUB DETAILS */}
          <div
            className="glass-card"
            style={{
              padding: 22,
              borderRadius: 20,
              background: 'rgba(11, 15, 36, 0.9)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  Single Leg / Global Club ($25)
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>1-to-2 Autonomous Cycling Queue</span>
              </div>
            </div>

            <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.7 }}>
              <li>
                <b>Decentralized Participation:</b> Fixed entry of <b>$25 USDT</b> open to all active members.
              </li>
              <li>
                <b>Cycle Execution:</b> Whenever 2 entries join the global queue behind you, your spot cycles out.
              </li>
              <li>
                <b>Instant Payout:</b> You receive <b>$25.00 USDT</b> sent directly to your BSC wallet.
              </li>
              <li>
                <b>Perpetual Re-entry:</b> The remaining $25 automatically funds a fresh re-entry position at the end of the queue.
              </li>
            </ul>
          </div>
        </div>

        {/* 8 CLUB MATRICES PROGRESSION TABLE */}
        <div
          style={{
            padding: 22,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} color="#c084fc" />
              <span>8 Cascading Club Matrices Progression</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Advance from Starter to Legend automatically as your personal team cycles through the queue.
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.25)', color: '#94a3b8', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>CLUB RANK</th>
                  <th style={{ padding: '10px 14px' }}>ENTRY VALUE</th>
                  <th style={{ padding: '10px 14px' }}>NET PROFIT (INSTANT WALLET)</th>
                  <th style={{ padding: '10px 14px' }}>NEXT CLUB UPGRADE</th>
                </tr>
              </thead>
              <tbody>
                {clubRanks.map((r) => (
                  <tr key={r.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#fff' }}>
                      <span style={{ color: '#c084fc' }}>#{r.rank}</span> {r.name}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{r.entry}</td>
                    <td style={{ padding: '12px 14px', color: '#4ade80', fontWeight: 800 }}>{r.profit}</td>
                    <td style={{ padding: '12px 14px', color: '#38bdf8' }}>{r.upgrade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div
          style={{
            padding: '28px 32px',
            borderRadius: 22,
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(79, 70, 229, 0.15) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
            Ready to Begin Your Financial Journey with ELZORA?
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', maxWidth: 640, margin: '0 auto 20px' }}>
            Connect your Web3 wallet (MetaMask, Trust Wallet, or SafePal) on BNB Smart Chain and activate your binary position.
          </p>
          <button
            onClick={() => navigate(isConnected ? '/dashboard' : '/login')}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: 900, borderRadius: 14 }}
          >
            {isConnected ? 'Go to Member Dashboard →' : 'Connect Wallet & Get Started →'}
          </button>
        </div>

      </main>
    </div>
  )
}

export default BusinessPlanPage

