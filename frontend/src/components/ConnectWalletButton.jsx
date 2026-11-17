import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConnectButton, useAccountModal, useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { ShieldCheck, Wallet, Copy, Check, ExternalLink, LogOut, X, Globe, Zap } from 'lucide-react'
import { WalletDisconnectModal } from './WalletDisconnectModal'

export function ConnectWalletButton({ className = '', size = 'medium', onClick }) {
  const navigate = useNavigate()
  const { address: authAddress, isConnected: authIsConnected, chain: authChain, logout, login } = useWalletAuth()
  const { openAccountModal: hookOpenAccountModal } = useAccountModal()
  const { openChainModal: hookOpenChainModal } = useChainModal()
  const { openConnectModal: hookOpenConnectModal } = useConnectModal()

  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [copied, setCopied] = useState(false)

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal: customOpenAccountModal,
        openChainModal: customOpenChainModal,
        openConnectModal: customOpenConnectModal,
        mounted,
      }) => {
        const isConnected = mounted && authIsConnected && Boolean(account || authAddress)
        const activeAddress = isConnected ? (account?.address || authAddress) : null
        const displayAddress =
          account?.displayName ||
          (activeAddress ? `${activeAddress.substring(0, 6)}...${activeAddress.substring(activeAddress.length - 4)}` : '')
        const activeChainId = Number(chain?.id || authChain?.id || 56)
        const isMainnet = activeChainId === 56
        const displayChainName = chain?.name || authChain?.name || (isMainnet ? 'BNB Smart Chain' : 'BNB Chain Testnet')
        const isUnsupported = chain?.unsupported || authChain?.unsupported

        const handleAccountClick = (e) => {
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
          setShowAccountModal(true)
        }

        const handleChainClick = (e) => {
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
          if (customOpenChainModal) {
            customOpenChainModal()
          } else if (hookOpenChainModal) {
            hookOpenChainModal()
          } else {
            setShowNetworkModal(true)
          }
        }

        const handleConnectClick = (e) => {
          login()
          if (onClick) {
            onClick(e)
            return
          }

          if (customOpenConnectModal) {
            customOpenConnectModal()
          } else if (hookOpenConnectModal) {
            hookOpenConnectModal()
          }
        }

        const handleCopy = () => {
          if (activeAddress) {
            navigator.clipboard.writeText(activeAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
        }

        const handleSwitchChain = async (targetChainId) => {
          if (window.ethereum) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: targetChainId }],
              })
              setShowNetworkModal(false)
            } catch (err) {
              console.log('Switch error:', err)
            }
          }
        }

        if (!isConnected || !displayAddress) {
          return (
            <button
              onClick={handleConnectClick}
              type="button"
              className={`btn btn-primary ${size === 'large' ? 'btn-lg' : ''} ${className}`}
              style={{ cursor: 'pointer', zIndex: 20 }}
            >
              <Wallet size={18} />
              <span>Connect Wallet</span>
            </button>
          )
        }

        return (
          <>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'nowrap' }}>
              {/* NETWORK BADGE BUTTON */}
              <button
                onClick={handleChainClick}
                type="button"
                className="btn btn-ghost btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--cyan)',
                  borderColor: 'rgba(34, 227, 214, 0.4)',
                  background: 'rgba(34, 227, 214, 0.12)',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }}></span>
                <span>{displayChainName}</span>
              </button>

              {/* WALLET ADDRESS BADGE BUTTON */}
              <button
                onClick={handleAccountClick}
                type="button"
                className="btn btn-ghost btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--cyan)',
                  borderColor: 'rgba(34, 227, 214, 0.4)',
                  background: 'rgba(34, 227, 214, 0.12)',
                }}
              >
                <ShieldCheck size={16} color="#ffd700" />
                <span>{displayAddress}</span>
              </button>
            </div>

            {/* CUSTOM NETWORK SELECTOR MODAL */}
            {showNetworkModal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(5, 7, 14, 0.85)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 99999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 20,
                }}
                onClick={() => setShowNetworkModal(false)}
              >
                <div
                  className="glass-card"
                  style={{
                    width: '100%',
                    maxWidth: 420,
                    padding: 28,
                    borderRadius: 24,
                    background: '#0a101e',
                    border: '1px solid rgba(0, 229, 255, 0.3)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Globe size={20} color="#00e5ff" />
                      <span>Select Network</span>
                    </h3>
                    <button
                      onClick={() => setShowNetworkModal(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                      onClick={() => handleSwitchChain('0x38')} // BSC Mainnet
                      style={{
                        padding: '14px 18px',
                        borderRadius: 16,
                        background: isMainnet ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        border: isMainnet ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: isMainnet ? '0 0 8px #22c55e' : 'none' }}></span>
                        <span>BNB Smart Chain Mainnet (Chain ID: 56)</span>
                      </div>
                      {isMainnet && <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 800 }}>ACTIVE</span>}
                    </button>

                    <button
                      onClick={() => handleSwitchChain('0x61')} // BSC Testnet
                      style={{
                        padding: '14px 18px',
                        borderRadius: 16,
                        background: !isMainnet ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        border: !isMainnet ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', boxShadow: !isMainnet ? '0 0 8px #f59e0b' : 'none' }}></span>
                        <span>BNB Smart Chain Testnet (Chain ID: 97)</span>
                      </div>
                      {!isMainnet && <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 800 }}>ACTIVE</span>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* UNIFIED DISCONNECT & ACCOUNT MODAL */}
            <WalletDisconnectModal
              isOpen={showAccountModal}
              onClose={() => setShowAccountModal(false)}
            />
          </>
        )
      }}
    </ConnectButton.Custom>
  )
}
