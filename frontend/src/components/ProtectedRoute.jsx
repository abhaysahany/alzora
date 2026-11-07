import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useWalletAuth } from '../hooks/useWalletAuth'

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isConnecting } = useWalletAuth()
  const location = useLocation()

  if (!isAuthenticated && isConnecting) {
    return (
      <div className="login-page-container">
        <div className="kicker">Verifying Web3 Session</div>
        <h2 style={{ marginTop: 16 }}>Connecting Wallet...</h2>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login${location.search}`} replace state={{ from: location }} />
  }

  return children
}
