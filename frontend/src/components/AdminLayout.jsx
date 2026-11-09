import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  BadgeDollarSign,
  ArrowUpRight,
  Receipt,
  Sliders,
  Menu,
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowLeftRight,
  ExternalLink,
  Lock,
  LogOut,
  Sparkles,
  Layers,
  Activity,
  Wallet,
} from 'lucide-react'
import { ConnectWalletButton } from './ConnectWalletButton'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useTetherStream } from '../hooks/useTetherStream'
import { CONTRACT_ADDRESSES } from '../web3/contracts'

export function AdminLayout({ children, pageTitle = 'Admin Portal' }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isConnected, logout, address } = useWalletAuth()
  const { isAdmin, contractPaused, memberInfo, overview } = useTetherStream()

  useEffect(() => {
    if (!isConnected) {
      navigate('/login', { replace: true })
    }
  }, [isConnected, navigate])

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Members Audit', path: '/admin/members', icon: Users },
    { label: 'Genealogy & Trees', path: '/admin/tree', icon: GitCommit },
    { label: 'Packages & Tiers', path: '/admin/packages', icon: Package },
    { label: '8-Stream Income', path: '/admin/income', icon: BadgeDollarSign },
    { label: 'Live Transactions', path: '/admin/transactions', icon: Receipt },
    { label: 'Protocol Controls', path: '/admin/controls', icon: Sliders },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060814', color: '#f8fafc', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* MOBILE OVERLAY BACKDROP */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 8, 20, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 90,
          }}
        />
      )}

      {/* ADMIN SIDEBAR */}
      <aside
        style={{
          width: 270,
          background: 'linear-gradient(180deg, #0b0f24 0%, #060814 100%)',
          borderRight: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transition: 'transform 0.3s ease',
        }}
        className={`admin-sidebar ${mobileDrawerOpen ? 'open' : ''}`}
      >
        {/* BRAND LOGO */}
        <div style={{ height: 84, padding: '0 20px', borderBottom: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Link to="/admin" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', width: '100%' }}>
            <img
              src="/logo.png"
              alt="ELZORA"
              className="elzora-logo-sidebar"
            />
            <div style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 800, letterSpacing: '1.2px', marginTop: 4, textAlign: 'center' }}>
              ADMIN CONTROL CENTER
            </div>
          </Link>
        </div>

        {/* ADMIN NAV ITEMS */}
        <nav style={{ flex: 1, padding: '20px 14px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 12px 10px', fontWeight: 800, letterSpacing: '0.5px' }}>
            Governance & Telemetry
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 14,
                  marginBottom: 6,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                  background: isActive ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                  boxShadow: isActive ? '0 4px 15px rgba(139, 92, 246, 0.2)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={18} color={isActive ? '#c084fc' : 'rgba(255,255,255,0.6)'} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* SWITCH TO MEMBER DASHBOARD BUTTON */}
          <div style={{ margin: '20px 0 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--cyan)',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ArrowLeftRight size={16} />
              <span>Member Dashboard</span>
            </div>
          </button>

          {/* DISCONNECT WALLET BUTTON */}
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <LogOut size={16} />
              <span>Disconnect Admin</span>
            </button>
          </div>
        </nav>

        {/* STATUS FOOTER */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(139, 92, 246, 0.15)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: contractPaused ? '#ef4444' : '#4ade80',
                  boxShadow: contractPaused ? '0 0 10px #ef4444' : '0 0 10px #4ade80',
                }}
              />
              <span style={{ color: 'var(--muted)' }}>Smart Contract:</span>
            </div>
            <span
              style={{
                color: contractPaused ? '#ef4444' : '#4ade80',
                fontWeight: 800,
              }}
            >
              {contractPaused ? 'PAUSED' : 'ACTIVE (SOLVENT)'}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: 270 }}>
        {/* TOPBAR */}
        <header
          className="admin-topbar"
          style={{
            height: 72,
            borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
            background: 'rgba(6, 8, 20, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 80,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="admin-burger-btn"
              style={{
                padding: 8,
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 10,
                color: 'var(--purple-light)',
                cursor: 'pointer',
                display: 'none',
              }}
            >
              {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--purple-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ADMIN CONSOLE
              </div>
              <h2 style={{ margin: 0, fontSize: '1.28rem', fontWeight: 900, color: '#fff' }}>
                {pageTitle}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Live Network Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                fontSize: '0.8rem',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
              <span>BSC Testnet (Chain ID 97)</span>
            </div>

            {contractPaused && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ShieldAlert size={14} />
                <span>PROTOCOL PAUSED</span>
              </div>
            )}

            <ConnectWalletButton />
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="admin-content" style={{ flex: 1, padding: 32, maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
