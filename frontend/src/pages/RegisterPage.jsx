import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useChainId } from 'wagmi'
import { createPublicClient, http, isAddress } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useTetherStream } from '../hooks/useTetherStream'
import { ConnectWalletButton } from '../components/ConnectWalletButton'
import { PublicNavbar } from '../components/PublicNavbar'
import BackgroundCanvas from '../components/BackgroundCanvas'
import { PageTransitionShell, FloatingParticles } from '../components/MotionPrimitives'
import { getRpcUrl, ELZORA_GATEWAY_ABI } from '../web3/contracts'
import { getStoredReferral } from '../utils/referral'
import { formatErrorMessage } from '../utils/errorMessages'
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
    error: tetherError,
    approveUSDT,
    register,
    CONTRACT_ADDRESSES,
  } = useTetherStream()

  const refFromUrl = searchParams.get('ref') || searchParams.get('sponsor') || getStoredReferral() || ''
  const parentFromUrl = searchParams.get('parent') || ''
  const posFromUrl = searchParams.get('pos') || searchParams.get('position') || '1'

  const [sponsorInput, setSponsorInput] = useState(refFromUrl || CONTRACT_ADDRESSES.ROOT_ID)
  const [parentInput, setParentInput] = useState(parentFromUrl || refFromUrl || CONTRACT_ADDRESSES.ROOT_ID)
  const [autoParent, setAutoParent] = useState(parentFromUrl || refFromUrl || CONTRACT_ADDRESSES.ROOT_ID)
  const [isResolvingParent, setIsResolvingParent] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(Boolean(parentFromUrl))
  const [position, setPosition] = useState(Number(posFromUrl) === 2 ? 2 : 1) // 1 = Left, 2 = Right
  const [successMsg, setSuccessMsg] = useState('')
  const [customError, setCustomError] = useState('')

  // Sync referral parameters if URL or stored referral changes or loads late
  useEffect(() => {
    const activeRef = searchParams.get('ref') || searchParams.get('sponsor') || getStoredReferral()
    if (activeRef && activeRef !== CONTRACT_ADDRESSES.ROOT_ID) {
      setSponsorInput(activeRef)
      if (!parentFromUrl) {
        setParentInput(activeRef)
        setAutoParent(activeRef)
      }
    }
  }, [searchParams, parentFromUrl, CONTRACT_ADDRESSES.ROOT_ID])

  // Redirect if already registered
  useEffect(() => {
    if (profile && (profile.active || profile.isRegistered)) {
      navigate('/dashboard', { replace: true })
    }
  }, [profile?.active, profile?.isRegistered, navigate])

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

  const [localApproved, setLocalApproved] = useState(false)

  const REGISTRATION_PRICE = '50'
  const isNeedsApproval = !localApproved && Number(usdtAllowance || 0) < Number(REGISTRATION_PRICE)

  const handleApprove = async () => {
    setSuccessMsg('')
    setCustomError('')
    try {
      await approveUSDT(REGISTRATION_PRICE)
      setLocalApproved(true)
      setSuccessMsg(`USDT spending limit of $${REGISTRATION_PRICE} approved successfully! You can now proceed to Register.`)
    } catch (err) {
      console.error(err)
      setCustomError(formatErrorMessage(err, 'Failed to approve USDT spending. Please check your wallet.'))
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setSuccessMsg('')
    setCustomError('')

    const finalSponsor = sponsorInput?.trim() || CONTRACT_ADDRESSES.ROOT_ID
    const finalParent = parentInput?.trim() || autoParent?.trim() || finalSponsor

    if (!finalSponsor) {
      setCustomError('Please enter a valid sponsor address.')
      return
    }
    if (!finalParent) {
      setCustomError('Placement parent address is required.')
      return
    }

    try {
      await register(finalSponsor, finalParent, position)
      setSuccessMsg('Registration Successful! Redirecting to ELZORA Dashboard...')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      console.error(err)
      setCustomError(formatErrorMessage(err, 'Registration failed. Please check your USDT balance and network.'))
    }
  }

  const displayError = customError || (tetherError ? formatErrorMessage(tetherError, 'An unexpected error occurred.') : '')

  return (
    <PageTransitionShell
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.12) 0%, #030408 80%)',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <FloatingParticles />
      <BackgroundCanvas />

      {/* TOP NAVBAR (BLACK & GOLD THEME, IDENTICAL TO HOMEPAGE) */}
      <PublicNavbar />

      {/* REGISTRATION FORM CONTAINER */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 20px',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 620,
            background: 'linear-gradient(165deg, rgba(14, 18, 28, 0.94) 0%, rgba(6, 8, 14, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(245, 158, 11, 0.32)',
            borderRadius: 24,
            padding: '38px 32px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(254, 240, 138, 0.12)',
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
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(217, 119, 6, 0.1))',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                color: '#fbbf24',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              <Sparkles size={14} color="#ffd700" />
              <span>Decentralized Binary Matrix</span>
            </div>
            <h1
              style={{
                fontSize: '2.1rem',
                fontWeight: 900,
                margin: '4px 0 8px',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 15%, #fde047 50%, #f59e0b 82%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
              }}
            >
              Join ELZORA Ecosystem
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.94rem', margin: 0, lineHeight: 1.5 }}>
              Activate your binary position with the standard $50 USDT package
            </p>
          </div>

          {/* PACKAGE BADGE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 22px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(217, 119, 6, 0.08) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.38)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(254, 240, 138, 0.14)',
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#fbbf24',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                MEMBERSHIP PACKAGE
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
                  marginTop: 2,
                }}
              >
                $50.00 <span style={{ fontSize: '0.9rem', color: '#fde047', fontWeight: 700 }}>USDT</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#94a3b8' }}>
              <div>Wallet Balance:</div>
              <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1.05rem', marginTop: 2 }}>
                ${Number(usdtBalance || 0).toFixed(2)} USDT
              </div>
            </div>
          </div>

          <form onSubmit={handleRegister}>
            {/* SPONSOR ADDRESS */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0' }}>
                  Direct Sponsor Wallet Address:
                </label>
                <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>
                  100% On-Chain Placement
                </span>
              </div>
              <input
                type="text"
                value={sponsorInput}
                onChange={(e) => setSponsorInput(e.target.value)}
                placeholder="0x..."
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 12,
                  background: 'rgba(5, 7, 14, 0.85)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#fbbf24'
                  e.target.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.25)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(245, 158, 11, 0.3)'
                  e.target.style.boxShadow = 'none'
                }}
                required
              />
            </div>

            {/* POSITION SELECTOR (LEFT / RIGHT) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                Select Binary Placement Position:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setPosition(1)}
                  style={{
                    padding: '14px',
                    borderRadius: 14,
                    border: position === 1 ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.18)',
                    background:
                      position === 1
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.24), rgba(217, 119, 6, 0.16))'
                        : 'rgba(5, 7, 14, 0.7)',
                    color: position === 1 ? '#fbbf24' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: position === 1 ? '0 8px 22px -4px rgba(245, 158, 11, 0.38)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <GitCommit size={18} color={position === 1 ? '#fbbf24' : '#94a3b8'} />
                  <span>LEFT LEG</span>
                  {position === 1 && <Check size={16} color="#fbbf24" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPosition(2)}
                  style={{
                    padding: '14px',
                    borderRadius: 14,
                    border: position === 2 ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.18)',
                    background:
                      position === 2
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.24), rgba(217, 119, 6, 0.16))'
                        : 'rgba(5, 7, 14, 0.7)',
                    color: position === 2 ? '#fbbf24' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: position === 2 ? '0 8px 22px -4px rgba(245, 158, 11, 0.38)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <GitCommit size={18} color={position === 2 ? '#fbbf24' : '#94a3b8'} />
                  <span>RIGHT LEG</span>
                  {position === 2 && <Check size={16} color="#fbbf24" />}
                </button>
              </div>
            </div>

            {/* AUTOMATED PLACEMENT BADGE (NO MANUAL ID NEEDED) */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.28)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: '#fbbf24',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Zap size={14} color="#ffd700" />
                  <span>Automated Spillover Placement</span>
                </div>
                <div
                  style={{
                    fontSize: '0.84rem',
                    color: '#f8fafc',
                    fontWeight: 700,
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>Auto-Placing at:</span>
                  <span style={{ fontFamily: 'monospace', color: '#fde047' }}>
                    {isResolvingParent
                      ? 'Finding vacant node...'
                      : `${autoParent ? `${autoParent.slice(0, 8)}...${autoParent.slice(-6)}` : 'Sponsor'}`}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#fbbf24',
                      background: 'rgba(245, 158, 11, 0.15)',
                      padding: '2px 8px',
                      borderRadius: 8,
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    {position === 1 ? 'Left Leg' : 'Right Leg'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  padding: '5px 10px',
                  borderRadius: 8,
                  color: '#fbbf24',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s ease',
                }}
              >
                <Settings size={12} color="#fbbf24" />
                <span>{showAdvanced ? 'Hide Custom' : 'Custom'}</span>
              </button>
            </div>

            {/* OPTIONAL CUSTOM PLACEMENT OVERRIDE (HIDDEN BY DEFAULT) */}
            {showAdvanced && (
              <div
                style={{
                  marginBottom: 18,
                  padding: 14,
                  borderRadius: 12,
                  background: 'rgba(5, 7, 14, 0.85)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: 6,
                  }}
                >
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
                    background: 'rgba(10, 14, 24, 0.9)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* 100% ALLOCATION BREAKDOWN */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 14,
                background: 'rgba(5, 7, 14, 0.75)',
                border: '1px solid rgba(245, 158, 11, 0.22)',
                fontSize: '0.78rem',
                color: '#94a3b8',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  color: '#fbbf24',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Layers size={14} color="#ffd700" />
                <span>100% USDT ALLOCATION BREAKDOWN:</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
                <div>• Direct Income: <strong style={{ color: '#f8fafc' }}>$10 (20%)</strong></div>
                <div>• Affiliate (20L): <strong style={{ color: '#f8fafc' }}>$7 (14%)</strong></div>
                <div>• Club Matrix: <strong style={{ color: '#f8fafc' }}>$12 (24%)</strong></div>
                <div>• Binary Matching: <strong style={{ color: '#f8fafc' }}>$10 (20%)</strong></div>
                <div>• Champion Pool: <strong style={{ color: '#f8fafc' }}>$3 (6%)</strong></div>
                <div>• Weekly Pool: <strong style={{ color: '#f8fafc' }}>$3 (6%)</strong></div>
                <div>• Lifetime Rewards: <strong style={{ color: '#f8fafc' }}>$5 (10%)</strong></div>
                <div style={{ color: '#ffd700', fontWeight: 800 }}>• Total: $50 (100%)</div>
              </div>
            </div>

            {/* NOTIFICATIONS */}
            {displayError && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{displayError}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
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
            ) : profile?.isRegistered || profile?.active ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    marginBottom: 12,
                    color: '#34d399',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>This wallet is already registered in ELZORA!</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: 14,
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    background: 'linear-gradient(135deg, #ffd700 0%, #f59e0b 50%, #d97706 100%)',
                    color: '#080a10',
                    fontSize: '1.02rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 12px 28px rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={18} color="#080a10" />
                </button>
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
                  border: '1px solid rgba(254, 240, 138, 0.35)',
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 12px 28px rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.25s ease',
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
                  border: '1px solid rgba(254, 240, 138, 0.5)',
                  background: 'linear-gradient(135deg, #ffd700 0%, #f59e0b 50%, #d97706 100%)',
                  color: '#080a10',
                  fontSize: '1.02rem',
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  cursor: loading || Number(usdtBalance) < 50 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 14px 35px rgba(245, 158, 11, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.25s ease',
                }}
              >
                <span>{loading ? 'Activating Membership On-Chain...' : 'Step 2: Complete $50 Registration'}</span>
                <ArrowRight size={18} color="#080a10" />
              </button>
            )}

            {isConnected && Number(usdtBalance) < 50 && (
              <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.82rem', color: '#f87171' }}>
                Insufficient USDT balance. You need at least 50 USDT to register.
              </div>
            )}
          </form>
        </div>
      </main>
    </PageTransitionShell>
  )
}

export default RegisterPage
