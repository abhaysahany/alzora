import React, { useState } from 'react'
import { MemberLayout } from '../components/MemberLayout'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  History,
  ArrowUpRight,
  Zap,
  Award,
  DollarSign,
  Filter,
  Layers,
  CheckCircle2,
  Sparkles,
  Wallet,
  ShieldCheck,
  Split,
  Search,
  RefreshCw,
  Gift,
  Coins,
} from 'lucide-react'

export function HistoryPage() {
  const { profile, incomeBreakdown, isRegistered, globalClub } = useTetherStream()
  const [filterType, setFilterType] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const historyData = []

  // 1. $50 Package Registration Event
  if (isRegistered || profile?.isRegistered) {
    historyData.push({
      id: 'reg-event',
      type: 'REGISTRATION',
      title: 'ELZORA Core Membership Package ($50)',
      amount: '-$50.00 USDT',
      status: 'Confirmed On-Chain',
      date: 'Registration Complete',
      color: '#8b5cf6',
      icon: DollarSign,
    })
  }

  // 2. Direct Referral Bonus
  if (Number(incomeBreakdown?.directIncome || 0) > 0) {
    historyData.push({
      id: 'direct-income',
      type: 'INCOME',
      title: 'Direct Referral Commission (20%)',
      amount: `+$${Number(incomeBreakdown.directIncome).toFixed(2)} USDT`,
      status: 'On-Chain Allocated',
      date: `${profile?.directCount || 0} direct sponsors ($10/sponsor)`,
      color: '#c084fc',
      icon: ArrowUpRight,
    })
  }

  // 3. 20-Level Affiliate Bonus
  if (Number(incomeBreakdown?.affiliateIncome || 0) > 0) {
    historyData.push({
      id: 'affiliate-income',
      type: 'INCOME',
      title: '20-Level Network Affiliate Pool',
      amount: `+$${Number(incomeBreakdown.affiliateIncome).toFixed(2)} USDT`,
      status: 'On-Chain Allocated',
      date: 'Distributed across 20 upline genealogy levels',
      color: '#38bdf8',
      icon: Layers,
    })
  }

  // 4. Binary Matching Pool
  if (Number(incomeBreakdown?.matchingIncome || 0) > 0) {
    historyData.push({
      id: 'matching-income',
      type: 'INCOME',
      title: 'Binary Matching Pool ($2/pair)',
      amount: `+$${Number(incomeBreakdown.matchingIncome).toFixed(2)} USDT`,
      status: 'On-Chain Allocated',
      date: `${(profile?.leftTeamCount || 0) + (profile?.rightTeamCount || 0)} binary tree members`,
      color: '#4ade80',
      icon: Split,
    })
  }

  // 5. Club Matrix Payouts
  if (Number(incomeBreakdown?.clubIncome || 0) > 0) {
    historyData.push({
      id: 'club-income',
      type: 'INCOME',
      title: `8 Club Matrix Rewards (${profile?.rankName || 'Starter'})`,
      amount: `+$${Number(incomeBreakdown.clubIncome).toFixed(2)} USDT`,
      status: 'On-Chain Allocated',
      date: 'Automated Queue Payout',
      color: '#a855f7',
      icon: Award,
    })
  }

  // 6. Champion Club Royalty
  if (Number(incomeBreakdown?.championIncome || 0) > 0) {
    historyData.push({
      id: 'champion-income',
      type: 'INCOME',
      title: 'Champion Club (6% Company Turnover Royalty)',
      amount: `+$${Number(incomeBreakdown.championIncome).toFixed(2)} USDT`,
      status: 'On-Chain Allocated',
      date: '30 Direct Sponsoring Milestone Qualifier',
      color: '#fbbf24',
      icon: Sparkles,
    })
  }

  // 7. Weekly Performance Pool
  if (Number(incomeBreakdown?.weeklyIncome || 0) > 0) {
    historyData.push({
      id: 'weekly-income',
      type: 'INCOME',
      title: 'Weekly Performance Pool (6%)',
      amount: `+$${Number(incomeBreakdown.weeklyIncome).toFixed(2)} USDT`,
      status: 'On-Chain Allocated',
      date: 'Weekly direct sponsor threshold dividend',
      color: '#ec4899',
      icon: Gift,
    })
  }

  // 8. Lifetime Milestones
  if (Number(incomeBreakdown?.lifetimeIncome || 0) > 0) {
    historyData.push({
      id: 'lifetime-income',
      type: 'INCOME',
      title: '27 Lifetime Milestone Rewards (10%)',
      amount: `+$${Number(incomeBreakdown.lifetimeIncome).toFixed(2)} USDT`,
      status: 'On-Chain Allocated',
      date: `${profile?.completedLifetimeMilestones || 0} milestones unlocked`,
      color: '#f97316',
      icon: Zap,
    })
  }

  // 9. Single Leg / Global Club Cycles
  if (Number(incomeBreakdown?.globalClubIncome || 0) > 0 || (globalClub?.cyclesCompleted || 0) > 0) {
    historyData.push({
      id: 'global-club-event',
      type: 'GLOBAL_CLUB',
      title: 'Single Leg / Global 1-to-2 Queue Cycles',
      amount: `+$${Number(incomeBreakdown?.globalClubIncome || 0).toFixed(2)} USDT`,
      status: 'Instant Wallet Transferred',
      date: `${globalClub?.cyclesCompleted || 0} cycles completed ($25/cycle)`,
      color: '#818cf8',
      icon: RefreshCw,
    })
  }

  const filteredData = historyData.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterType === 'ALL') return matchesSearch
    return matchesSearch && item.type === filterType
  })

  return (
    <MemberLayout pageTitle="Transaction History">
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* BANNER */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 20,
            border: '1px solid rgba(139, 92, 246, 0.4)',
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.95) 0%, rgba(10, 14, 38, 0.98) 100%)',
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
                <Sparkles size={13} /> ON-CHAIN ACTIVITY AUDIT LOG
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Transaction & Ledger History
              </h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.84rem' }}>
                Complete immutable record of membership activation, earnings credits, and instant wallet transfers.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(6, 8, 20, 0.8)', padding: '10px 16px', borderRadius: 14, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>TOTAL EARNED</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#4ade80' }}>${Number(profile?.totalIncomeEarned || 0).toFixed(2)} USDT</span>
              </div>
              <div style={{ background: 'rgba(6, 8, 20, 0.8)', padding: '10px 16px', borderRadius: 14, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>PAYOUT MODE</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8' }}>100% Instant</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div
          style={{
            padding: 22,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Activity' },
                { id: 'INCOME', label: 'Income Allocations' },
                { id: 'WITHDRAWAL', label: 'Withdrawals' },
                { id: 'GLOBAL_CLUB', label: 'Global Club' },
                { id: 'REGISTRATION', label: 'Package Activation' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  style={{
                    background: filterType === tab.id ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
                    color: filterType === tab.id ? '#fff' : '#94a3b8',
                    border: filterType === tab.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    padding: '8px 18px',
                    borderRadius: 12,
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  borderRadius: 12,
                  background: 'rgba(6, 8, 20, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* TRANSACTIONS TIMELINE LIST */}
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          {filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <History size={40} style={{ color: 'rgba(139, 92, 246, 0.4)', marginBottom: 10 }} />
              <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>No Transaction Records Found</div>
              <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
                Your package registration, referral bonuses, and payout logs will automatically appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredData.map((item) => {
                const Icon = item.icon
                const isDebit = item.amount.startsWith('-')
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.06)',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: `${item.color}15`,
                          border: `1px solid ${item.color}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: item.color,
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>
                          {item.date}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 900,
                          color: isDebit ? '#f87171' : '#4ade80',
                        }}
                      >
                        {item.amount}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </MemberLayout>
  )
}

export default HistoryPage
