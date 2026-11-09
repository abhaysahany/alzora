import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MemberLayout } from '../components/MemberLayout'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  Share2,
  Copy,
  Check,
  Users,
  ShieldCheck,
  QrCode,
  Sparkles,
  ArrowRight,
  Split,
  ChevronRight,
  Award,
  Zap,
} from 'lucide-react'

export function ReferralPage() {
  const { address } = useWalletAuth()
  const { profile, isRegistered } = useTetherStream()
  const navigate = useNavigate()

  const [copiedLink, setCopiedLink] = useState(null)
  const [activePlacement, setActivePlacement] = useState(1) // 1: Left, 2: Right
  const [toastMsg, setToastMsg] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const userRefParam = profile?.userAddress || address || ''

  const leftReferralLink = `${window.location.origin}/register?ref=${userRefParam}&pos=1`
  const rightReferralLink = `${window.location.origin}/register?ref=${userRefParam}&pos=2`
  const generalReferralLink = `${window.location.origin}/register?ref=${userRefParam}`

  const currentLink = activePlacement === 1 ? leftReferralLink : rightReferralLink
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentLink)}`

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(type)
    setTimeout(() => setCopiedLink(null), 2200)
    showToast(`${type} copied to clipboard!`)
  }

  const isBinaryQualified = (profile?.leftDirectCount || 0) >= 1 && (profile?.rightDirectCount || 0) >= 1

  return (
    <MemberLayout pageTitle="ELZORA Referral & Binary Placement Hub">
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: '#0b0f24',
            border: '1px solid var(--purple)',
            color: '#c084fc',
            padding: '14px 28px',
            borderRadius: 14,
            fontWeight: 800,
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          }}
        >
          {toastMsg}
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* HERO BANNER */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: '20px 24px',
            borderRadius: 20,
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 21, 54, 0.9) 0%, rgba(11, 15, 36, 0.98) 100%)',
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
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: 'var(--purple-light)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                <Sparkles size={13} /> DUAL-LEG BINARY ROUTING & DIRECT 20% COMMISSION
              </div>
              <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>
                Referral & Placement Center
              </h1>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem', maxWidth: 680 }}>
                Every direct registration grants you an instant <b style={{ color: '#fff' }}>$10 USDT (20%)</b> direct sponsor commission, plus volume towards your Left/Right binary matching pairs (<b style={{ color: '#c084fc' }}>$2/pair</b>).
              </p>
            </div>

            {/* Binary Qualification Badge */}
            <div
              style={{
                padding: '12px 18px',
                borderRadius: 14,
                background: isBinaryQualified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                border: `1px solid ${isBinaryQualified ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                textAlign: 'right',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Binary Qualification
              </div>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: isBinaryQualified ? '#4ade80' : '#facc15',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  justifyContent: 'flex-end',
                  marginTop: 2,
                }}
              >
                {isBinaryQualified ? 'QUALIFIED ✅' : 'PENDING QUALIFICATION ⏳'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: 2 }}>
                Requires 1 Left ({profile?.leftDirectCount || 0}/1) & 1 Right ({profile?.rightDirectCount || 0}/1)
              </div>
            </div>
          </div>
        </div>

        {/* DUAL PLACEMENT GENERATOR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
          
          {/* LEFT LEG REFERRAL LINK */}
          <div
            className="glass-card"
            style={{
              padding: '18px 20px',
              borderRadius: 18,
              background: 'rgba(11, 15, 36, 0.85)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 10,
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: 'var(--purple-light)',
                    }}
                  >
                    <Split size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>
                      Left Leg Placement Link
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Positions member automatically into your Left Binary Tree
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: 'var(--purple-light)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  POS: LEFT (1)
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  color: 'var(--purple-light)',
                  wordBreak: 'break-all',
                  marginBottom: 14,
                }}
              >
                {leftReferralLink}
              </div>
            </div>

            <button
              onClick={() => handleCopy(leftReferralLink, 'Left Leg Referral Link')}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: '0.88rem',
                fontWeight: 800,
              }}
            >
              {copiedLink === 'Left Leg Referral Link' ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedLink === 'Left Leg Referral Link' ? 'Copied to Clipboard!' : 'Copy Left Leg Link'}</span>
            </button>
          </div>

          {/* RIGHT LEG REFERRAL LINK */}
          <div
            className="glass-card"
            style={{
              padding: '18px 20px',
              borderRadius: 18,
              background: 'rgba(11, 15, 36, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 10,
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: 'var(--cyan)',
                    }}
                  >
                    <Split size={20} style={{ transform: 'scaleX(-1)' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>
                      Right Leg Placement Link
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      Positions member automatically into your Right Binary Tree
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--cyan)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  POS: RIGHT (2)
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  color: 'var(--cyan)',
                  wordBreak: 'break-all',
                  marginBottom: 14,
                }}
              >
                {rightReferralLink}
              </div>
            </div>

            <button
              onClick={() => handleCopy(rightReferralLink, 'Right Leg Referral Link')}
              className="btn btn-outline"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: '0.88rem',
                fontWeight: 800,
                borderColor: 'var(--cyan)',
                color: 'var(--cyan)',
              }}
            >
              {copiedLink === 'Right Leg Referral Link' ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedLink === 'Right Leg Referral Link' ? 'Copied to Clipboard!' : 'Copy Right Leg Link'}</span>
            </button>
          </div>
        </div>

        {/* QR CODE & SPONSOR METRICS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
          
          {/* QR CODE CARD */}
          <div
            className="glass-card"
            style={{
              padding: 20,
              borderRadius: 18,
              background: 'rgba(11, 15, 36, 0.85)',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setActivePlacement(1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activePlacement === 1 ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                }}
              >
                Left QR Code
              </button>
              <button
                onClick={() => setActivePlacement(2)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activePlacement === 2 ? 'linear-gradient(135deg, #0ea5e9, #38bdf8)' : 'rgba(255,255,255,0.05)',
                  color: activePlacement === 2 ? '#0b0f24' : '#fff',
                }}
              >
                Right QR Code
              </button>
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: 10,
                borderRadius: 14,
                background: '#fff',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.25)',
              }}
            >
              <img src={qrApiUrl} alt="ELZORA Referral QR" style={{ width: 160, height: 160, borderRadius: 8, display: 'block' }} />
            </div>

            <p style={{ margin: '14px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
              Scan to register under your sponsor account with <b>{activePlacement === 1 ? 'Left' : 'Right'}</b> placement automatically selected.
            </p>
          </div>

          {/* SPONSOR SUMMARY METRICS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* SPONSOR DETAILS */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: 16,
                background: 'rgba(11, 15, 36, 0.85)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ShieldCheck size={18} style={{ color: 'var(--purple-light)' }} />
                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: 800 }}>
                  My Direct Sponsor
                </h4>
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#c084fc',
                  background: 'rgba(139, 92, 246, 0.08)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  wordBreak: 'break-all',
                }}
              >
                {profile?.sponsor && profile.sponsor !== '0x0000000000000000000000000000000000000000'
                  ? profile.sponsor
                  : 'Genesis Root Sponsor'}
              </div>
            </div>

            {/* DIRECT STATS */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: 16,
                background: 'rgba(11, 15, 36, 0.85)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Users size={18} style={{ color: 'var(--cyan)' }} />
                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: 800 }}>
                  Direct Sponsorship Metrics
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block' }}>Total Directs</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
                    {profile?.directCount || 0}
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block' }}>Left Directs</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--purple-light)' }}>
                    {profile?.leftDirectCount || 0}
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block' }}>Right Directs</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--cyan)' }}>
                    {profile?.rightDirectCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* DIRECT REWARD REVENUE BREAKDOWN */}
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                borderRadius: 16,
                background: 'rgba(11, 15, 36, 0.85)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block' }}>
                    Direct Sponsor Income (20% @ $10/member)
                  </span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#4ade80' }}>
                    ${((profile?.directCount || 0) * 10).toFixed(2)} USDT
                  </span>
                </div>
                <button
                  onClick={() => navigate('/tree')}
                  className="btn btn-outline btn-sm"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Sponsor Tree</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </MemberLayout>
  )
}
