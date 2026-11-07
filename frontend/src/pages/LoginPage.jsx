import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import BackgroundCanvas from '../components/BackgroundCanvas'
import { ConnectWalletButton } from '../components/ConnectWalletButton'
import { useWalletAuth, closeWeb3Modal } from '../hooks/useWalletAuth'
import { useAventraContracts } from '../hooks/useAventraContracts'
import { getStoredReferral } from '../utils/referral'
import { Shield, Lock, Cpu, CheckCircle, Loader2, Search, ArrowRight, Crown, ShieldCheck } from 'lucide-react'

export function LoginPage() {
  const { isAuthenticated, address } = useWalletAuth()
  const {
    memberInfo,
    isMemberInfoFetched,
    isAdmin,
    isOperator,
    isPendingOwner,
    pendingOwnerAddress,
    contractOwnerAddress,
    acceptOwnership,
    refetchAll,
  } = useAventraContracts()
  const { closeConnectModal } = useConnectModal()
  const navigate = useNavigate()

  const [isAccepting, setIsAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !address) return

    closeWeb3Modal()
    if (closeConnectModal) {
      try { closeConnectModal() } catch (e) {}
    }

    // Wait for member info to load before deciding where to redirect
    if (!isMemberInfoFetched) return

    // If wallet is pending owner, do NOT redirect away yet; allow user to accept ownership on this page!
    if (isPendingOwner) return

    // If connected wallet is Admin or Operator, redirect straight to Admin Control Center
    if (isAdmin || isOperator) {
      navigate('/admin', { replace: true })
      return
    }

    const isRegistered =
      Boolean(memberInfo.isRegistered) ||
      Boolean(memberInfo.registrationTime > 0) ||
      Boolean(memberInfo.active) ||
      Number(memberInfo.packageId) > 0 ||
      (Boolean(memberInfo.sponsor) &&
        memberInfo.sponsor.toLowerCase() !== '0x0000000000000000000000000000000000000000')

    if (isRegistered) {
      navigate('/dashboard', { replace: true })
    } else {
      const storedRef = getStoredReferral()
      const regUrl = storedRef ? `/register?ref=${encodeURIComponent(storedRef)}` : '/register'
      navigate(regUrl, { replace: true })
    }
  }, [
    isAuthenticated,
    address,
    isMemberInfoFetched,
    isPendingOwner,
    isAdmin,
    isOperator,
    memberInfo.active,
    memberInfo.packageId,
    memberInfo.sponsor,
    memberInfo.isRegistered,
    memberInfo.registrationTime,
    navigate,
    closeConnectModal,
  ])

  const handleAcceptOwnership = async () => {
    setAcceptError(null)
    setIsAccepting(true)
    try {
      await acceptOwnership()
      await refetchAll()
      navigate('/admin', { replace: true })
    } catch (err) {
      setAcceptError(err?.message || 'Failed to accept contract ownership.')
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
      <BackgroundCanvas />

      {/* TOP HEADER */}
      <header className="nav" style={{ position: 'relative', zIndex: 100 }}>
        <div className="wrap nav-inner">
          <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 900, fontSize: '1.6rem', letterSpacing: '0.08em', background: 'linear-gradient(135deg, #f8fafc, #c084fc 40%, #6366f1 80%, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ELZORA</span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              to="/lookup"
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--panel-line)', color: 'var(--green)' }}
            >
              <Search size={14} />
              <span>User Lookup</span>
            </Link>
            <Link to="/" className="btn btn-ghost btn-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* LOGIN CARD CONTAINER */}
      <div className="login-page-container" style={{ position: 'relative', zIndex: 10 }}>
        <div className="glass-card glass-card-glow login-card" style={{ zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #0e1438 0%, #060814 100%)',
                border: '2px solid rgba(192, 132, 252, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(124, 58, 237, 0.45)',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontWeight: 900,
                  fontSize: '2rem',
                  background: 'linear-gradient(135deg, #ffffff 0%, #c084fc 50%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                E
              </span>
            </div>
            <div
              style={{
                fontWeight: 900,
                fontSize: '1.6rem',
                letterSpacing: '0.12em',
                background: 'linear-gradient(135deg, #f8fafc 10%, #c084fc 45%, #6366f1 80%, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ELZORA
            </div>
          </div>

          <div className="login-badge">
            <Shield size={14} />
            <span>SECURE WEB3 ACCESS</span>
          </div>

          <h1 className="login-title gradient-text">Connect Wallet</h1>
          <p className="login-subtitle">
            Welcome to ELZORA. Connect your Web3 wallet to access your decentralized binary matrix & smart club ecosystem dashboard.
          </p>

          {/* SINGLE UNIFIED CONNECT BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 16px', zIndex: 20 }}>
            <ConnectWalletButton size="large" />
          </div>

          {/* PENDING OWNER ACCEPTANCE CARD */}
          {isAuthenticated && isPendingOwner && (
            <div
              className="glass-card"
              style={{
                margin: '20px 0',
                padding: 24,
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(0,229,255,0.08))',
                border: '2px solid rgba(255,215,0,0.5)',
                boxShadow: '0 0 25px rgba(255,215,0,0.2)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ffd700', marginBottom: 10 }}>
                <Crown size={24} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  Contract Ownership Transfer Proposed!
                </h3>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 16, lineHeight: 1.5 }}>
                You have been proposed as the new Owner of the <b>AventraX Smart Contract</b> by current owner{' '}
                <code style={{ color: '#00e5ff' }}>
                  {contractOwnerAddress && typeof contractOwnerAddress === 'string' ? `${contractOwnerAddress.slice(0, 6)}...${contractOwnerAddress.slice(-4)}` : 'Current Owner'}
                </code>. Click below to accept ownership on-chain.
              </p>

              {acceptError && (
                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.4)', color: '#ff4d4d', fontSize: '0.85rem', marginBottom: 14 }}>
                  {acceptError}
                </div>
              )}

              <button
                onClick={handleAcceptOwnership}
                disabled={isAccepting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  fontWeight: 800,
                  borderRadius: 14,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  color: '#000',
                  border: 'none',
                  cursor: isAccepting ? 'not-allowed' : 'pointer',
                }}
              >
                {isAccepting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Confirming Ownership On-Chain...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    <span>Accept Ownership & Enter Admin Control Center</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* USER LOOKUP BUTTON */}
          <div style={{ margin: '8px 0 20px', width: '100%' }}>
            <Link
              to="/lookup"
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: 14,
                border: '1px solid rgba(0, 229, 255, 0.3)',
                background: 'rgba(0, 229, 255, 0.05)',
                color: '#00e5ff',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Search size={16} />
              <span>User ID / Member Lookup</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--cyan)', fontSize: '0.9rem', marginBottom: 12 }}>
              <Loader2 size={18} className="animate-spin" />
              <span>Redirecting to Dashboard...</span>
            </div>
          )}

          {/* SECURITY BADGES */}
          <div className="login-features">
            <div className="login-feature-item">
              <CheckCircle size={14} />
              <span>100% Smart Contract</span>
            </div>
            <div className="login-feature-item">
              <Lock size={14} />
              <span>Non-Custodial</span>
            </div>
            <div className="login-feature-item">
              <Cpu size={14} />
              <span>BNB Smart Chain</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
          No traditional passwords required. Your Web3 wallet acts as your secure cryptographic key.
        </div>
      </div>
    </div>
  )
}
