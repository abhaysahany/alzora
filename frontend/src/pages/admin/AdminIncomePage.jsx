import React, { useState, useMemo } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { useAdminMembers } from '../../hooks/useAdminMembers'
import { useIncomeLedger } from '../../hooks/useIncomeLedger'
import {
  BadgeDollarSign,
  Search,
  ExternalLink,
  Users,
  Layers,
  Crown,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  Filter,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Split,
  Award,
  Zap,
} from 'lucide-react'

export function AdminIncomePage() {
  const { address } = useWalletAuth()
  const { members, stats: memberStats, loading: membersLoading, refresh: refreshMembers } = useAdminMembers()
  const { adminGlobalIncomeEntries } = useIncomeLedger()

  const [activeTab, setActiveTab] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedKey, setCopiedKey] = useState(null)

  const handleCopy = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // 7 Financial Streams Architecture Spec
  const STREAMS_CONFIG = [
    { id: 1, name: 'Direct Sponsor Commission', pct: '20.0%', amount: '$10.00', poolTotal: '20%', desc: 'Instant $10 payment to direct sponsor per $50 package', color: '#c084fc' },
    { id: 2, name: '20-Level Affiliate Network', pct: '14.0%', amount: '$7.00', poolTotal: '14%', desc: '$0.40 L1-10 & $0.30 L11-20 across 20 upline levels', color: '#38bdf8' },
    { id: 3, name: '8 Cascading Club Matrices', pct: '24.0%', amount: '$12.00', poolTotal: '24%', desc: 'Starter up to Legend automated queue rank upgrades', color: '#a855f7' },
    { id: 4, name: 'Binary Matching Pool', pct: '20.0%', amount: '$10.00', poolTotal: '20%', desc: '$2.00 per 1:1 pair match (2:1 or 1:2 first pair)', color: '#4ade80' },
    { id: 5, name: 'Champion Club Royalty Pool', pct: '6.0%', amount: '$3.00', poolTotal: '6%', desc: '6% company turnover shared among 30+ direct qualifiers', color: '#fbbf24' },
    { id: 6, name: 'Weekly Performance Pool', pct: '6.0%', amount: '$3.00', poolTotal: '6%', desc: '6% pool shared equally among top weekly sponsors', color: '#f43f5e' },
    { id: 7, name: '27 Lifetime Milestones', pct: '10.0%', amount: '$5.00', poolTotal: '10%', desc: 'Cumulative binary volume rewards from $15 to $500,000', color: '#818cf8' },
  ]

  // Filtered income logs
  const filteredEntries = useMemo(() => {
    return adminGlobalIncomeEntries.filter((item) => {
      const matchSearch =
        item.wallet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.stream?.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchSearch) return false

      if (activeTab === 'DIRECT') return item.category === 'DIRECT_BONUS'
      if (activeTab === 'AFFILIATE') return item.category === 'AFFILIATE_LEVEL'
      if (activeTab === 'MATCHING') return item.category === 'BINARY_MATCHING'
      if (activeTab === 'CLUB') return item.category === 'CLUB_MATRIX' || item.category === 'GLOBAL_CLUB'
      if (activeTab === 'CHAMPION') return item.category === 'CHAMPION_ROYALTY'

      return true
    })
  }, [adminGlobalIncomeEntries, activeTab, searchTerm])

  const totalDisbursed = members.reduce((sum, m) => sum + (m.totalIncome || 0), 0)

  return (
    <AdminLayout pageTitle="ELZORA 7 Streams Distribution Ledger">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* BANNER */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: 30,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(16, 21, 54, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
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
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: 'var(--purple-light)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> 100% SMART CONTRACT FINANCIAL DISTRIBUTION
              </div>
              <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900, color: '#fff' }}>
                7-Stream Income & Commission Ledger
              </h2>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
                Comprehensive tracking of all 7 financial streams allocated directly on-chain into user balances.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px 22px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block' }}>Total Protocol Disbursed</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ade80' }}>
                ${totalDisbursed.toFixed(2)} USDT
              </span>
            </div>
          </div>
        </div>

        {/* 7 STREAMS ARCHITECTURE CARDS */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>
            ELZORA Mathematical Distribution Architecture ($50 Package)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                  <th style={{ padding: '12px 16px' }}>STREAM NAME</th>
                  <th style={{ padding: '12px 16px' }}>PERCENTAGE</th>
                  <th style={{ padding: '12px 16px' }}>ALLOCATION</th>
                  <th style={{ padding: '12px 16px' }}>DISTRIBUTION MECHANISM</th>
                </tr>
              </thead>
              <tbody>
                {STREAMS_CONFIG.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 900, color: s.color }}>
                      {s.pct}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 900, color: '#4ade80' }}>
                      {s.amount} USDT
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: '0.84rem' }}>
                      {s.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
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
              { id: 'DIRECT', label: 'Direct ($10)' },
              { id: 'AFFILIATE', label: '20-Level ($7)' },
              { id: 'MATCHING', label: 'Matching ($2/pr)' },
              { id: 'CLUB', label: 'Clubs ($12)' },
              { id: 'CHAMPION', label: 'Champion (6%)' },
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
              placeholder="Search member or stream..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
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

        {/* DISTRIBUTED INCOME RECORDS TABLE */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
          {filteredEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              No income entries match the selected filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                    <th style={{ padding: '12px 16px' }}>RECIPIENT MEMBER</th>
                    <th style={{ padding: '12px 16px' }}>STREAM CATEGORY</th>
                    <th style={{ padding: '12px 16px' }}>PAYOUT DETAILS</th>
                    <th style={{ padding: '12px 16px' }}>USDT AMOUNT</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 800, color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{log.member}</span>
                          <button
                            onClick={() => handleCopy(log.wallet, log.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                          >
                            {copiedKey === log.id ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            background: `${log.color}15`,
                            color: log.color,
                          }}
                        >
                          {log.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--muted)', fontSize: '0.84rem' }}>
                        {log.title}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 900, color: '#4ade80', fontSize: '0.98rem' }}>
                        +${Number(log.amountUsd).toFixed(2)} USDT
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: 20,
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            background: 'rgba(74, 222, 128, 0.12)',
                            color: '#4ade80',
                            border: '1px solid rgba(74, 222, 128, 0.25)',
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
          )}
        </div>

      </div>
    </AdminLayout>
  )
}

export default AdminIncomePage
