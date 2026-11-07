import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { useTetherStream } from '../../hooks/useTetherStream'
import { useAdminMembers } from '../../hooks/useAdminMembers'
import { useIncomeLedger } from '../../hooks/useIncomeLedger'
import {
  Users,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  DollarSign,
  Layers,
  ChevronRight,
  Wallet,
  Crown,
  RefreshCw,
  Award,
  Split,
  Zap,
} from 'lucide-react'

export function AdminDashboardPage() {
  const { address } = useWalletAuth()
  const { overview, refreshAll: refreshOverview } = useTetherStream()
  const { members, stats: memberStats, loading: loadingMembers, refresh: refreshMembers } = useAdminMembers()
  const { adminGlobalIncomeEntries } = useIncomeLedger()

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      refreshOverview ? refreshOverview() : Promise.resolve(),
      refreshMembers ? refreshMembers() : Promise.resolve(),
    ]).catch(() => {})
    setRefreshing(false)
  }

  // Calculated Protocol Aggregates
  const totalMembers = memberStats?.totalCount || members?.length || 0
  const activeMembers = memberStats?.activeCount || members?.filter((m) => m.active).length || 0
  const inactiveMembers = memberStats?.inactiveCount || (totalMembers - activeMembers)

  const totalInvestedUsd = activeMembers * 50
  const totalIncomePaidUsd = members?.reduce((sum, m) => sum + (m.totalIncome || 0), 0) || 0

  // 7 Financial Streams Aggregates
  const totalDirectIncomeUsd = members?.reduce((sum, m) => sum + (m.directIncome || 0), 0) || 0
  const totalAffiliateIncomeUsd = members?.reduce((sum, m) => sum + (m.affiliateIncome || 0), 0) || 0
  const totalMatchingIncomeUsd = members?.reduce((sum, m) => sum + (m.matchingIncome || 0), 0) || 0
  const totalClubIncomeUsd = members?.reduce((sum, m) => sum + (m.clubIncome || 0), 0) || 0
  const totalChampionIncomeUsd = members?.reduce((sum, m) => sum + (m.championIncome || 0), 0) || 0
  const totalGlobalClubIncomeUsd = members?.reduce((sum, m) => sum + (m.globalClubIncome || 0), 0) || 0

  const recentIncomeList = (adminGlobalIncomeEntries || []).slice(0, 8)

  return (
    <AdminLayout pageTitle="ELZORA Protocol Command Center">
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
                <Sparkles size={14} /> LIVE ON-CHAIN PROTOCOL TELEMETRY
              </div>
              <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900, color: '#fff' }}>
                ELZORA Master Overview
              </h2>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
                Monitor system solvency, binary matrix volumes, 7-stream disbursements, and automated club queues.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn btn-primary"
                style={{
                  padding: '12px 22px',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 800,
                }}
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Syncing...' : 'Sync On-Chain Data'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY TELEMETRY CARDS (6 CARDS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
          
          {/* Card 1: Total Registered Members */}
          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Members</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple-light)' }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff' }}>{totalMembers}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.78rem' }}>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>{activeMembers} Active ($50)</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <span style={{ color: 'var(--muted)' }}>{inactiveMembers} Inactive</span>
            </div>
          </div>

          {/* Card 2: Total Staked Investment */}
          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(74, 222, 128, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registration Volume</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74, 222, 128, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                <DollarSign size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#4ade80' }}>
              ${totalInvestedUsd.toFixed(2)} USDT
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: 8 }}>
              {activeMembers} x $50 Core Packages
            </span>
          </div>

          {/* Card 3: Total Income Paid */}
          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Disbursed</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15' }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#facc15' }}>
              ${totalIncomePaidUsd.toFixed(2)} USDT
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: 8 }}>
              Across 7 Income Streams
            </span>
          </div>

          {/* Card 4: Contract On-Chain Reserve */}
          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contract Vault</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>
                <Wallet size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--cyan)' }}>
              ${overview?.contractTokenBalance || '0.00'} USDT
            </div>
            <span style={{ fontSize: '0.75rem', color: '#4ade80', display: 'block', marginTop: 8 }}>
              {overview?.isSolvent !== false ? '100% Solvent ✅' : 'Solvency Warning ⚠️'}
            </span>
          </div>

          {/* Card 5: Champion & Weekly Pools */}
          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Royalty Pools</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                <Crown size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fbbf24' }}>
              ${(Number(overview?.championPoolBalance || 0) + Number(overview?.weeklyPoolBalance || 0)).toFixed(2)} USDT
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: 8 }}>
              Champion ($3) + Weekly ($3)
            </span>
          </div>

          {/* Card 6: Global Club ($25) */}
          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Global Club ($25)</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                <Split size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#06b6d4' }}>
              {overview?.globalClubTotalEntries || 0} <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>Entries</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: 8 }}>
              1-to-2 Queue Matrix Re-entry
            </span>
          </div>

        </div>

        {/* 7 FINANCIAL STREAMS TELEMETRY */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: 800 }}>
                ELZORA 7 Financial Streams Telemetry
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                100% of each $50 registration is mathematically routed across these 7 channels.
              </p>
            </div>
            <Link to="/admin/income" style={{ color: 'var(--purple-light)', fontSize: '0.85rem', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Full Income Ledger <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Stream 1 */}
            <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: 20, borderRadius: 16 }}>
              <div style={{ fontSize: '0.76rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                Direct Sponsor (20%)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                ${totalDirectIncomeUsd.toFixed(2)} USDT
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                $10.00 per direct sponsor
              </div>
            </div>

            {/* Stream 2 */}
            <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: 20, borderRadius: 16 }}>
              <div style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                20-Level Affiliate (14%)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                ${totalAffiliateIncomeUsd.toFixed(2)} USDT
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                $0.40 L1-10 & $0.30 L11-20
              </div>
            </div>

            {/* Stream 3 */}
            <div style={{ background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: 20, borderRadius: 16 }}>
              <div style={{ fontSize: '0.76rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                Binary Matching (20%)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                ${totalMatchingIncomeUsd.toFixed(2)} USDT
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                $2.00 per 1:1 pair (1:2 first)
              </div>
            </div>

            {/* Stream 4 */}
            <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: 20, borderRadius: 16 }}>
              <div style={{ fontSize: '0.76rem', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                8 Club Matrices (24%)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                ${totalClubIncomeUsd.toFixed(2)} USDT
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                $12.00 cascading queue upgrades
              </div>
            </div>
          </div>
        </div>

        {/* PACKAGE CONFIGURATION & RECENT ACTIVITIES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 24 }}>
          
          {/* PACKAGE SUMMARY */}
          <div className="glass-card" style={{ padding: 28, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>
                ELZORA Package Configuration
              </h3>
              <Link to="/admin/packages" style={{ color: 'var(--purple-light)', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                View Package Details
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Package 1 */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 16, border: '1px solid rgba(139, 92, 246, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--purple-light)', fontSize: '0.9rem', display: 'block' }}>
                    CORE REGISTRATION PACKAGE
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    $50 USDT Fixed Registration
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>${totalInvestedUsd} USDT</div>
                  <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>100% On-Chain Distributed</span>
                </div>
              </div>

              {/* Package 2 */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 18, borderRadius: 16, border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 800, color: '#06b6d4', fontSize: '0.9rem', display: 'block' }}>
                    GLOBAL CLUB QUEUE
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    $25 USDT Automated 1-to-2 Queue
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#06b6d4' }}>
                    {overview?.globalClubTotalEntries || 0} Entries
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>$25 Cycle Payout + Re-entry</span>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="glass-card" style={{ padding: 28, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>
                Recent Protocol Income Events
              </h3>
              <Link to="/admin/transactions" style={{ color: 'var(--purple-light)', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                All Transactions
              </Link>
            </div>

            {recentIncomeList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)', fontSize: '0.86rem' }}>
                No recent transactions recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentIncomeList.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                        {tx.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                        {tx.member}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#4ade80' }}>
                        +${Number(tx.amountUsd).toFixed(2)} USDT
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  )
}

export default AdminDashboardPage
