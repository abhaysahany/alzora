import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useBalance } from 'wagmi'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { X, Check } from 'lucide-react'

// Cute Whale Avatar matching Image 2 exactly
function CuteWhaleAvatar({ size = 76 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(145deg, #7ad8ff 0%, #58b6f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        boxShadow: '0 8px 24px rgba(88, 182, 246, 0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: 'translateY(-2px)' }}
      >
        {/* Water Spout Spray */}
        <path
          d="M32 15 C32 8 26 7 24 10 C22 13 27 15 31 16"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
        <path
          d="M32 15 C32 7 36 6 38 9 C40 12 35 14 33 16"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
        <circle cx="23" cy="9" r="1.6" fill="#ffffff" />
        <circle cx="39" cy="8" r="1.6" fill="#ffffff" />
        <circle cx="31" cy="5" r="1.4" fill="#ffffff" />

        {/* Whale Body */}
        <path
          d="M12 36 C12 25 24 20 38 20 C48 20 54 26 54 34 C54 43 42 45 30 45 C18 45 12 43 12 36 Z"
          fill="#94bbf7"
        />
        
        {/* Whale Tail Top & Bottom */}
        <path
          d="M14 34 C10 31 6 27 5 23 C8 25 11 28 13 32 Z"
          fill="#7faef6"
        />
        <path
          d="M14 35 C9 38 5 40 4 44 C7 42 10 39 13 36 Z"
          fill="#7faef6"
        />

        {/* Whale Belly Light Patch */}
        <path
          d="M19 38 C23 43 32 45 42 43 C46 42 49 40 50 38 C46 42 36 44 26 43 C21 42 19 40 19 38 Z"
          fill="#eaf1ff"
        />

        {/* Whale Fin / Flipper */}
        <path
          d="M32 37 C34 41 39 42 41 40 C41 38 38 35 34 35 Z"
          fill="#7faef6"
        />

        {/* Eye with Shiny Sparkle */}
        <circle cx="44" cy="30" r="2.2" fill="#1e293b" />
        <circle cx="44.8" cy="29.2" r="0.9" fill="#ffffff" />

        {/* Cheerful Blush */}
        <ellipse cx="40" cy="34" rx="2.5" ry="1.4" fill="#fca5a5" opacity="0.65" />

        {/* Cute Smile */}
        <path
          d="M45 34 C47 36 49 35 50 34"
          stroke="#1e293b"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

// Custom Copy Icon (two overlapping rounded rectangles matching Image 2)
function CopySquareIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="12" height="12" rx="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 8V6C16 4.89543 15.1046 4 14 4H6C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Custom Disconnect Icon (rectangle with exit arrow pointing right matching Image 2)
function DisconnectDoorIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 8L21 12L17 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WalletDisconnectModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false)
  const { address, chain, logout } = useWalletAuth()
  const { data: balanceData } = useBalance({
    address: address || undefined,
  })

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key press & prevent background scroll
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen || !address || typeof document === 'undefined') return null

  // Format address matching Image 2 (e.g. 0xC4...87D5)
  const formattedAddress = `${address.slice(0, 4)}...${address.slice(-4)}`

  // Format native balance (e.g. "0.43 tBNB" or "0.016 BNB")
  const formatBalance = () => {
    try {
      if (!balanceData) return '0.00 BNB'
      const val = parseFloat(balanceData.formatted)
      if (isNaN(val)) return `0.00 ${balanceData.symbol || 'BNB'}`
      const displayNum = val === 0 ? '0.00' : val < 0.001 ? '<0.001' : val < 1 ? val.toFixed(2) : val.toFixed(3)
      const symbol = balanceData.symbol || (chain?.id === 97 ? 'tBNB' : 'BNB')
      return `${displayNum} ${symbol}`
    } catch {
      return '0.00 BNB'
    }
  }

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const handleDisconnect = (e) => {
    e.stopPropagation()
    onClose()
    logout()
  }

  // Use createPortal to mount directly on document.body, escaping all parent CSS transforms & overflow
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999999,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box',
        animation: 'fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#191c24',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
          padding: '28px 20px 22px 20px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'scaleUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top-Right Circular Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#94a3b8',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.color = '#94a3b8'
          }}
        >
          <X size={16} />
        </button>

        {/* Whale Avatar in Sky Blue Circle */}
        <div style={{ marginBottom: 14 }}>
          <CuteWhaleAvatar size={76} />
        </div>

        {/* Formatted Connected Address */}
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            marginBottom: 4,
            fontFamily: 'monospace, system-ui, -apple-system, sans-serif',
          }}
        >
          {formattedAddress}
        </div>

        {/* Native Token Balance */}
        <div
          style={{
            fontSize: '0.92rem',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: 22,
          }}
        >
          {formatBalance()}
        </div>

        {/* Action Buttons: Copy Address & Disconnect */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {/* Copy Address Button */}
          <button
            onClick={handleCopy}
            type="button"
            style={{
              background: '#232733',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 16,
              padding: '16px 10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2c3240'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#232733'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {copied ? (
              <Check size={20} color="#10b981" />
            ) : (
              <CopySquareIcon size={20} color="#cbd5e1" />
            )}
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: copied ? '#10b981' : '#f1f5f9',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {copied ? 'Copied!' : 'Copy Address'}
            </span>
          </button>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            type="button"
            style={{
              background: '#232733',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 16,
              padding: '16px 10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#232733'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <DisconnectDoorIcon size={20} color="#cbd5e1" />
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#f1f5f9',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Disconnect
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default WalletDisconnectModal
