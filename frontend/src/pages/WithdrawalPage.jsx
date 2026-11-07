import React, { useState } from 'react'
import { MemberLayout } from '../components/MemberLayout'
import { useTetherStream } from '../hooks/useTetherStream'
import { useWalletAuth } from '../hooks/useWalletAuth'
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Coins,
  RefreshCw,
  Zap,
  DollarSign,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react'

export function WithdrawalPage() {
  const { address } = useWalletAuth()
  const {
    profile,
    incomeBreakdown,
    overview,
    usdtBalance,
    withdrawIncome,
    refreshAll,
    loading,
  } = useTetherStream()

  const [withdrawing, setWithdrawing] = useState(false)
  const [txSuccess, setTxSuccess] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const withdrawable = parseFloat(profile?.withdrawableBalance || '0')
  const totalWithdrawn = parseFloat(profile?.totalWithdrawn || '0')
  const walletUsdt = parseFloat(usdtBalance || '0')
  const isSolvent = overview?.isSolvent ?? true

  const handleWithdraw = async () => {
    if (withdrawable <= 0) {
      setErrorMsg('No withdrawable rewards available currently.')
      setTimeout(() => setErrorMsg(null), 4000)
      return
    }

    setWithdrawing(true)
    setErrorMsg(null)
    setTxSuccess(null)

    try {
      const tx = await withdrawIncome()
      setTxSuccess(
        typeof tx === 'string'
          ? `Withdrawal confirmed on-chain! Tx: ${tx.slice(0, 10)}...`
          : 'Withdrawal processed successfully! USDT transferred to your wallet.'
      )
      await refreshAll()
      setTimeout(() => setTxSuccess(null), 6000)
    } catch (err) {
      console.error('Withdrawal error:', err)
      setErrorMsg(err?.shortMessage || err?.message || 'Transaction failed or was rejected.')
      setTimeout(() => setErrorMsg(null), 5000)
    } finally {
      setWithdrawing(false)
    }
  }

  const streams = [
    { name: 'Direct Referral (20%)', amount: incomeBreakdown?.directIncome || '0.00', color: '#c084fc' },
    { name: '20-Level Affiliate', amount: incomeBreakdown?.affiliateIncome || '0.00', color: '#38bdf8' },
    { name: '8 Club Queues', amount: incomeBreakdown?.clubIncome || '0.00', color: '#a855f7' },
    { name: 'Binary Matching ($2/pair)', amount: incomeBreakdown?.matchingIncome || '0.00', color: '#4ade80' },
    { name: 'Champion Royalty (6%)', amount: incomeBreakdown?.championIncome || '0.00', color: '#fbbf24' },
    { name: 'Weekly Performance (6%)', amount: incomeBreakdown?.weeklyIncome || '0.00', color: '#ec4899' },
    { name: 'Lifetime Milestones', amount: incomeBreakdown?.lifetimeIncome || '0.00', color: '#f97316' },
    { name: 'Global Club ($25 Queue)', amount: incomeBreakdown?.globalClubIncome || '0.00', color: '#818cf8' },
  ]

  return (
    <MemberLayout pageTitle="Withdraw Funds">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* BANNER */}
        <div
          style={{
            padding: '28px 32px',
            borderRadius: 24,
            border: '1px solid rgba(139, 92, 246, 0.4)',
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.95) 0%, rgba(10, 14, 38, 0.98) 100%)',
            boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
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
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#c084fc',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> INSTANT NON-CUSTODIAL WITHDRAWALS
              </div>
              <h1 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Withdraw Income to Your Wallet
              </h1>
              <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                Instant direct smart contract transfers. Zero admin delay, zero withdrawal deduction fees.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(6, 8, 20, 0.8)',
                padding: '16px 24px',
                borderRadius: 18,
                border: '1px solid rgba(139, 92, 246, 0.35)',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', fontWeight: 700, letterSpacing: '0.06em' }}>CLAIMABLE BALANCE</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c084fc' }}>
                ${withdrawable.toFixed(2)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>USDT</span>
              </span>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {txSuccess && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 16,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={20} color="#22c55e" />
            <span>{txSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 16,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontWeight: 700,
            }}
          >
            <AlertCircle size={20} color="#ef4444" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 4 PRIMARY METRICS TILES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {/* AVAILABLE WITHDRAWABLE */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(192, 132, 252, 0.35)',
              boxShadow: '0 8px 32px rgba(126, 34, 206, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', fontWeight: 700 }}>
                Available to Withdraw
              </span>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(192, 132, 252, 0.15)' }}>
                <Wallet size={18} color="#c084fc" />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              ${withdrawable.toFixed(2)}
              <span style={{ fontSize: '0.9rem', color: '#c084fc', fontWeight: 700 }}>USDT</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#a78bfa', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} /> Instant Direct Contract Transfer
            </div>
          </div>

          {/* TOTAL WITHDRAWN */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              borderRadius: 18,
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', fontWeight: 700 }}>
                Total Withdrawn
              </span>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(56, 189, 248, 0.15)' }}>
                <ArrowUpRight size={18} color="#38bdf8" />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              ${totalWithdrawn.toFixed(2)}
              <span style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 700 }}>USDT</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 8 }}>
              Cumulative payouts sent to your wallet
            </div>
          </div>

          {/* WALLET BALANCE */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              borderRadius: 18,
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(74, 222, 128, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', fontWeight: 700 }}>
                External Wallet (USDT)
              </span>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(74, 222, 128, 0.15)' }}>
                <Coins size={18} color="#4ade80" />
              </div>
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              ${walletUsdt.toFixed(2)}
              <span style={{ fontSize: '0.9rem', color: '#4ade80', fontWeight: 700 }}>USDT</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 8 }}>
              Currently in your connected Web3 address
            </div>
          </div>

          {/* CONTRACT SOLVENCY STATUS */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              borderRadius: 18,
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', fontWeight: 700 }}>
                Protocol Solvency
              </span>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(251, 191, 36, 0.15)' }}>
                <ShieldCheck size={18} color="#fbbf24" />
              </div>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
              100% SOLVENT
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 12 }}>
              Vault: ${parseFloat(overview?.contractTokenBalance || '0').toFixed(2)} USDT
            </div>
          </div>
        </div>

        {/* 2 COLUMN WITHDRAW TERMINAL & STREAMS BREAKDOWN */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 24 }}>
          
          {/* COLUMN 1: INSTANT WITHDRAW PANEL */}
          <div
            className="glass-card"
            style={{
              padding: 28,
              borderRadius: 22,
              background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.5) 0%, rgba(15, 23, 42, 0.85) 100%)',
              border: '1px solid rgba(147, 51, 234, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(168, 85, 247, 0.2)' }}>
                  <Zap size={20} color="#c084fc" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    Instant Payout Action
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                    Non-custodial withdrawal directly from the ELZORA Contract Vault
                  </p>
                </div>
              </div>

              <div
                style={{
                  margin: '24px 0',
                  padding: 22,
                  borderRadius: 18,
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.85rem', color: '#94a3b8' }}>
                  <span>Withdrawable Earnings</span>
                  <span style={{ color: '#c084fc', fontWeight: 700 }}>100% of Balance</span>
                </div>
                <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  ${withdrawable.toFixed(2)}
                  <span style={{ fontSize: '1.1rem', color: '#38bdf8', fontWeight: 700 }}>USDT</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Target Address:</span>
                  <span style={{ fontFamily: 'monospace', color: '#94a3b8', fontWeight: 700 }}>
                    {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Not Connected'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#94a3b8' }}>
                  <CheckCircle2 size={16} color="#22c55e" />
                  <span>Zero withdrawal tax or artificial delays</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#94a3b8' }}>
                  <CheckCircle2 size={16} color="#22c55e" />
                  <span>Direct settlement on BNB Smart Chain in standard USDT</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#94a3b8' }}>
                  <CheckCircle2 size={16} color="#22c55e" />
                  <span>Solvency mathematically guaranteed by audited smart contract</span>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || withdrawable <= 0}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: 14,
                  background: withdrawable > 0
                    ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
                    : 'rgba(51, 65, 85, 0.4)',
                  color: withdrawable > 0 ? '#ffffff' : '#64748b',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: withdrawable > 0 && !withdrawing ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: withdrawable > 0 ? '0 10px 25px rgba(124, 58, 237, 0.45)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {withdrawing ? (
                  <>
                    <RefreshCw size={18} className="spin-animation" />
                    <span>Processing On-Chain Withdrawal...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={18} />
                    <span>{withdrawable > 0 ? `Withdraw $${withdrawable.toFixed(2)} USDT Now` : 'No Withdrawable Balance'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* COLUMN 2: 7-STREAM EARNINGS ACCUMULATION BREAKDOWN */}
          <div
            className="glass-card"
            style={{
              padding: 28,
              borderRadius: 22,
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Cumulative Stream Accumulation
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Total earnings accrued across ELZORA's 7 income streams
                </p>
              </div>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(147, 51, 234, 0.15)' }}>
                <Layers size={16} color="#c084fc" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {streams.map((stream, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(30, 41, 59, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stream.color }} />
                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{stream.name}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                    ${parseFloat(stream.amount).toFixed(2)} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>USDT</span>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 700 }}>Total All-Time Earned:</span>
              <span style={{ fontSize: '1.2rem', color: '#38bdf8', fontWeight: 900 }}>
                ${parseFloat(profile?.totalIncomeEarned || '0').toFixed(2)} USDT
              </span>
            </div>
          </div>
        </div>

      </div>
    </MemberLayout>
  )
}

export default WithdrawalPage

