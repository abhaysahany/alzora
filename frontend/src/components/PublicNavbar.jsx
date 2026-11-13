import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  Menu,
  X,
  Wallet,
  ArrowRight,
  FileText,
  HelpCircle,
  Home,
  Sparkles,
  Layers,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

export function PublicNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isConnected, address, chain } = useWalletAuth()
  const { profile } = useTetherStream()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isRegistered = Boolean(profile?.isRegistered || profile?.active)

  const handleAction = () => {
    if (!isConnected) {
      navigate('/login')
    } else if (isRegistered) {
      navigate('/dashboard')
    } else {
      navigate('/register')
    }
  }

  const navLinks = [
    { label: 'Home', path: '/', isRoute: true },
    { label: 'Business Plan', path: '/business-plan', isRoute: true },
    { label: 'Voice AI', path: '/ai/plan-explainer', isRoute: true },
    { label: "FAQ's", path: '/faqs', isRoute: true },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path
  }

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  const miniAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : ''
  const chainName = chain?.id === 56 
    ? 'BNB SMART CHAIN' 
    : chain?.id === 97 
      ? 'BNB SMART CHAIN TESTNET' 
      : (chain?.name || 'BNB SMART CHAIN TESTNET').toUpperCase()

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(22px) saturate(165%)',
          background: 'rgba(3, 5, 8, 0.88)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.22)',
          boxShadow: '0 10px 36px -18px rgba(0, 0, 0, 0.85)',
          padding: '14px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <img
                src="/logo.png"
                alt="ELZORA"
                style={{
                  height: 38,
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 10px rgba(245, 158, 11, 0.35))',
                }}
              />
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              fontSize: '0.88rem',
              fontWeight: 700,
            }}
            className="desktop-nav"
          >
            {navLinks.map((link) => {
              const active = link.isRoute && isActive(link.path)
              return link.isRoute ? (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    color: active ? '#fbbf24' : '#cbd5e1',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: 10,
                    background: active ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    border: active ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.path}
                  href={link.path}
                  style={{
                    color: '#cbd5e1',
                    textDecoration: 'none',
                    padding: '6px 10px',
                    transition: 'color 0.2s',
                  }}
                >
                  {link.label}
                </a>
              )
            })}
          </div>

          {/* Right-Side Wallet, Blockchain & Dashboard Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isConnected && address ? (
              <div className="navbar-auth-group">
                {/* 1. Blockchain Details Pill */}
                <div className="navbar-chain-pill">
                  <span className="navbar-chain-dot" />
                  <span>{chainName}</span>
                </div>

                {/* 2. Connected Wallet Address in Short with Icon (Single Display) */}
                <div className="navbar-account-pill">
                  <ShieldCheck size={15} color="#ffd700" />
                  <span>{shortAddress}</span>
                </div>

                {/* 3. Go to Dashboard Button */}
                <button
                  onClick={handleAction}
                  className="navbar-dashboard-btn"
                >
                  <span>{isRegistered ? 'Go to Dashboard' : 'Register Now'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="navbar-connect-btn"
              >
                <Wallet size={15} />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              className="landing-burger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(3, 5, 8, 0.88)',
              backdropFilter: 'blur(8px)',
              zIndex: 198,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(85vw, 320px)',
              background: 'linear-gradient(180deg, #070b12 0%, #030508 100%)',
              borderLeft: '1px solid rgba(245, 158, 11, 0.28)',
              padding: '24px 20px',
              zIndex: 199,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.85)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                  paddingBottom: 16,
                  borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <img
                  src="/logo.png"
                  alt="ELZORA"
                  style={{
                    height: 28,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.35))',
                  }}
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: 4 }}
                >
                  <X size={22} />
                </button>
              </div>

              {isConnected && address && (
                <div style={{ marginBottom: 20, padding: 12, borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#34d399', marginBottom: 6, fontWeight: 700 }}>
                    <span className="navbar-chain-dot" />
                    <span>{chainName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#ffd700', fontFamily: 'monospace', fontWeight: 800 }}>
                    <ShieldCheck size={14} color="#ffd700" />
                    <span>{shortAddress}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.95rem', fontWeight: 700 }}>
                {navLinks.map((link) =>
                  link.isRoute ? (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        color: isActive(link.path) ? '#fbbf24' : '#cbd5e1',
                        textDecoration: 'none',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: isActive(link.path) ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      }}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.path}
                      href={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ color: '#cbd5e1', textDecoration: 'none', padding: '8px 12px' }}
                    >
                      {link.label}
                    </a>
                  )
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleAction()
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontWeight: 800, borderRadius: 12 }}
              >
                {isConnected ? (isRegistered ? 'Go to Dashboard →' : 'Complete Registration →') : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default PublicNavbar

