import React, { useState } from 'react'
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
} from 'lucide-react'

export function IncomeHistoryPage() {
  const { address } = useWalletAuth()
  const { profile, incomeBreakdown, withdrawIncome, isRegistered } = useTetherStream()

  const [activeTab, setActiveTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [txMsg, setTxMsg] = useState(null)

  // Construct ledger of ELZORA 7 income streams
  const streams = [
    {
      id: 'DIRECT',
      category: 'DIRECT',
      title: 'Direct Referral Commission',
      amountUsd: Number(incomeBreakdown?.directIncome || 0),
      desc: '$10.00 (20%) per directly sponsored member',
      color: '#c084fc',
      status: 'On-Chain Allocated',
    },
    {
      id: 'AFFILIATE',
      category: 'AFFILIATE',
      title: '20-Level Affiliate Income',
      amountUsd: Number(incomeBreakdown?.affiliateIncome || 0),
      desc: '$0.40 L1-10 & $0.30 L11-20 network allocation',
      color: '#38bdf8',
      status: 'On-Chain Allocated',
    },
    {
      id: 'CLUB',
      category: 'CLUB',
      title: '8 Cascading Club Matrices',
      amountUsd: Number(incomeBreakdown?.clubIncome || 0),
      desc: 'Automatic queue payouts from Starter to Legend',
      color: '#a855f7',
      status: 'On-Chain Allocated',
    },
    {
      id: 'MATCHING',
      category: 'MATCHING',
      title: 'Binary Matching Pool',
      amountUsd: Number(incomeBreakdown?.matchingIncome || 0),
      desc: '$2.00 per 1:1 pair (1:2 or 2:1 first qualification)',
      color: '#4ade80',
      status: 'On-Chain Allocated',
    },
    {
      id: 'CHAMPION',
      category: 'CHAMPION',
      title: 'Champion Club (30 Directs)',
      amountUsd: Number(incomeBreakdown?.championIncome || 0),
      desc: '6% global company turnover royalty pool',
      color: '#fbbf24',
      status: 'On-Chain Allocated',
    },
    {
      id: 'WEEKLY',
      category: 'WEEKLY',
      title: 'Weekly Performance Pool',
      amountUsd: Number(incomeBreakdown?.weeklyIncome || 0),
      desc: '6% pool shared equally among top weekly performers',
      color: '#f43f5e',
      status: 'On-Chain Allocated',
    },
    {
      id: 'LIFETIME',
      category: 'LIFETIME',
      title: '27 Lifetime Milestone Rewards',
      amountUsd: Number(incomeBreakdown?.lifetimeIncome || 0),
      desc: 'Cumulative volume rewards from $15 up to $500,000',
      color: '#818cf8',
      status: 'On-Chain Allocated',
    },
    {
      id: 'GLOBAL_CLUB',
      category: 'GLOBAL_CLUB',
      title: 'Global Club ($25 Queue)',
      amountUsd: Number(incomeBreakdown?.globalClubIncome || 0),
      desc: '1-to-2 cycling matrix ($25 payout + auto re-entry)',
      color: '#06b6d4',
      status: 'On-Chain Allocated',
    },
  ]

  const filteredLogs = streams.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.desc.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === 'DIRECT') return matchesSearch && log.category === 'DIRECT'
    if (activeTab === 'AFFILIATE') return matchesSearch && log.category === 'AFFILIATE'
    if (activeTab === 'MATCHING') return matchesSearch && log.category === 'MATCHING'
    if (activeTab === 'CLUB') return matchesSearch && (log.category === 'CLUB' || log.category === 'GLOBAL_CLUB')
    return matchesSearch
  })

  const handleWithdraw = async () => {
    if (Number(profile?.withdrawableBalance || 0) <= 0) return
    setWithdrawing(true)
    setTxMsg(null)
    try {
      const tx = await withdrawIncome()
      setTxMsg({ success: true, text: `Withdrawal submitted! Tx: ${tx?.hash?.slice(0, 10)}...` })
    } catch (err) {
      setTxMsg({ success: false, text: err?.shortMessage || err?.message || 'Withdrawal failed' })
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <MemberLayout pageTitle="ELZORA Income Streams & Payout Ledger">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* BANNER */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: 32,
            borderRadius: 24,
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 21, 54, 0.9) 0%, rgba(11, 15, 36, 0.98) 100%)',
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
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: 'var(--purple-light)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> ON-CHAIN 7-STREAM FINANCIAL RECORD
              </div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
                Income Streams & Ledger
              </h1>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
                Real-time tracking of Direct, 20-Level Affiliate, Club Matrix, Binary Matching, Champion, and Global Club rewards.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px 22px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block' }}>Total Lifetime Earned</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ade80' }}>
                  ${Number(profile?.totalIncomeEarned || 0).toFixed(2)} USDT
                </span>
              </div>

              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '14px 22px', borderRadius: 16, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--purple-light)', display: 'block' }}>Withdrawable Balance</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>
                  ${Number(profile?.withdrawableBalance || 0).toFixed(2)} USDT
                </span>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={withdrawing || Number(profile?.withdrawableBalance || 0) <= 0}
                className="btn btn-primary"
                style={{
                  padding: '14px 24px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Wallet size={18} />
                <span>{withdrawing ? 'Withdrawing...' : 'Withdraw to Wallet'}</span>
              </button>
            </div>
          </div>

          {txMsg && (
            <div
              style={{
                marginTop: 16,
                padding: '12px 18px',
                borderRadius: 12,
                fontSize: '0.86rem',
                fontWeight: 700,
                background: txMsg.success ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: txMsg.success ? '#4ade80' : '#f87171',
                border: `1px solid ${txMsg.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {txMsg.text}
            </div>
          )}
        </div>

        {/* FILTERS */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            borderRadius: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            background: 'rgba(11, 15, 36, 0.85)',
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Streams' },
              { id: 'DIRECT', label: 'Direct (20%)' },
              { id: 'AFFILIATE', label: '20-Level Affiliate' },
              { id: 'MATCHING', label: 'Binary Matching' },
              { id: 'CLUB', label: 'Clubs & Global' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 12,
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === tab.id ? '#fff' : 'var(--muted)',
                  border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="text"
              placeholder="Search income stream..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '9px 38px 9px 14px',
                borderRadius: 12,
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: 800 }}>INCOME STREAM</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: 800 }}>DISTRIBUTION FORMULA</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: 800 }}>TOTAL ACCRUED</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: 800, textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '18px', fontWeight: 800, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: log.color }} />
                        <span>{log.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {log.desc}
                    </td>
                    <td style={{ padding: '18px', fontWeight: 900, color: log.amountUsd > 0 ? '#4ade80' : '#fff', fontSize: '1rem' }}>
                      ${log.amountUsd.toFixed(2)} USDT
                    </td>
                    <td style={{ padding: '18px', textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '5px 14px',
                          borderRadius: 20,
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          background: 'rgba(139, 92, 246, 0.12)',
                          color: 'var(--purple-light)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                        }}
                      >
                        {log.status}
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
