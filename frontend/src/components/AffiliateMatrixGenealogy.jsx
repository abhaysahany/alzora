import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useChainId } from 'wagmi'
import { createPublicClient, http, isAddress, getAddress } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import {
  getRpcUrl,
  getContractAddresses,
  getTokenDecimals,
  ELZORA_GATEWAY_ABI,
} from '../web3/contracts'
import {
  GitCommit,
  Network,
  Users,
  Search,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowUpRight,
  CornerLeftUp,
  ShieldCheck,
  Award,
  DollarSign,
  Info,
  Maximize2,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { TreeZoomControls } from './TreeZoomControls'

const CLUB_RANKS = [
  'Member',
  'Starter',
  'Leader',
  'Achiever',
  'Mentor',
  'Director',
  'Elite',
  'Crown',
  'Legend',
]

const RANK_BADGE_COLORS = {
  None: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
  Member: { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' },
  Starter: { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 0.4)', text: '#818cf8' },
  Leader: { bg: 'rgba(56, 189, 248, 0.2)', border: 'rgba(56, 189, 248, 0.4)', text: '#38bdf8' },
  Achiever: { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: '#c084fc' },
  Mentor: { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 0.4)', text: '#f472b6' },
  Director: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24' },
  Elite: { bg: 'rgba(74, 222, 128, 0.2)', border: 'rgba(74, 222, 128, 0.4)', text: '#4ade80' },
  Crown: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.4)', text: '#fb923c' },
  Legend: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171' },
}

export function AffiliateMatrixGenealogy({
  isAdmin = false,
  userAddress = null,
  embedded = false,
}) {
  const [searchParams] = useSearchParams()
  const focusParam = searchParams.get('focus') || searchParams.get('id') || searchParams.get('address')

  const chainId = useChainId()
  const activeChainId = Number(chainId) === 56 ? 56 : 97
  const activeChain = activeChainId === 97 ? bscTestnet : bsc
  const rpcUrl = getRpcUrl(activeChainId)
  const CONTRACT_ADDRESSES = getContractAddresses(activeChainId)
  const tokenDecimals = getTokenDecimals(activeChainId)

  // Zoom & Visible Depth State
  const [zoom, setZoom] = useState(1)
  const [visibleDepth, setVisibleDepth] = useState(3) // 2, 3, 4, or 5 levels
  const [activeTab, setActiveTab] = useState('tree') // 'tree', 'levels', or 'upline'

  // Navigation & Matrix State
  const [focusId, setFocusId] = useState(1) // 1-indexed global matrix ID
  const [myMatrixId, setMyMatrixId] = useState(null)
  const [totalMatrixUsers, setTotalMatrixUsers] = useState(0)
  const [breadcrumbs, setBreadcrumbs] = useState([1])
  const [nodesCache, setNodesCache] = useState({}) // id -> node details
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchError, setSearchError] = useState(null)
  const [copiedAddr, setCopiedAddr] = useState(null)
  const [selectedNodeModal, setSelectedNodeModal] = useState(null)

  // Create Viem Public Client
  const client = useMemo(() => {
    return createPublicClient({
      chain: activeChain,
      transport: http(rpcUrl),
    })
  }, [activeChain, rpcUrl])

  // Helper: Copy Address
  const copyToClipboard = (text, e) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedAddr(text)
    setTimeout(() => setCopiedAddr(null), 2000)
  }

  // Load My Matrix ID & Total Users on Mount / Wallet change
  useEffect(() => {
    let isCancelled = false
    async function initMatrix() {
      try {
        const count = await client.readContract({
          address: CONTRACT_ADDRESSES.GATEWAY,
          abi: ELZORA_GATEWAY_ABI,
          functionName: 'getGlobalMatrixUsersCount',
        })
        if (isCancelled) return
        const total = Number(count || 0n)
        setTotalMatrixUsers(total)

        // Check if query param focus is requested
        if (focusParam) {
          const rawParam = focusParam.trim()
          if (/^\d+$/.test(rawParam)) {
            const pId = Number(rawParam)
            if (pId >= 1) {
              setFocusId(pId)
              setBreadcrumbs([pId])
              return
            }
          } else if (/^0x[a-fA-F0-9]{40}$/i.test(rawParam)) {
            try {
              const pIdBig = await client.readContract({
                address: CONTRACT_ADDRESSES.GATEWAY,
                abi: ELZORA_GATEWAY_ABI,
                functionName: 'userGlobalMatrixId',
                args: [getAddress(rawParam)],
              })
              const pId = Number(pIdBig || 0n)
              if (pId > 0) {
                setFocusId(pId)
                setBreadcrumbs([pId])
                return
              }
            } catch {}
          }
        }

        const effectiveUser = userAddress && /^0x[a-fA-F0-9]{40}$/i.test(userAddress) ? getAddress(userAddress) : null

        if (effectiveUser) {
          const myIdBig = await client.readContract({
            address: CONTRACT_ADDRESSES.GATEWAY,
            abi: ELZORA_GATEWAY_ABI,
            functionName: 'userGlobalMatrixId',
            args: [effectiveUser],
          })
          if (isCancelled) return
          const myId = Number(myIdBig || 0n)
          if (myId > 0) {
            setMyMatrixId(myId)
            // If not admin, set focus to user's own matrix ID by default
            if (!isAdmin) {
              setFocusId(myId)
              setBreadcrumbs([myId])
            }
          } else if (isAdmin) {
            setFocusId(1)
            setBreadcrumbs([1])
          }
        } else if (isAdmin) {
          setFocusId(1)
          setBreadcrumbs([1])
        }
      } catch (err) {
        console.error('Error initializing affiliate matrix:', err)
      }
    }
    initMatrix()
    return () => {
      isCancelled = true
    }
  }, [client, CONTRACT_ADDRESSES.GATEWAY, userAddress, isAdmin])

  // Generate Matrix IDs to fetch based on focusId and visibleDepth
  const currentViewIds = useMemo(() => {
    const ids = []
    if (!focusId || focusId < 1) return ids

    for (let d = 0; d <= visibleDepth; d++) {
      const levelStart = focusId * Math.pow(2, d)
      const countAtLevel = Math.pow(2, d)
      for (let i = 0; i < countAtLevel; i++) {
        ids.push({
          id: levelStart + i,
          level: d,
          indexAtLevel: i,
          parentId: Math.floor((levelStart + i) / 2),
        })
      }
    }
    return ids
  }, [focusId, visibleDepth])

  // Fetch Node Data for current view
  const fetchNodesData = useCallback(async () => {
    if (!currentViewIds.length) return
    setLoading(true)

    try {
      const idsToFetch = currentViewIds.map((item) => item.id)
      const newCache = { ...nodesCache }
      const missingIds = idsToFetch.filter((id) => !newCache[id])

      if (missingIds.length > 0) {
        // Fetch addresses for missing IDs
        const addrPromises = missingIds.map(async (id) => {
          if (totalMatrixUsers > 0 && id > totalMatrixUsers) {
            return { id, address: '0x0000000000000000000000000000000000000000', exists: false }
          }
          try {
            const addr = await client.readContract({
              address: CONTRACT_ADDRESSES.GATEWAY,
              abi: ELZORA_GATEWAY_ABI,
              functionName: 'globalMatrixUsers',
              args: [BigInt(id)],
            })
            const isValid = addr && addr !== '0x0000000000000000000000000000000000000000'
            return { id, address: addr, exists: isValid }
          } catch {
            return { id, address: '0x0000000000000000000000000000000000000000', exists: false }
          }
        })

        const addrResults = await Promise.all(addrPromises)

        // For existing addresses, fetch user profile & income
        const detailPromises = addrResults.map(async ({ id, address, exists }) => {
          if (!exists) {
            return {
              id,
              address,
              exists: false,
              isRegistered: false,
              sponsor: '0x0000000000000000000000000000000000000000',
              directCount: 0,
              rank: 0,
              rankName: 'Member',
              affiliateIncome: 0,
              totalIncome: 0,
            }
          }

          try {
            const [profile, incomes] = await Promise.all([
              client.readContract({
                address: CONTRACT_ADDRESSES.GATEWAY,
                abi: ELZORA_GATEWAY_ABI,
                functionName: 'getUser',
                args: [address],
              }),
              client.readContract({
                address: CONTRACT_ADDRESSES.GATEWAY,
                abi: ELZORA_GATEWAY_ABI,
                functionName: 'getIncomeBreakdown',
                args: [address],
              }),
            ])

            const rankNum = Number(profile.currentRank || 0)
            const divisor = Math.pow(10, tokenDecimals)
            const affiliateIncomeUsd = Number(incomes.affiliateIncome || 0n) / divisor
            const totalIncomeUsd = Number(profile.totalIncomeEarned || 0n) / divisor

            return {
              id,
              address,
              exists: true,
              isRegistered: Boolean(profile.isRegistered),
              sponsor: profile.sponsor,
              directCount: Number(profile.directCount || 0n),
              rank: rankNum,
              rankName: CLUB_RANKS[rankNum] || 'Member',
              affiliateIncome: affiliateIncomeUsd,
              totalIncome: totalIncomeUsd,
            }
          } catch {
            return {
              id,
              address,
              exists: true,
              isRegistered: true,
              sponsor: '0x0000000000000000000000000000000000000000',
              directCount: 0,
              rank: 0,
              rankName: 'Member',
              affiliateIncome: 0,
              totalIncome: 0,
            }
          }
        })

        const details = await Promise.all(detailPromises)
        details.forEach((d) => {
          newCache[d.id] = d
        })
        setNodesCache(newCache)
      }
    } catch (err) {
      console.error('Error fetching affiliate matrix nodes:', err)
    } finally {
      setLoading(false)
    }
  }, [
    currentViewIds,
    nodesCache,
    totalMatrixUsers,
    client,
    CONTRACT_ADDRESSES.GATEWAY,
    tokenDecimals,
  ])

  useEffect(() => {
    fetchNodesData()
  }, [fetchNodesData])

  // Navigation Handlers
  const handleSelectFocus = (targetId) => {
    if (!targetId || targetId < 1) return
    const idNum = Number(targetId)

    // Build breadcrumbs path
    const path = []
    let curr = idNum
    while (curr >= 1) {
      path.unshift(curr)
      curr = Math.floor(curr / 2)
    }

    setFocusId(idNum)
    setBreadcrumbs(path)
    setSelectedNodeModal(null)
  }

  const handleStepUp = () => {
    if (focusId <= 1) return
    const parentId = Math.floor(focusId / 2)
    handleSelectFocus(parentId)
  }

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    setSearchError(null)
    const query = searchInput.trim().replace('#', '')
    if (!query) return

    // 1. If numeric string -> matrix ID search
    if (/^\d+$/.test(query)) {
      const idNum = Number(query)
      if (idNum < 1) {
        setSearchError('Matrix ID must be 1 or higher.')
        return
      }
      if (totalMatrixUsers > 0 && idNum > totalMatrixUsers) {
        setSearchError(`Matrix ID #${idNum} has not been created yet. Total matrix members: ${totalMatrixUsers}.`)
        return
      }
      handleSelectFocus(idNum)
      setSearchInput('')
      return
    }

    // 2. If 0x address -> lookup userGlobalMatrixId
    if (/^0x[a-fA-F0-9]{40}$/i.test(query)) {
      try {
        setLoading(true)
        const normalized = getAddress(query)
        const idBig = await client.readContract({
          address: CONTRACT_ADDRESSES.GATEWAY,
          abi: ELZORA_GATEWAY_ABI,
          functionName: 'userGlobalMatrixId',
          args: [normalized],
        })
        const id = Number(idBig || 0n)
        if (id > 0) {
          handleSelectFocus(id)
          setSearchInput('')
        } else {
          setSearchError('This address is not registered in the ELZORA Global Matrix.')
        }
      } catch {
        setSearchError('Could not verify address on chain.')
      } finally {
        setLoading(false)
      }
      return
    }

    setSearchError('Please enter a valid Matrix ID (e.g. 5) or 0x wallet address.')
  }

  // 20-Level Matrix Breakdown Data (calculated analytically from global matrix formula)
  const levelBreakdown = useMemo(() => {
    if (!focusId || focusId < 1) return []

    const rows = []
    for (let lvl = 1; lvl <= 20; lvl++) {
      const rateUsd = lvl <= 10 ? 0.40 : 0.30
      const capacity = Math.pow(2, lvl)
      const startId = focusId * capacity
      const endId = startId + capacity - 1

      let activeCount = 0
      if (totalMatrixUsers >= startId) {
        const availableInBlock = totalMatrixUsers - startId + 1
        activeCount = Math.min(capacity, availableInBlock)
      }

      const potentialUsd = capacity * rateUsd
      const earnedUsd = activeCount * rateUsd
      const fillPercent = capacity > 0 ? ((activeCount / capacity) * 100).toFixed(1) : '0.0'

      rows.push({
        level: lvl,
        rateUsd,
        capacity,
        startId,
        endId,
        activeCount,
        potentialUsd,
        earnedUsd,
        fillPercent,
      })
    }
    return rows
  }, [focusId, totalMatrixUsers])

  // 20-Level Upline Ancestor Path for focused node
  const uplinePath = useMemo(() => {
    if (!focusId || focusId < 1) return []
    const path = []
    let curr = Math.floor(focusId / 2)
    for (let lvl = 1; lvl <= 20; lvl++) {
      const rateUsd = lvl <= 10 ? 0.40 : 0.30
      if (curr >= 1) {
        path.push({
          level: lvl,
          matrixId: curr,
          rateUsd,
          isRoot: curr === 1,
          divertedToTreasury: false,
        })
        curr = Math.floor(curr / 2)
      } else {
        path.push({
          level: lvl,
          matrixId: 0,
          rateUsd,
          isRoot: false,
          divertedToTreasury: true,
        })
      }
    }
    return path
  }, [focusId])

  // Focused node details
  const focusNode = nodesCache[focusId]

  return (
    <div
      style={{
        width: '100%',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', -apple-system, sans-serif",
      }}
    >
      {/* HEADER BAR */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.75) 0%, rgba(10, 14, 38, 0.85) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: 16,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Network size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                Affiliate Income Matrix (2xN Auto-Matrix)
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>14% ($7) distributed across 20 global upline levels</span>
                <span style={{ color: '#6366f1' }}>•</span>
                <span style={{ color: '#38bdf8' }}>L1–10: $0.40/member</span>
                <span style={{ color: '#6366f1' }}>•</span>
                <span style={{ color: '#c084fc' }}>L11–20: $0.30/member</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Total & My Position Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: '#94a3b8' }}>Total Global Members: </span>
            <strong style={{ color: '#38bdf8' }}>{totalMatrixUsers.toLocaleString()}</strong>
          </div>

          {myMatrixId && (
            <button
              type="button"
              onClick={() => handleSelectFocus(myMatrixId)}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                background: focusId === myMatrixId ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <Compass size={14} />
              <span>My Position (#{myMatrixId})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSelectFocus(1)}
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              background: focusId === 1 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span>Root (#1)</span>
          </button>

          <button
            type="button"
            onClick={fetchNodesData}
            disabled={loading}
            title="Refresh Matrix Data"
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* SEARCH & CONTROLS TOOLBAR */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          marginBottom: 16,
          padding: '12px 18px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: 14,
        }}
      >
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 300px', maxWidth: 460 }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Search
              size={15}
              style={{ position: 'absolute', left: 12, color: 'rgba(255, 255, 255, 0.4)' }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Matrix ID (e.g. 5) or 0x wallet address..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 10,
                background: 'rgba(6, 9, 24, 0.75)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Jump
          </button>
        </form>

        {/* Visible Depth Selector & Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Depth Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Depth:</span>
            {[2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setVisibleDepth(lvl)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: visibleDepth === lvl ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: visibleDepth === lvl ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                  color: visibleDepth === lvl ? '#fff' : '#94a3b8',
                }}
              >
                {lvl} Levels
              </button>
            ))}
          </div>

          {/* Zoom In / Zoom Out Controls */}
          <TreeZoomControls zoom={zoom} setZoom={setZoom} min={0.3} max={1.6} step={0.1} />
        </div>
      </div>

      {/* Search Error Notice */}
      {searchError && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 16,
            borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            fontSize: '0.85rem',
          }}
        >
          {searchError}
        </div>
      )}

      {/* BREADCRUMB TRAIL & STEP UP BUTTON */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16,
          padding: '8px 14px',
          background: 'rgba(10, 14, 38, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          fontSize: '0.82rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8' }}>Matrix Path:</span>
          {breadcrumbs.map((crumbId, idx) => (
            <React.Fragment key={crumbId}>
              {idx > 0 && <ChevronRight size={12} color="#64748b" />}
              <button
                type="button"
                onClick={() => handleSelectFocus(crumbId)}
                style={{
                  background: crumbId === focusId ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                  border: crumbId === focusId ? '1px solid rgba(139, 92, 246, 0.5)' : 'none',
                  color: crumbId === focusId ? '#38bdf8' : '#cbd5e1',
                  fontWeight: crumbId === focusId ? 800 : 500,
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                #{crumbId} {crumbId === 1 ? '(Root)' : ''}
              </button>
            </React.Fragment>
          ))}
        </div>

        {focusId > 1 && (
          <button
            type="button"
            onClick={handleStepUp}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.78rem',
            }}
          >
            <CornerLeftUp size={12} />
            <span>Parent (#{Math.floor(focusId / 2)})</span>
          </button>
        )}
      </div>

      {/* VIEW TABS (Tree View / 20-Level Breakdown Table / 20-Level Upline Flow) */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('tree')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'tree' ? '1px solid #8b5cf6' : '1px solid transparent',
            background: activeTab === 'tree' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.04)',
            color: activeTab === 'tree' ? '#fff' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Network size={15} />
          <span>Visual Matrix Tree ({visibleDepth} Levels)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('levels')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'levels' ? '1px solid #8b5cf6' : '1px solid transparent',
            background: activeTab === 'levels' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.04)',
            color: activeTab === 'levels' ? '#fff' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Layers size={15} />
          <span>20-Level Earnings Breakdown</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upline')}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'upline' ? '1px solid #8b5cf6' : '1px solid transparent',
            background: activeTab === 'upline' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.04)',
            color: activeTab === 'upline' ? '#fff' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <TrendingUp size={15} />
          <span>20-Level Upline Flow</span>
        </button>
      </div>

      {/* TAB 1: VISUAL GENEALOGY TREE VIEW WITH ZOOM & PAN */}
      {activeTab === 'tree' && (
        <div
          style={{
            background: 'radial-gradient(ellipse at top, rgba(26, 16, 60, 0.6) 0%, rgba(6, 8, 20, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: 20,
            padding: '30px 20px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
            minHeight: 560,
            overflowX: 'auto',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {loading && Object.keys(nodesCache).length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center', color: '#94a3b8' }}>
              <RefreshCw size={32} className="spin" style={{ marginBottom: 16, color: '#c084fc' }} />
              <div>Loading Affiliate Auto-Matrix...</div>
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: 'max-content',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingBottom: 40,
              }}
            >
              {renderTreeLevel(0, focusId)}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 20-LEVEL AFFILIATE EARNINGS BREAKDOWN */}
      {activeTab === 'levels' && (
        <div
          style={{
            background: 'rgba(10, 14, 38, 0.75)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                20-Level Downline Potential for Matrix Node #{focusId}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Every registration within these 20 levels pays instant USDT directly to wallet. Unconditional eligibility (0 directs required).
              </p>
            </div>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                fontSize: '0.88rem',
              }}
            >
              <span style={{ color: '#94a3b8' }}>Total Earned Under Focus: </span>
              <strong style={{ color: '#10b981' }}>
                ${levelBreakdown.reduce((acc, row) => acc + row.earnedUsd, 0).toFixed(2)} USDT
              </strong>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Level</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Commission Rate</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Matrix IDs Range</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Max Capacity</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Active Members</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Fill %</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Earned USDT</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Max Potential</th>
                </tr>
              </thead>
              <tbody>
                {levelBreakdown.map((row) => (
                  <tr
                    key={row.level}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: row.activeCount > 0 ? 'rgba(99, 102, 241, 0.06)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: row.level <= 10 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                          color: row.level <= 10 ? '#38bdf8' : '#c084fc',
                        }}
                      >
                        Level {row.level}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#10b981', fontWeight: 700 }}>
                      ${row.rateUsd.toFixed(2)} USDT
                    </td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                      #{row.startId.toLocaleString()} – #{row.endId.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                      {row.capacity.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: row.activeCount > 0 ? '#38bdf8' : '#64748b' }}>
                      {row.activeCount.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 50, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, Number(row.fillPercent))}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{row.fillPercent}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10b981' }}>
                      ${row.earnedUsd.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                      ${row.potentialUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: 20-LEVEL UPLINE FLOW INSPECTOR */}
      {activeTab === 'upline' && (
        <div
          style={{
            background: 'rgba(10, 14, 38, 0.75)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              20-Level Upline Flow from Node #{focusId}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Whenever someone activates at or under Node #{focusId}, affiliate income ascends through these exact 20 upline ancestor IDs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {uplinePath.map((item) => (
              <div
                key={item.level}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: item.divertedToTreasury ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                  border: item.divertedToTreasury ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: item.level <= 10 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                        color: item.level <= 10 ? '#38bdf8' : '#c084fc',
                      }}
                    >
                      Upline Level {item.level}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                      +${item.rateUsd.toFixed(2)} USDT
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                    {item.divertedToTreasury ? (
                      <span style={{ color: '#f87171' }}>Treasury Wallet (Above Root)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectFocus(item.matrixId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          padding: 0,
                          cursor: 'pointer',
                          fontWeight: 800,
                          textDecoration: 'underline',
                        }}
                      >
                        Matrix Node #{item.matrixId} {item.isRoot ? '(Root)' : ''}
                      </button>
                    )}
                  </div>
                </div>

                {!item.divertedToTreasury && (
                  <button
                    type="button"
                    onClick={() => handleSelectFocus(item.matrixId)}
                    title="Jump to this ancestor"
                    style={{
                      padding: '6px 8px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NODE DETAILS MODAL */}
      {selectedNodeModal && (
        <div
          onClick={() => setSelectedNodeModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 8, 20, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'linear-gradient(135deg, rgba(20, 26, 65, 0.98), rgba(12, 16, 42, 0.98))',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  #{selectedNodeModal.id}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                    Global Matrix Member #{selectedNodeModal.id}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {selectedNodeModal.id === 1 ? 'Root Node' : `Position: ${selectedNodeModal.id % 2 === 0 ? 'Left' : 'Right'} of Parent #${Math.floor(selectedNodeModal.id / 2)}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            </div>

            {selectedNodeModal.exists ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: 12, borderRadius: 10 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: 4 }}>Member Address:</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'monospace', color: '#fff', fontSize: '0.88rem' }}>
                      {selectedNodeModal.address}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={(e) => copyToClipboard(selectedNodeModal.address, e)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          color: copiedAddr === selectedNodeModal.address ? '#10b981' : '#cbd5e1',
                          padding: '4px 6px',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        {copiedAddr === selectedNodeModal.address ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <a
                        href={activeChainId === 56 ? `https://bscscan.com/address/${selectedNodeModal.address}` : `https://testnet.bscscan.com/address/${selectedNodeModal.address}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#cbd5e1',
                          padding: '4px 6px',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: 10, borderRadius: 10 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Affiliate Income Earned:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                      ${selectedNodeModal.affiliateIncome.toFixed(2)} USDT
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: 10, borderRadius: 10 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Total System Income:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
                      ${selectedNodeModal.totalIncome.toFixed(2)} USDT
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: 10, borderRadius: 10 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Direct Referrals:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c084fc', marginTop: 2 }}>
                      {selectedNodeModal.directCount} Members
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: 10, borderRadius: 10 }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Club Rank:</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
                      {selectedNodeModal.rankName}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleSelectFocus(selectedNodeModal.id)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Network size={16} />
                    <span>Focus Tree on This Node</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                <p>Slot #{selectedNodeModal.id} is currently empty in the global matrix.</p>
                <p style={{ fontSize: '0.8rem' }}>
                  Next user who registers will be placed automatically in accordance with the 2xN binary fill algorithm.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // Recursive Tree Level Renderer
  function renderTreeLevel(currentDepth, nodeId) {
    if (currentDepth > visibleDepth) return null

    const node = nodesCache[nodeId] || {
      id: nodeId,
      address: '0x0000000000000000000000000000000000000000',
      exists: totalMatrixUsers >= nodeId,
      isRegistered: totalMatrixUsers >= nodeId,
      sponsor: '0x0000000000000000000000000000000000000000',
      directCount: 0,
      rank: 0,
      rankName: 'Member',
      affiliateIncome: 0,
      totalIncome: 0,
    }

    const isRootOfView = currentDepth === 0
    const leftChildId = nodeId * 2
    const rightChildId = nodeId * 2 + 1
    const hasChildrenToRender = currentDepth < visibleDepth

    const rankColor = RANK_BADGE_COLORS[node.rankName] || RANK_BADGE_COLORS.Member
    const rateUsd = currentDepth === 0 ? 0 : currentDepth <= 10 ? 0.40 : 0.30

    return (
      <div
        key={nodeId}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* NODE CARD */}
        <div
          onClick={() => {
            if (node.exists) {
              setSelectedNodeModal(node)
            }
          }}
          style={{
            width: 220,
            background: isRootOfView
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.35))'
              : node.exists
              ? 'rgba(15, 23, 52, 0.85)'
              : 'rgba(255, 255, 255, 0.02)',
            border: isRootOfView
              ? '2px solid #8b5cf6'
              : node.exists
              ? '1px solid rgba(139, 92, 246, 0.4)'
              : '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: 14,
            padding: '12px 14px',
            boxShadow: isRootOfView
              ? '0 0 20px rgba(139, 92, 246, 0.4)'
              : node.exists
              ? '0 4px 16px rgba(0,0,0,0.4)'
              : 'none',
            cursor: node.exists ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
            zIndex: 2,
          }}
        >
          {/* Top Bar: ID and Position */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 6,
                background: isRootOfView
                  ? '#8b5cf6'
                  : node.id % 2 === 0
                  ? 'rgba(56, 189, 248, 0.2)'
                  : 'rgba(236, 72, 153, 0.2)',
                color: isRootOfView ? '#fff' : node.id % 2 === 0 ? '#38bdf8' : '#f472b6',
              }}
            >
              #{node.id} {isRootOfView ? '(Focus)' : node.id % 2 === 0 ? 'Left' : 'Right'}
            </span>

            {currentDepth > 0 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                +${rateUsd.toFixed(2)}
              </span>
            )}
          </div>

          {/* Member Content */}
          {node.exists ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {node.address.slice(0, 6)}...{node.address.slice(-4)}
                </span>
                <button
                  type="button"
                  onClick={(e) => copyToClipboard(node.address, e)}
                  title="Copy address"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedAddr === node.address ? '#10b981' : '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {copiedAddr === node.address ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
                <span>Affiliate:</span>
                <strong style={{ color: '#10b981', fontSize: '0.78rem' }}>${node.affiliateIncome.toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                <span>Directs:</span>
                <strong style={{ color: '#c084fc' }}>{node.directCount}</strong>
              </div>

              {/* Drill Down Button */}
              {!isRootOfView && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectFocus(node.id)
                  }}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '4px 0',
                    borderRadius: 6,
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#c084fc',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <span>Explore Subtree</span>
                  <ArrowRight size={10} />
                </button>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.75rem' }}>
              Slot Available
            </div>
          )}
        </div>

        {/* CONNECTING BRANCHES & CHILDREN */}
        {hasChildrenToRender && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Vertical stem from parent */}
            <div
              style={{
                width: 2,
                height: 20,
                background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0.6), rgba(139, 92, 246, 0.3))',
              }}
            />

            {/* Horizontal crossbar connecting left and right stems */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
                width: '100%',
              }}
            >
              {/* Children Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: currentDepth === 0 ? 40 : currentDepth === 1 ? 24 : 12,
                  position: 'relative',
                }}
              >
                {/* Horizontal branch line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '25%',
                    right: '25%',
                    height: 2,
                    background: 'rgba(139, 92, 246, 0.4)',
                  }}
                />

                {/* Left Branch */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 2, height: 16, background: 'rgba(139, 92, 246, 0.4)' }} />
                  {renderTreeLevel(currentDepth + 1, leftChildId)}
                </div>

                {/* Right Branch */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 2, height: 16, background: 'rgba(139, 92, 246, 0.4)' }} />
                  {renderTreeLevel(currentDepth + 1, rightChildId)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}
