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
} from 'lucide-react'

export function MemberLayout({ children, pageTitle = 'Dashboard' }) {
  const { isConnected, logout } = useWalletAuth()
  const { memberInfo, isMemberInfoFetched, isAdmin } = useAventraContracts()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

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
    { path: '/tree', label: 'Binary Matrix Tree', icon: GitCommit },
    { path: '/ranks', label: '8 Club Ranks', icon: Award },
    { path: '/packages', label: 'Global Club ($25)', icon: RefreshCw },
    { path: '/withdrawal', label: 'Withdrawal', icon: Wallet },
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
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: '#ffffff',
                fontSize: '1.1rem',
                boxShadow: '0 0 16px rgba(124, 58, 237, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              E
            </div>
            <span style={{ fontWeight: 900, background: 'linear-gradient(135deg, #e2e8f0, #c084fc 40%, #6366f1 80%, #38bdf8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', letterSpacing: '0.08em', fontSize: '1.4rem' }}>ELZORA</span>
          </Link>
          <button
            className="mobile-burger-btn"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: mobileMenuOpen ? 'block' : 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
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
          {typeof children === 'function' ? children({ showToast }) : children}
        </div>
      </main>
    </div>
  )
}

export default MemberLayout
