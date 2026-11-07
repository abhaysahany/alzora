import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useAventraContracts } from '../hooks/useAventraContracts'
import { CONTRACT_ADDRESSES } from '../web3/contracts'
import { ConnectWalletButton } from './ConnectWalletButton'

export function AdminProtectedRoute({ children }) {
  const { isConnected } = useWalletAuth()
  const { isAdmin, isOperator, loading } = useAventraContracts()
  const navigate = useNavigate()

  if (!isConnected) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          padding: 24,
        }}
      >
        <div
          className="glass-card"
          style={{
            maxWidth: 440,
            width: '100%',
            padding: 36,
            textAlign: 'center',
            borderRadius: 24,
            border: '1px solid rgba(255, 215, 0, 0.3)',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              background: 'rgba(255, 215, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <ShieldAlert size={32} color="#ffd700" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 10px', color: '#fff' }}>
            Admin Access Required
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: 24 }}>
            Please connect the authorized Admin wallet ({CONTRACT_ADDRESSES?.ROOT_ID?.slice(0, 8)}...{CONTRACT_ADDRESSES?.ROOT_ID?.slice(-6)}) to access the ELZORA Admin Control Center.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    )
  }

  // Strictly check on-chain role (DEFAULT_ADMIN_ROLE or OPERATOR_ROLE)
  if (!isAdmin && !isOperator) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          padding: 24,
        }}
      >
        <div
          className="glass-card"
          style={{
            maxWidth: 480,
            width: '100%',
            padding: 40,
            textAlign: 'center',
            borderRadius: 24,
            border: '1px solid rgba(255, 77, 77, 0.4)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'rgba(255, 77, 77, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <ShieldAlert size={36} color="#ff4d4d" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 12px', color: '#ff4d4d' }}>
            Unauthorized Access
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.94rem', marginBottom: 28, lineHeight: '1.5' }}>
            The connected wallet is not registered as an Admin or Operator in the AventraX Smart Contract.
            Access to administrative routes is strictly restricted.
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '0.95rem',
              fontWeight: 800,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
            <span>Return to Member Dashboard</span>
          </button>
        </div>
      </div>
    )
  }

  return children
}
