import React, { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useAventraContracts } from '../hooks/useAventraContracts'
import { ConnectWalletButton } from './ConnectWalletButton'
import BackgroundCanvas from './BackgroundCanvas'
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Zap,
  Award,
  RefreshCw,
  Users,
  Share2,
  Receipt,
  GitCommit,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Search,
  Wallet,
  History,
  FileText,
  HelpCircle,
  Crown,
  Loader2,
} from 'lucide-react'

export function MemberLayout({ children, pageTitle = 'Dashboard' }) {
  const { isConnected, logout } = useWalletAuth()
  const {
    memberInfo,
    isMemberInfoFetched,
    isAdmin,
    isPendingOwner,
    acceptOwnership,
    refreshAll,
  } = useAventraContracts()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [isAcceptingOwnership, setIsAcceptingOwnership] = useState(false)

  const isRegistered = Boolean(memberInfo?.isRegistered || memberInfo?.active)

  useEffect(() => {
    if (!isConnected) {
      navigate('/login', { replace: true })
      return
    }

    if (isMemberInfoFetched && !isRegistered) {
      navigate('/register', { replace: true })
    }
  }, [isConnected, isMemberInfoFetched, isRegistered, navigate])

  const handleDisconnect = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleAcceptOwnership = async () => {
    try {
      setIsAcceptingOwnership(true)
      showToast('Accepting ownership on-chain in MetaMask...')
      await acceptOwnership()
      if (refreshAll) await refreshAll()
      showToast('🎉 Ownership accepted! Redirecting to Admin Console...')
      navigate('/admin', { replace: true })
    } catch (err) {
      showToast(`Accept failed: ${err.message}`)
    } finally {
      setIsAcceptingOwnership(false)
    }
  }

  if (!isConnected || (isMemberInfoFetched && !isRegistered)) {
    return (
      <div className="login-page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BackgroundCanvas />
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', borderRadius: 20 }}>
          <div style={{ color: 'var(--cyan)', fontSize: '1.1rem', fontWeight: 600 }}>Verifying Account Registration...</div>
        </div>
      </div>
    )
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tree', label: 'Sponsor Tree & Directs', icon: GitCommit },
    { path: '/ranks', label: '8 Club Ranks', icon: Award },
    { path: '/packages', label: 'Single Leg / Global ($25)', icon: RefreshCw },
    { path: '/history', label: 'Transaction History', icon: History },
    { path: '/earnings', label: 'Income Breakdown', icon: DollarSign },
    { path: '/team', label: 'Team & Lineage', icon: Users },
    { path: '/referrals', label: 'Referral Link & QR', icon: Share2 },
    { path: '/income-history', label: 'Income Streams Ledger', icon: Receipt },
  ]

  return (
    <div className="dashboard-container">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: '#0e1626',
            border: '1px solid var(--cyan)',
            color: 'var(--cyan)',
            padding: '14px 28px',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* MOBILE OVERLAY BACKDROP */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 8, 20, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 90,
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', height: 96, padding: '0 16px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textDecoration: 'none' }}>
            <img
              src="/logo.png"
              alt="ELZORA"
              className="elzora-logo-sidebar"
              style={{ height: 68, width: 'auto', maxWidth: 220, objectFit: 'contain', display: 'block' }}
            />
          </Link>
          <button
            className="mobile-burger-btn"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: mobileMenuOpen ? 'block' : 'none', position: 'absolute', right: 16 }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {isPendingOwner && (
            <button
              onClick={handleAcceptOwnership}
              disabled={isAcceptingOwnership}
              className="sidebar-item"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(0, 229, 255, 0.15))',
                border: '1px solid #ffd700',
                color: '#ffd700',
                fontWeight: 800,
                marginBottom: 12,
                borderRadius: 10,
                width: '100%',
                cursor: isAcceptingOwnership ? 'not-allowed' : 'pointer',
                textAlign: 'left',
              }}
            >
              <div className="sidebar-item-left">
                {isAcceptingOwnership ? (
                  <Loader2 size={18} className="animate-spin" color="#ffd700" />
                ) : (
                  <Crown size={18} color="#ffd700" />
                )}
                <span>{isAcceptingOwnership ? 'Accepting...' : 'Accept Contract Owner'}</span>
              </div>
            </button>
          )}

          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              style={{
                textDecoration: 'none',
                background: 'rgba(255, 215, 0, 0.12)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: '#ffd700',
                fontWeight: 700,
                marginBottom: 12,
                borderRadius: 10,
              }}
            >
              <div className="sidebar-item-left">
                <ShieldCheck size={18} color="#ffd700" />
                <span>Admin Dashboard</span>
              </div>
            </NavLink>
          )}

          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="sidebar-item-left">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={handleDisconnect}
            className="sidebar-item"
            style={{ color: 'var(--red)', width: '100%', cursor: 'pointer' }}
          >
            <div className="sidebar-item-left">
              <LogOut size={18} />
              <span>Disconnect</span>
            </div>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="dashboard-main">
        <BackgroundCanvas />

        {/* TOPBAR HEADER */}
        <header className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="mobile-burger-btn"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="dashboard-page-title">{pageTitle}</h1>
          </div>

          <div className="topbar-actions">
            <ConnectWalletButton size="small" />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="dashboard-content">
          {/* PENDING OWNERSHIP ALERT BANNER */}
          {isPendingOwner && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.18), rgba(0,229,255,0.12))',
                border: '2px solid #ffd700',
                borderRadius: 18,
                padding: '20px 24px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                boxShadow: '0 8px 30px rgba(255,215,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,215,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffd700' }}>
                  <Crown size={26} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#fff', fontSize: '1.05rem', marginBottom: 4 }}>
                    👑 Smart Contract Ownership Transfer Proposed!
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.86rem' }}>
                    Your wallet has been nominated as Contract Owner. Accept ownership on-chain to activate the Admin Control Center.
                  </div>
                </div>
              </div>

              <button
                onClick={handleAcceptOwnership}
                disabled={isAcceptingOwnership}
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                  color: '#000',
                  border: 'none',
                  cursor: isAcceptingOwnership ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {isAcceptingOwnership && <Loader2 size={16} className="animate-spin" />}
                <span>{isAcceptingOwnership ? 'Confirming On-Chain...' : 'Accept Ownership & Enter Admin'}</span>
              </button>
            </div>
          )}

          {typeof children === 'function' ? children({ showToast }) : children}
        </div>
      </main>
    </div>
  )
}

export default MemberLayout
