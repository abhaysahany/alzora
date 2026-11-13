import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import BackgroundCanvas from '../components/BackgroundCanvas'
import { PageTransitionShell, FloatingParticles } from '../components/MotionPrimitives'
import { ConnectWalletButton } from '../components/ConnectWalletButton'
import { useWalletAuth, closeWeb3Modal } from '../hooks/useWalletAuth'
import { useAventraContracts } from '../hooks/useAventraContracts'
import { getStoredReferral } from '../utils/referral'
import { formatErrorMessage } from '../utils/errorMessages'
import { Shield, Lock, Cpu, CheckCircle, Loader2, Search, ArrowRight, Crown, ShieldCheck } from 'lucide-react'

export function LoginPage() {
  const { isAuthenticated, address } = useWalletAuth()
  const {
    memberInfo,
    isMemberInfoFetched,
    isAdmin,
    isOperator,
    isPendingOwner,
    isOwnerLoading,
    isOwnerFetched,
    isPendingOwnerLoading,
    isPendingOwnerFetched,
    pendingOwnerAddress,
    contractOwnerAddress,
    acceptOwnership,
    refreshAll,
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

    // Must wait until member info AND ownership queries have completely finished on-chain!
    if (
      !isMemberInfoFetched ||
      !isPendingOwnerFetched ||
      !isOwnerFetched ||
      isOwnerLoading ||
      isPendingOwnerLoading
    ) {
      return
    }

    // If wallet has a pending ownership nomination, STOP! DO NOT redirect!
    // User must accept ownership first before login to gain admin access.
    if (isPendingOwner) return

    // Only confirmed on-chain owner/admin can enter Admin Console
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
    isOwnerFetched,
    isPendingOwnerFetched,
    isOwnerLoading,
    isPendingOwnerLoading,
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
      const syncFn = refreshAll || refetchAll
      if (syncFn) await syncFn()
      navigate('/admin', { replace: true })
    } catch (err) {
      setAcceptError(formatErrorMessage(err, 'Unable to accept contract ownership.'))
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <PageTransitionShell style={{ position: 'relative', minHeight: '100vh', zIndex: 1, display: 'flex', flexDirection: 'column', background: '#050611' }}>
      <BackgroundCanvas />
      <FloatingParticles />

      {/* TOP HEADER */}
      <header className="nav" style={{ position: 'relative', zIndex: 100 }}>
        <div className="wrap nav-inner">
          <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png"
              alt="ELZORA"
              style={{
                height: 32,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 10px rgba(255, 215, 0, 0.35))',
              }}
            />
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              to="/lookup"
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'rgba(192, 132, 252, 0.35)', color: '#c084fc' }}
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
        <div className="glass-card glass-card-glow login-card elzora-glass" style={{ zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <img
              src="/logo.png"
              alt="ELZORA"
              style={{
                height: 48,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 20px rgba(245, 158, 11, 0.45))',
              }}
            />
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

          {/* WALLET CONNECTED STATUS & VERIFYING STATE */}
          {isAuthenticated && (!isPendingOwnerFetched || isPendingOwnerLoading) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12, margin: '8px 0 16px', borderRadius: 12, background: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.2)', color: '#00e5ff' }}>
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Verifying smart contract ownership & permissions...</span>
            </div>
          )}

          {/* PENDING OWNER ACCEPTANCE CARD */}
          {isAuthenticated && isPendingOwner && (
            <div
              className="glass-card"
              style={{
                margin: '20px 0',
                padding: 24,
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(255,215,0,0.18), rgba(0,229,255,0.08))',
                border: '2px solid rgba(255,215,0,0.6)',
                boxShadow: '0 0 30px rgba(255,215,0,0.25)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ffd700', marginBottom: 10 }}>
                <Crown size={24} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
                  Smart Contract Ownership Transfer Proposed!
                </h3>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 16, lineHeight: 1.5 }}>
                Your connected wallet has been nominated as the new Owner of the <b>ELZORA Smart Contract</b> by current owner{' '}
                <code style={{ color: '#00e5ff' }}>
                  {contractOwnerAddress && typeof contractOwnerAddress === 'string' ? `${contractOwnerAddress.slice(0, 6)}...${contractOwnerAddress.slice(-4)}` : 'Current Owner'}
                </code>. You must accept ownership on-chain before you can login and access the Admin Control Center.
              </p>

              {acceptError && (
                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.4)', color: '#ff4d4d', fontSize: '0.85rem', marginBottom: 14 }}>
                  {acceptError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleAcceptOwnership}
                  disabled={isAccepting}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    fontWeight: 900,
                    borderRadius: 14,
                    fontSize: '0.94rem',
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

                <button
                  type="button"
                  onClick={() => navigate('/dashboard', { replace: true })}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: 'var(--muted)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Skip & Continue to Member Dashboard as Standard User
                </button>
              </div>
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
    </PageTransitionShell>
  )
}
