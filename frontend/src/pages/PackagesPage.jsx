import React, { useState } from 'react'
import { MemberLayout } from '../components/MemberLayout'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Layers,
  Award,
  Zap,
} from 'lucide-react'

export function PackagesPage() {
  const {
    profile,
    globalClub,
    incomeBreakdown,
    overview,
    usdtBalance,
    usdtAllowance,
    loading,
    error,
    approveUSDT,
    joinGlobalClub,
  } = useTetherStream()

  const [successMsg, setSuccessMsg] = useState('')

  const GLOBAL_CLUB_PRICE = '25'
  const isNeedsApproval = Number(usdtAllowance || 0) < Number(GLOBAL_CLUB_PRICE)

  const handleApprove = async () => {
    setSuccessMsg('')
    try {
      await approveUSDT(GLOBAL_CLUB_PRICE)
      setSuccessMsg(`Approved $${GLOBAL_CLUB_PRICE} USDT limit for Global Club!`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleJoin = async () => {
    setSuccessMsg('')
    try {
      await joinGlobalClub()
      setSuccessMsg('Successfully entered Global Club ($25)! Your entry has joined the automated cycling queue.')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <MemberLayout pageTitle="Global Club ($25 Re-entry)">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* TOP BANNER */}
        <div
          style={{
            padding: '28px 32px',
            borderRadius: 24,
            border: '1px solid rgba(217, 70, 239, 0.35)',
            background: 'linear-gradient(135deg, rgba(25, 15, 60, 0.9) 0%, rgba(9, 13, 35, 0.95) 100%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(217, 70, 239, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 14px',
                  borderRadius: 20,
                  background: 'rgba(217, 70, 239, 0.18)',
                  border: '1px solid rgba(217, 70, 239, 0.4)',
                  color: '#f472b6',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> AUTONOMOUS $25 CYCLING QUEUE
              </div>
              <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900, color: '#f8fafc' }}>
                Global Club & Perpetual $25 Re-entry System
              </h1>
              <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.92rem' }}>
                Enter the decentralized 1-to-2 automated queue: Earn $25 per cycle and generate a new re-entry spot automatically!
              </p>
            </div>

            <div
              style={{
                background: 'rgba(6, 8, 20, 0.7)',
                padding: '14px 22px',
                borderRadius: 16,
                border: '1px solid rgba(217, 70, 239, 0.3)',
                textAlign: 'right',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Protocol Entries</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ec4899' }}>
                {overview?.globalClubTotalEntries || 0} Entries
              </span>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '14px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{successMsg}</span>
          </div>
        )}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '14px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {/* 2 MAIN CARDS: JOIN CARD & USER STATUS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          
          {/* Join Global Club Card */}
          <div
            style={{
              background: 'rgba(13, 18, 45, 0.85)',
              border: '1px solid rgba(217, 70, 239, 0.35)',
              borderRadius: 20,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ padding: 10, borderRadius: 12, background: 'rgba(217, 70, 239, 0.2)', color: '#ec4899' }}>
                  <RefreshCw size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                    Join Global Club Entry
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Fixed Participation: $25 USDT</span>
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 14,
                  background: 'rgba(6, 8, 20, 0.6)',
                  border: '1px solid rgba(217, 70, 239, 0.2)',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Entry Price:</span>
                  <strong style={{ color: '#f8fafc' }}>$25.00 USDT</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Cycle Reward:</span>
                  <strong style={{ color: '#10b981' }}>$25.00 USDT (100% ROI)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Automated Re-entry:</span>
                  <strong style={{ color: '#c084fc' }}>1 Re-entry Spot (Auto Funded)</strong>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 20 }}>
                Wallet Balance: <strong style={{ color: '#38bdf8' }}>${Number(usdtBalance).toFixed(2)} USDT</strong>
              </div>
            </div>

            <div>
              {isNeedsApproval ? (
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Approving USDT...' : 'Approve $25 USDT'}
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={loading || Number(usdtBalance) < 25}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: loading || Number(usdtBalance) < 25 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <RefreshCw size={18} />
                  <span>{loading ? 'Entering Global Club...' : 'Join Global Club ($25 USDT)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* User Performance Card */}
          <div
            style={{
              background: 'rgba(13, 18, 45, 0.85)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 20,
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ padding: 10, borderRadius: 12, background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc' }}>
                <Award size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  Your Global Club Statistics
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Live on-chain cycle accounting</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: 16, borderRadius: 14, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL ENTRIES</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc' }}>{globalClub.entriesCount}</div>
                <div style={{ fontSize: '0.72rem', color: '#c084fc', marginTop: 4 }}>Initial + Re-entries</div>
              </div>

              <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: 16, borderRadius: 14, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>COMPLETED CYCLES</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981' }}>{globalClub.cyclesCompleted}</div>
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: 4 }}>$25 per cycle payout</div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(6, 8, 20, 0.7)',
                padding: '16px',
                borderRadius: 14,
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Global Club Income Earned:</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', margin: '4px 0' }}>
                ${Number(incomeBreakdown?.globalClubIncome || 0).toFixed(2)} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>USDT</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>
                Available to withdraw anytime from your main dashboard
              </span>
            </div>
          </div>
        </div>

        {/* ALGORITHM EXPLANATION SEQUENCE TABLE */}
        <div
          style={{
            background: 'rgba(13, 18, 45, 0.85)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 20,
            padding: 24,
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
            Mathematical Re-entry Queue Sequence
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16 }}>
            Every position requires exactly 2 subsequent entries under it to trigger cycle completion.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: 12, borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>ENTRIES #2 & #3</div>
              <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: 4 }}>Completes Entry #1 → <strong>Re-entry #4</strong></div>
            </div>
            <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: 12, borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>ENTRIES #4 & #5</div>
              <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: 4 }}>Completes Entry #2 → <strong>Re-entry #6</strong></div>
            </div>
            <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: 12, borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>ENTRIES #6 & #7</div>
              <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: 4 }}>Completes Entry #3 → <strong>Re-entry #8</strong></div>
            </div>
            <div style={{ background: 'rgba(6, 8, 20, 0.7)', padding: 12, borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700 }}>ENTRIES #8 & #9</div>
              <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: 4 }}>Completes Entry #4 → <strong>Re-entry #10</strong></div>
            </div>
          </div>
        </div>

      </div>
    </MemberLayout>
  )
}
