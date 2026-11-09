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
} from 'lucide-react'

export function PublicNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isConnected, address } = useWalletAuth()
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
    { label: "FAQ's", path: '/faqs', isRoute: true },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path
  }

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          background: 'rgba(6, 8, 20, 0.88)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.25)',
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
          {/* Logo & Network Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <img
                src="/logo.png"
                alt="ELZORA"
                style={{
                  height: 36,
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 10px rgba(245, 158, 11, 0.35))',
                }}
              />
            </Link>

            <div
              className="landing-network-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                color: '#facc15',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#facc15', boxShadow: '0 0 8px #facc15' }} />
              BSC Testnet (97)
            </div>
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
                    color: active ? '#c084fc' : '#cbd5e1',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: 10,
                    background: active ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: active ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
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

          {/* Wallet & Auth Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isConnected ? (
              <button
                onClick={handleAction}
                style={{
                  padding: '9px 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <span>{isRegistered ? 'Dashboard' : 'Register Now'}</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
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
              background: 'rgba(6, 8, 20, 0.85)',
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
              background: 'linear-gradient(180deg, #0e1438 0%, #060814 100%)',
              borderLeft: '1px solid rgba(139, 92, 246, 0.35)',
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
                  borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
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
                  style={{ background: 'transparent', border: 'none', color: '#c084fc', cursor: 'pointer', padding: 4 }}
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.95rem', fontWeight: 700 }}>
                {navLinks.map((link) =>
                  link.isRoute ? (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        color: isActive(link.path) ? '#c084fc' : '#cbd5e1',
                        textDecoration: 'none',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: isActive(link.path) ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleAction()
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontWeight: 800, borderRadius: 12 }}
              >
                {isConnected ? (isRegistered ? 'Go to Dashboard' : 'Complete Registration') : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default PublicNavbar

