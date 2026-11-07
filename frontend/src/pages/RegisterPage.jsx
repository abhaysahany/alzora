import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useChainId } from 'wagmi'
import { createPublicClient, http, isAddress } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useTetherStream } from '../hooks/useTetherStream'
import { ConnectWalletButton } from '../components/ConnectWalletButton'
import BackgroundCanvas from '../components/BackgroundCanvas'
import { getRpcUrl, ELZORA_GATEWAY_ABI } from '../web3/contracts'
import {
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Check,
  AlertCircle,
  Sparkles,
  GitCommit,
  CheckCircle2,
  Copy,
  Layers,
  Award,
  Zap,
  Settings,
} from 'lucide-react'

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const chainId = useChainId()
  const { isConnected, address } = useWalletAuth()
  const {
    profile,
    usdtBalance,
    usdtAllowance,
    loading,
    error,
    approveUSDT,
    register,
    CONTRACT_ADDRESSES,
  } = useTetherStream()

  const refFromUrl = searchParams.get('ref') || searchParams.get('sponsor') || ''
  const parentFromUrl = searchParams.get('parent') || ''
  const posFromUrl = searchParams.get('pos') || searchParams.get('position') || '1'

  const [sponsorInput, setSponsorInput] = useState(refFromUrl || CONTRACT_ADDRESSES.ROOT_ID)
  const [parentInput, setParentInput] = useState(parentFromUrl || refFromUrl || CONTRACT_ADDRESSES.ROOT_ID)
  const [autoParent, setAutoParent] = useState(parentFromUrl || refFromUrl || CONTRACT_ADDRESSES.ROOT_ID)
  const [isResolvingParent, setIsResolvingParent] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(Boolean(parentFromUrl))
  const [position, setPosition] = useState(Number(posFromUrl) === 2 ? 2 : 1) // 1 = Left, 2 = Right
  const [successMsg, setSuccessMsg] = useState('')

  // Redirect if already registered
  useEffect(() => {
    if (profile && profile.active) {
      navigate('/dashboard', { replace: true })
    }
  }, [profile?.active, navigate])

  // Automatically resolve the vacant parent on the chosen leg
  useEffect(() => {
    if (parentFromUrl && parentFromUrl.trim()) {
      setAutoParent(parentFromUrl.trim())
      setParentInput(parentFromUrl.trim())
      return
    }

    let isCancelled = false
    const resolvePlacement = async () => {
      const targetSponsor = sponsorInput?.trim() || CONTRACT_ADDRESSES.ROOT_ID
      if (!targetSponsor || !isAddress(targetSponsor)) {
        setAutoParent(CONTRACT_ADDRESSES.ROOT_ID)
        setParentInput(CONTRACT_ADDRESSES.ROOT_ID)
        return
      }

      setIsResolvingParent(true)
      try {
        const client = createPublicClient({
          chain: Number(chainId) === 97 ? bscTestnet : bsc,
          transport: http(getRpcUrl(chainId)),
        })

        let curr = targetSponsor
        let depth = 0
        const MAX_DEPTH = 30

        while (curr && curr !== '0x0000000000000000000000000000000000000000' && depth < MAX_DEPTH) {
          depth++
          const userNode = await client.readContract({
            address: CONTRACT_ADDRESSES.GATEWAY,
            abi: ELZORA_GATEWAY_ABI,
            functionName: 'getUser',
            args: [curr],
          })

          const child = position === 1 ? userNode.leftChild : userNode.rightChild
          if (!child || child === '0x0000000000000000000000000000000000000000') {
            if (!isCancelled) {
              setAutoParent(curr)
              setParentInput(curr)
              setIsResolvingParent(false)
            }
            return
          }
          curr = child
        }

        if (!isCancelled) {
          setAutoParent(targetSponsor)
          setParentInput(targetSponsor)
          setIsResolvingParent(false)
        }
      } catch (err) {
        console.warn('Auto placement parent resolution fallback:', err)
        if (!isCancelled) {
          setAutoParent(targetSponsor)
          setParentInput(targetSponsor)
          setIsResolvingParent(false)
        }
      }
    }

    resolvePlacement()
    return () => { isCancelled = true }
  }, [sponsorInput, position, chainId, parentFromUrl, CONTRACT_ADDRESSES.GATEWAY, CONTRACT_ADDRESSES.ROOT_ID])

  const REGISTRATION_PRICE = '50'
  const isNeedsApproval = Number(usdtAllowance || 0) < Number(REGISTRATION_PRICE)

  const handleApprove = async () => {
    setSuccessMsg('')
    try {
      await approveUSDT(REGISTRATION_PRICE)
      setSuccessMsg(`USDT spending limit of $${REGISTRATION_PRICE} approved successfully!`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setSuccessMsg('')

    const finalSponsor = sponsorInput?.trim() || CONTRACT_ADDRESSES.ROOT_ID
    const finalParent = parentInput?.trim() || autoParent?.trim() || finalSponsor

    if (!finalSponsor) return
    if (!finalParent) return

    try {
      await register(finalSponsor, finalParent, position)
      setSuccessMsg('Registration Successful! Redirecting to ELZORA Dashboard...')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse at 50% 10%, #1e1145 0%, #060814 80%)',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <BackgroundCanvas />

      {/* TOP HEADER */}
      <header style={{ padding: '20px 0', borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
                background: 'linear-gradient(135deg, #f8fafc, #c084fc 40%, #6366f1 80%, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ELZORA
            </span>
          </Link>
          <ConnectWalletButton />
        </div>
      </header>

      {/* REGISTRATION FORM */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', zIndex: 10 }}>
        <div
          style={{
            width: '100%',
            maxWidth: 580,
            background: 'rgba(13, 18, 45, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: 24,
            padding: '36px 32px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.2)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 20,
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#c084fc',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              <Sparkles size={15} color="#c084fc" />
              <span>Decentralized Binary Matrix</span>
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '4px 0 8px', letterSpacing: '-0.02em' }}>
              Join ELZORA Ecosystem
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Activate your binary position with the standard $50 USDT package
            </p>
          </div>

          {/* PACKAGE BADGE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: '#c084fc', fontWeight: 600 }}>MEMBERSHIP PACKAGE</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>$50.00 USDT</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div>Wallet Balance:</div>
              <div style={{ fontWeight: 700, color: '#38bdf8' }}>${Number(usdtBalance).toFixed(2)} USDT</div>
            </div>
          </div>

          <form onSubmit={handleRegister}>
            {/* SPONSOR ADDRESS */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Direct Sponsor Wallet Address:
              </label>
              <input
                type="text"
                value={sponsorInput}
                onChange={(e) => setSponsorInput(e.target.value)}
                placeholder="0x..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(6, 8, 20, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
                required
              />
            </div>

            {/* POSITION SELECTOR (LEFT / RIGHT) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                Select Binary Placement Position:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setPosition(1)}
                  style={{
                    padding: '14px',
                    borderRadius: 14,
                    border: position === 1 ? '2px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.2)',
                    background: position === 1 ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.3))' : 'rgba(6, 8, 20, 0.6)',
                    color: position === 1 ? '#c084fc' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <GitCommit size={18} />
                  <span>LEFT LEG</span>
                  {position === 1 && <Check size={16} color="#8b5cf6" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPosition(2)}
                  style={{
                    padding: '14px',
                    borderRadius: 14,
                    border: position === 2 ? '2px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.2)',
                    background: position === 2 ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.3))' : 'rgba(6, 8, 20, 0.6)',
                    color: position === 2 ? '#c084fc' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <GitCommit size={18} />
                  <span>RIGHT LEG</span>
                  {position === 2 && <Check size={16} color="#8b5cf6" />}
                </button>
              </div>
            </div>

            {/* AUTOMATED PLACEMENT BADGE (NO MANUAL ID NEEDED) */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={14} color="#c084fc" />
                  <span>Automated Spillover Placement</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: '#f8fafc', fontWeight: 700, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Auto-Placing at:</span>
                  <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                    {isResolvingParent ? 'Finding vacant node...' : `${autoParent ? `${autoParent.slice(0, 8)}...${autoParent.slice(-6)}` : 'Sponsor'}`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>
                    ({position === 1 ? 'Left Leg' : 'Right Leg'})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Settings size={12} />
                <span>{showAdvanced ? 'Hide Custom' : 'Custom'}</span>
              </button>
            </div>

            {/* OPTIONAL CUSTOM PLACEMENT OVERRIDE (HIDDEN BY DEFAULT) */}
            {showAdvanced && (
              <div style={{ marginBottom: 18, padding: 14, borderRadius: 12, background: 'rgba(6, 8, 20, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Custom Placement Parent Address (Optional Manual Override):
                </label>
                <input
                  type="text"
                  value={parentInput}
                  onChange={(e) => setParentInput(e.target.value)}
                  placeholder="0x..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* 100% ALLOCATION BREAKDOWN ACCORDION / SUMMARY */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(6, 8, 20, 0.6)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.78rem',
                color: '#94a3b8',
                marginBottom: 24,
              }}
            >
              <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>100% USDT Allocation Breakdown:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                <div>• Direct Income: <strong style={{ color: '#f8fafc' }}>$10 (20%)</strong></div>
                <div>• Affiliate (20L): <strong style={{ color: '#f8fafc' }}>$7 (14%)</strong></div>
                <div>• Club Matrix: <strong style={{ color: '#f8fafc' }}>$12 (24%)</strong></div>
                <div>• Binary Matching: <strong style={{ color: '#f8fafc' }}>$10 (20%)</strong></div>
                <div>• Champion Pool: <strong style={{ color: '#f8fafc' }}>$3 (6%)</strong></div>
                <div>• Weekly Pool: <strong style={{ color: '#f8fafc' }}>$3 (6%)</strong></div>
                <div>• Lifetime Rewards: <strong style={{ color: '#f8fafc' }}>$5 (10%)</strong></div>
                <div style={{ color: '#10b981', fontWeight: 700 }}>• Total: $50 (100%)</div>
              </div>
            </div>

            {/* NOTIFICATIONS */}
            {error && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontSize: '0.85rem',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SUBMIT BUTTONS (2-STEP APPROVE -> REGISTER) */}
            {!isConnected ? (
              <div style={{ textAlign: 'center' }}>
                <ConnectWalletButton size="large" />
              </div>
            ) : isNeedsApproval ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>{loading ? 'Approving USDT Limit...' : 'Step 1: Approve $50 USDT Spending'}</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || Number(usdtBalance) < 50}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: loading || Number(usdtBalance) < 50 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 25px rgba(139, 92, 246, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>{loading ? 'Activating Membership On-Chain...' : 'Step 2: Complete $50 Registration'}</span>
                <ArrowRight size={18} />
              </button>
            )}

            {isConnected && Number(usdtBalance) < 50 && (
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.8rem', color: '#f87171' }}>
                Insufficient USDT balance. You need at least 50 USDT to register.
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  )
}

export default RegisterPage
