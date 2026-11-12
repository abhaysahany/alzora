import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useTetherStream } from '../hooks/useTetherStream'
import { ConnectWalletButton } from '../components/ConnectWalletButton'
import { PublicNavbar } from '../components/PublicNavbar'
import BackgroundCanvas from '../components/BackgroundCanvas'
import {
  PageTransitionShell,
  FloatingParticles,
  RevealOnScroll,
} from '../components/MotionPrimitives'
import {
  Sparkles,
  GitCommit,
  Award,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  Crown,
  Gift,
  Coins,
  ChevronRight,
  Lock,
  Menu,
  X,
  Wallet,
  Volume2,
} from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()
  const { isConnected, address } = useWalletAuth()
  const { profile, overview, CONTRACT_ADDRESSES } = useTetherStream()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isRegistered = Boolean(profile?.isRegistered || profile?.active)

  const handleAction = () => {
    if (!isConnected) {
      navigate('/login')
    } else if (isRegistered) {
      navigate('/dashboard')
    } else {
      navigate('/register')
    }
  }

  const streams = [
    {
      title: 'Direct Referral Commission',
      pct: '20%',
      amount: '$10.00',
      color: '#c084fc',
      icon: Zap,
      desc: 'Instant direct reward credited immediately for every member who registers using your referral link.',
    },
    {
      title: '20-Level Network Affiliate',
      pct: '14%',
      amount: '$7.00',
      color: '#38bdf8',
      icon: Layers,
      desc: '$0.40 allocated across Levels 1–10 and $0.30 across Levels 11–20 to fuel deep team expansion.',
    },
    {
      title: '8 Club Matrix Queues',
      pct: '24%',
      amount: '$12.00',
      color: '#a855f7',
      icon: Award,
      desc: 'Cascading automated queue advancing members from Starter up to Legend with auto-funded upgrades.',
    },
    {
      title: 'Binary Matching Pool',
      pct: '20%',
      amount: '$10.00',
      color: '#4ade80',
      icon: GitCommit,
      desc: '$2.00 per 1:1 matched binary pair. Daily capping scales dynamically with your Club Rank.',
    },
    {
      title: 'Champion Royalty Pool',
      pct: '6%',
      amount: '$3.00',
      color: '#fbbf24',
      icon: Crown,
      desc: 'Lifetime royalty dividend pool shared among leaders who achieve ≥ 30 direct active referrals.',
    },
    {
      title: 'Weekly Performance Pool',
      pct: '6%',
      amount: '$3.00',
      color: '#ec4899',
      icon: Gift,
      desc: 'Equal revenue share pool distributed weekly among performers sponsoring ≥ 3 direct members.',
    },
    {
      title: '27 Lifetime Milestones',
      pct: '10%',
      amount: '$5.00',
      color: '#f97316',
      icon: TrendingUp,
      desc: 'Cumulative dual-team milestones starting from $25 up to a staggering $21,000,000 USDT reward.',
    },
    {
      title: 'Single Leg / Global Club ($25)',
      pct: 'Autonomous Queue',
      amount: '$25 / Cycle',
      color: '#06b6d4',
      icon: RefreshCw,
      desc: '1-to-2 automated decentralized queue: every 2 entries cycling behind you triggers a $25 USDT instant payout + 1 automatic re-entry spot.',
    },
  ]

  const ranks = [
    { rank: 1, name: 'Starter', members: 2, gross: '$24', upgrade: '$14', sponsor: '$0', net: '$10' },
    { rank: 2, name: 'Leader', members: 4, gross: '$56', upgrade: '$30', sponsor: '$0', net: '$26' },
    { rank: 3, name: 'Achiever', members: 8, gross: '$240', upgrade: '$96', sponsor: '$24', net: '$120' },
    { rank: 4, name: 'Mentor', members: 16, gross: '$1,536', upgrade: '$500', sponsor: '$125', net: '$911' },
    { rank: 5, name: 'Director', members: 32, gross: '$16,000', upgrade: '$5,000', sponsor: '$1,250', net: '$9,750' },
    { rank: 6, name: 'Elite', members: 64, gross: '$320,000', upgrade: '$15,000', sponsor: '$3,750', net: '$301,250' },
    { rank: 7, name: 'Crown', members: 128, gross: '$1,920,000', upgrade: '$30,000', sponsor: '$7,500', net: '$1,882,500' },
    { rank: 8, name: 'Legend', members: 256, gross: '$7,680,000', upgrade: 'Re-top Up', sponsor: '$0', net: '$7,680,000' },
  ]

  return (
    <PageTransitionShell
      style={{
        minHeight: '100vh',
        background: '#050611',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', sans-serif",
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <BackgroundCanvas />

      {/* AMBIENT LIGHT BLOBS */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: `
            radial-gradient(ellipse 62% 42% at 50% -10%, rgba(139, 92, 246, 0.25), transparent 70%),
            radial-gradient(ellipse 50% 50% at 86% 28%, rgba(168, 85, 247, 0.16), transparent 60%),
            radial-gradient(ellipse 45% 45% at 14% 72%, rgba(255, 215, 0, 0.08), transparent 60%)
          `,
        }}
      />

      {/* TOP NAVIGATION BAR */}
      <PublicNavbar />

      {/* HERO SECTION */}
      <header style={{ position: 'relative', zIndex: 10, padding: '44px 24px 44px', textAlign: 'center', overflow: 'hidden' }}>
        {/* Dedicated Hero Theme-Matched Background Video */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/assets/cosmic-bg.jpg"
            className="elzora-hero-bg-video"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.56,
              filter: 'saturate(1.2) contrast(1.06)',
            }}
          >
            <source src="/assets/cosmic-bg.webm" type="video/webm" />
          </video>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(5, 6, 17, 0.35) 0%, rgba(5, 6, 17, 0.48) 65%, #050611 100%)',
            }}
          />
        </div>
        <FloatingParticles />
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          {/* Status Pill */}
          <div className="elzora-pill-violet" style={{ marginBottom: 16, boxShadow: '0 6px 24px rgba(139, 92, 246, 0.24)' }}>
            <Sparkles size={16} color="#ffd700" />
            <span>100% NON-CUSTODIAL BINARY MATRIX & SMART CLUB PROTOCOL</span>
          </div>

          {/* Animated 3D Golden Logo (Centered & Proportional) */}
          <div className="elzora-hero-logo-container">
            <div className="elzora-hero-logo-wrap">
              <img
                src="/logo.png"
                alt="ELZORA"
                className="elzora-hero-logo"
              />
            </div>
          </div>

          {/* Main Headline */}
          <h1
            className="elzora-hero-title"
            style={{
              fontSize: 'clamp(2.1rem, 4.6vw, 3.6rem)',
              lineHeight: 1.13,
              letterSpacing: '-0.025em',
              margin: '0 0 14px',
            }}
          >
            Autonomous Decentralized Binary Matrix & Perpetual Global Club
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1.08rem',
              color: '#94a3b8',
              lineHeight: 1.62,
              maxWidth: 740,
              margin: '0 auto 24px',
            }}
          >
            Join ELZORA with <strong style={{ color: '#f8fafc' }}>$50 USDT</strong> on BNB Smart Chain. 100% of registration fees are mathematically routed in real-time across 8 transparent income streams with automated cascading upgrades, a perpetual $25 Single Leg Global Club, and zero admin delays.
          </p>

          {/* CTA Buttons */}
          <div className="landing-hero-actions" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={handleAction}
              className="elzora-shimmer-btn"
              style={{
                padding: '16px 34px',
                borderRadius: 15,
                border: '1px solid rgba(192, 132, 252, 0.5)',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1.02rem',
                cursor: 'pointer',
                boxShadow: '0 14px 34px -8px rgba(139, 92, 246, 0.65)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span>{isRegistered ? 'Launch Dashboard' : 'Join ELZORA ($50 USDT)'}</span>
              <ArrowRight size={20} />
            </button>

            <a
              href="#plan"
              className="elzora-shimmer-btn"
              style={{
                padding: '16px 28px',
                borderRadius: 15,
                background: 'rgba(16, 19, 38, 0.85)',
                border: '1px solid rgba(139, 92, 246, 0.38)',
                color: '#f8fafc',
                fontWeight: 800,
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backdropFilter: 'blur(14px)',
              }}
            >
              <span>Explore The 8 Incomes</span>
              <ChevronRight size={18} color="#c084fc" />
            </a>

            <Link
              to="/ai/plan-explainer"
              className="elzora-shimmer-btn"
              style={{
                padding: '16px 26px',
                borderRadius: 15,
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.14), rgba(139, 92, 246, 0.16))',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                color: '#ffd700',
                fontWeight: 800,
                fontSize: '0.98rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backdropFilter: 'blur(14px)',
              }}
            >
              <Volume2 size={18} />
              <span>Voice AI Plan Explainer</span>
            </Link>
          </div>

          {/* 4 PRIMARY PROTOCOL METRIC CARDS */}
          <RevealOnScroll delay={100}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginTop: 36,
                textAlign: 'center',
              }}
            >
              <div className="elzora-glass elzora-glass-hover" style={{ padding: '22px 16px', borderColor: 'rgba(192, 132, 252, 0.3)' }}>
                <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#c084fc' }}>100%</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>Mathematical Allocation</div>
              </div>

              <div className="elzora-glass elzora-glass-hover" style={{ padding: '22px 16px', borderColor: 'rgba(139, 92, 246, 0.35)' }}>
                <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#a855f7' }}>8 Incomes</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>Comprehensive Financial Channels</div>
              </div>

              <div className="elzora-glass elzora-glass-hover" style={{ padding: '22px 16px', borderColor: 'rgba(255, 215, 0, 0.3)' }}>
                <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#ffd700' }}>8 Ranks</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>Starter up to Legend</div>
              </div>

              <div className="elzora-glass elzora-glass-hover" style={{ padding: '22px 16px', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#38bdf8' }}>$25 Queue</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>Perpetual Global Club Re-entry</div>
              </div>
            </div>
          </RevealOnScroll>

        </div>
      </header>

      {/* SECTION 1: THE $50 MEMBERSHIP ALLOCATION (100% SOLVENCY) */}
      <section id="plan" style={{ position: 'relative', zIndex: 10, padding: '70px 24px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ color: '#c084fc', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Zero Inflation • Pure Solvency
          </div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            $50 Membership: Exact 100% USDT Allocation
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 680, margin: '0 auto', fontSize: '1rem' }}>
            Every cent of the $50 registration fee is distributed across the protocol in the exact same transaction block. Zero unbacked liabilities.
          </p>
        </div>

        {/* Visual Allocation Ribbon */}
        <RevealOnScroll>
          <div
            className="elzora-glass elzora-glass-hover"
            style={{
              border: '1px solid rgba(192, 132, 252, 0.35)',
              borderRadius: 22,
              padding: 26,
              marginBottom: 40,
            }}
          >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
              Real-Time Protocol Allocation Matrix ($50 = 100%)
            </span>
            <span style={{ fontSize: '0.82rem', color: '#4ade80', fontWeight: 800 }}>
              Audit Verified: $50.00 Distributed (100.0%)
            </span>
          </div>

          <div style={{ height: 14, borderRadius: 8, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.05)', marginBottom: 16 }}>
            <div style={{ width: '20%', background: '#c084fc' }} title="Direct 20%" />
            <div style={{ width: '14%', background: '#38bdf8' }} title="Affiliate 14%" />
            <div style={{ width: '24%', background: '#a855f7' }} title="Club Matrix 24%" />
            <div style={{ width: '20%', background: '#4ade80' }} title="Matching 20%" />
            <div style={{ width: '6%', background: '#fbbf24' }} title="Champion 6%" />
            <div style={{ width: '6%', background: '#ec4899' }} title="Weekly 6%" />
            <div style={{ width: '10%', background: '#f97316' }} title="Lifetime 10%" />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c084fc' }} />
              Direct (20% - $10)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
              Affiliate (14% - $7)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />
              Club Matrix (24% - $12)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
              Matching (20% - $10)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
              Champion (6% - $3)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899' }} />
              Weekly (6% - $3)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />
              Lifetime (10% - $5)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
              Single Leg ($25 Autonomous Queue)
            </div>
          </div>
          </div>
        </RevealOnScroll>

        {/* 8 INCOMES CARDS GRID */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Comprehensive Compensation Channels
          </div>
          <h3 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
            8 Core Income Streams Breakdown
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Mathematically routed in real-time on BSC directly into member Web3 wallets
          </p>
        </div>

        <div id="streams" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {streams.map((stream, idx) => {
            const Icon = stream.icon
            return (
              <RevealOnScroll key={idx} delay={(idx % 4) * 70}>
                <div
                  className="elzora-glass elzora-glass-hover"
                  style={{
                    borderColor: `${stream.color}40`,
                    borderRadius: 22,
                    padding: 26,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div
                        className="elzora-icon-badge"
                        style={{
                          padding: 11,
                          background: `${stream.color}1a`,
                          borderColor: `${stream.color}44`,
                          color: stream.color,
                        }}
                      >
                        <Icon size={22} />
                      </div>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: stream.color,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: `${stream.color}14`,
                          border: `1px solid ${stream.color}33`,
                        }}
                      >
                        {stream.pct} Share
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.18rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 6px' }}>
                      {stream.title}
                    </h3>

                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stream.color, marginBottom: 10 }}>
                      {stream.amount} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>USDT</span>
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.62, margin: 0 }}>
                      {stream.desc}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            )
          })}
        </div>
      </section>

      {/* SECTION 2: 8 CLUB RANKS (STARTER TO LEGEND) */}
      <section id="ranks" style={{ position: 'relative', zIndex: 10, padding: '70px 24px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ color: '#c084fc', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Cascading Queue Progression
          </div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            The 8 Club Matrix Progression Ranks
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 680, margin: '0 auto', fontSize: '1rem' }}>
            Qualifying members advance through automatic 2-matrix queues where gross earnings fund package upgrades, direct sponsor bonuses, and exponential net profits.
          </p>
        </div>

        <RevealOnScroll>
          <div
            className="elzora-glass"
            style={{
              border: '1px solid rgba(192, 132, 252, 0.35)',
              borderRadius: 24,
              padding: 26,
              overflowX: 'auto',
            }}
          >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.35)', color: '#c084fc', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '14px 16px' }}>Rank</th>
                <th style={{ padding: '14px 16px' }}>Rank Name</th>
                <th style={{ padding: '14px 16px' }}>Matrix Team</th>
                <th style={{ padding: '14px 16px' }}>Gross Revenue</th>
                <th style={{ padding: '14px 16px' }}>Package Upgrade</th>
                <th style={{ padding: '14px 16px' }}>Sponsor Bonus</th>
                <th style={{ padding: '14px 16px' }}>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((r) => (
                <tr
                  key={r.rank}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.2s',
                  }}
                >
                  <td style={{ padding: '16px', fontWeight: 800, color: '#c084fc' }}>#{r.rank}</td>
                  <td style={{ padding: '16px', fontWeight: 900, color: '#f8fafc' }}>{r.name}</td>
                  <td style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>{r.members} Members</td>
                  <td style={{ padding: '16px', color: '#38bdf8', fontWeight: 800 }}>{r.gross}</td>
                  <td style={{ padding: '16px', color: '#f472b6', fontWeight: 600 }}>{r.upgrade}</td>
                  <td style={{ padding: '16px', color: '#fbbf24', fontWeight: 600 }}>{r.sponsor}</td>
                  <td style={{ padding: '16px', color: '#4ade80', fontWeight: 900, fontSize: '1.05rem' }}>{r.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </RevealOnScroll>
      </section>

      {/* SECTION 3: GLOBAL CLUB ($25 RE-ENTRY) */}
      <section id="globalclub" style={{ position: 'relative', zIndex: 10, padding: '70px 24px', maxWidth: 1240, margin: '0 auto' }}>
        <RevealOnScroll>
          <div
            className="elzora-glass"
            style={{
              border: '1px solid rgba(192, 132, 252, 0.38)',
              borderRadius: 28,
              padding: '52px 36px',
            }}
          >
            <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center', marginBottom: 40 }}>
              <div className="elzora-pill-violet" style={{ marginBottom: 14 }}>
                <RefreshCw size={14} /> AUTONOMOUS $25 CYCLING ALGORITHM
              </div>
              <h2 className="elzora-hero-title" style={{ fontSize: 'clamp(1.85rem, 3.8vw, 2.4rem)', margin: '0 0 14px' }}>
                Global Club Perpetual Re-entry Engine
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6 }}>
                An independent 1-to-2 automated queue: When 2 members join behind you in the global queue, you instantly receive a <strong style={{ color: '#f8fafc' }}>$25 payout (100% ROI)</strong> plus an <strong style={{ color: '#ffd700' }}>auto-funded re-entry spot</strong> at the end of the line.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 18, textAlign: 'center' }}>
              {[
                { cycle: 'CYCLE #1', entries: 'Entries #2 & #3 enter queue', reward: '→ Earn $25 + Re-entry #4 created!' },
                { cycle: 'CYCLE #2', entries: 'Entries #4 & #5 enter queue', reward: '→ Earn $25 + Re-entry #6 created!' },
                { cycle: 'CYCLE #3', entries: 'Entries #6 & #7 enter queue', reward: '→ Earn $25 + Re-entry #8 created!' },
                { cycle: 'CYCLE #4', entries: 'Entries #8 & #9 enter queue', reward: '→ Earn $25 + Re-entry #10 created!' },
              ].map((c, idx) => (
                <RevealOnScroll key={c.cycle} delay={idx * 70}>
                  <div
                    className="elzora-glass elzora-glass-hover"
                    style={{
                      padding: 24,
                      borderRadius: 20,
                      borderColor: 'rgba(192, 132, 252, 0.35)',
                      height: '100%',
                    }}
                  >
                    <div className="elzora-pill-gold" style={{ marginBottom: 10 }}>{c.cycle}</div>
                    <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>{c.entries}</div>
                    <div style={{ fontSize: '0.84rem', color: '#4ade80', fontWeight: 800, marginTop: 8 }}>{c.reward}</div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* SECTION 4: PROTOCOL ADVANTAGES & TRANSPARENCY */}
      <section id="security" style={{ position: 'relative', zIndex: 10, padding: '70px 24px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ color: '#c084fc', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Built for Longevity & Trust
          </div>
          <h2 className="elzora-hero-title" style={{ fontSize: 'clamp(1.85rem, 3.8vw, 2.4rem)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Why ELZORA Outperforms Traditional Matrices
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: 680, margin: '0 auto', fontSize: '1rem' }}>
            Pure algorithmic execution eliminating central custody, arbitrary withdrawal restrictions, and mathematical imbalance.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <RevealOnScroll delay={0}>
            <div className="elzora-glass elzora-glass-hover" style={{ borderColor: 'rgba(56, 189, 248, 0.35)', borderRadius: 22, padding: 28, height: '100%' }}>
              <div className="elzora-icon-badge" style={{ padding: 12, background: 'rgba(56, 189, 248, 0.16)', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8', marginBottom: 16 }}>
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>Non-Custodial Reserves</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>
                All member funds reside directly within the open-source smart contract vault. The protocol owner cannot confiscate or alter your earned balance.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={80}>
            <div className="elzora-glass elzora-glass-hover" style={{ borderColor: 'rgba(255, 215, 0, 0.35)', borderRadius: 22, padding: 28, height: '100%' }}>
              <div className="elzora-icon-badge" style={{ padding: 12, background: 'rgba(255, 215, 0, 0.14)', borderColor: 'rgba(255, 215, 0, 0.4)', color: '#ffd700', marginBottom: 16 }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>1-Click Instant Payouts</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>
                Zero withdrawal delays, zero manual claim wait windows. All commissions and rewards are transferred directly and instantly to your Web3 wallet upon generation.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={160}>
            <div className="elzora-glass elzora-glass-hover" style={{ borderColor: 'rgba(192, 132, 252, 0.35)', borderRadius: 22, padding: 28, height: '100%' }}>
              <div className="elzora-icon-badge" style={{ padding: 12, background: 'rgba(192, 132, 252, 0.16)', borderColor: 'rgba(192, 132, 252, 0.4)', color: '#c084fc', marginBottom: 16 }}>
                <GitCommit size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>Automated Dual-Leg Spillover</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>
                Smart placement resolution automatically locates the nearest vacant leaf on your chosen leg, maximizing team binary matching pairs.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(139, 92, 246, 0.2)', padding: '50px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 12 }}>
            <img
              src="/logo.png"
              alt="ELZORA"
              style={{
                height: 38,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 10px rgba(245, 158, 11, 0.35))',
              }}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 20 }}>
            Next-Generation Decentralized Binary Matrix & Smart Club Ecosystem • Powered by BNB Smart Chain
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: '0.82rem', fontWeight: 700, marginBottom: 24, flexWrap: 'wrap' }}>
            <Link to="/login" style={{ color: '#c084fc', textDecoration: 'none' }}>Member Login</Link>
            <Link to="/register" style={{ color: '#38bdf8', textDecoration: 'none' }}>Register ($50 USDT)</Link>
            <Link to="/lookup" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Public Account Explorer</Link>
            <a href="https://testnet.bscscan.com" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>BSC Testnet Explorer</a>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
            © 2026 ELZORA Protocol. All rights reserved.
          </div>
        </div>
      </footer>
    </PageTransitionShell>
  )
}

export default LandingPage
