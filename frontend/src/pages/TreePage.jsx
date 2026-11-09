import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useChainId } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { MemberLayout } from '../components/MemberLayout'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  getRpcUrl,
  getContractAddresses,
  ELZORA_GATEWAY_ABI,
} from '../web3/contracts'
import {
  GitCommit,
  User,
  Users,
  Search,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Award,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Network,
  FolderPlus,
  FolderMinus,
  Filter,
} from 'lucide-react'

const CLUB_RANKS = [
  'None',
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
  Starter: { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 0.4)', text: '#818cf8' },
  Leader: { bg: 'rgba(56, 189, 248, 0.2)', border: 'rgba(56, 189, 248, 0.4)', text: '#38bdf8' },
  Achiever: { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: '#c084fc' },
  Mentor: { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 0.4)', text: '#f472b6' },
  Director: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24' },
  Elite: { bg: 'rgba(74, 222, 128, 0.2)', border: 'rgba(74, 222, 128, 0.4)', text: '#4ade80' },
  Crown: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.4)', text: '#fb923c' },
  Legend: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171' },
}

export function TreePage() {
  const { address: connectedAddress } = useWalletAuth()
  const { profile: liveProfile } = useTetherStream()
  const chainId = useChainId()
  
  // Resolve chain & contracts dynamically with fallback to 97
  const activeChainId = Number(chainId) === 56 ? 56 : 97
  const activeChain = activeChainId === 97 ? bscTestnet : bsc
  const rpcUrl = getRpcUrl(activeChainId)
  const CONTRACT_ADDRESSES = getContractAddresses(activeChainId)

  // Always start with user's own address
  const [focusAddress, setFocusAddress] = useState(connectedAddress || '')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [copiedAddr, setCopiedAddr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [maxDepth, setMaxDepth] = useState(5) // default 5 levels
  const [expandedNodes, setExpandedNodes] = useState({}) // set of expanded user addresses in tree
  const [activeTab, setActiveTab] = useState('tree') // 'tree' or 'table'
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('all')

  // Cached profile data: address.toLowerCase() -> { address, sponsor, rank, rankName, directCount, ... }
  const [nodesMap, setNodesMap] = useState({})
  // Children mapping: sponsorAddress.toLowerCase() -> array of childAddresses
  const [childrenMap, setChildrenMap] = useState({})
  // Level mapping: address.toLowerCase() -> level number relative to focusAddress (0 = self)
  const [levelMap, setLevelMap] = useState({})

  // Keep focusAddress in sync if user connects or switches wallet
  useEffect(() => {
    if (connectedAddress && (!focusAddress || breadcrumbs.length === 0)) {
      setFocusAddress(connectedAddress)
    }
  }, [connectedAddress, focusAddress, breadcrumbs.length])

  // Helper to copy address
  const copyAddressToClipboard = (addr, e) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(addr)
    setCopiedAddr(addr)
    setTimeout(() => setCopiedAddr(null), 2000)
  }

  // Fetch full details for a member address
  const fetchMemberDetails = useCallback(async (client, userAddr) => {
    if (!userAddr || userAddr === '0x0000000000000000000000000000000000000000') return null
    try {
      const userProfile = await client.readContract({
        address: CONTRACT_ADDRESSES.GATEWAY,
        abi: ELZORA_GATEWAY_ABI,
        functionName: 'getUser',
        args: [userAddr],
      })

      const rankNum = Number(userProfile.currentRank || 0)
      const rankName = CLUB_RANKS[rankNum] || 'Starter'

      return {
        address: userAddr,
        sponsor: userProfile.sponsor,
        parent: userProfile.parent,
        position: Number(userProfile.position || 0), // 1 = Left, 2 = Right
        isRegistered: Boolean(userProfile.isRegistered),
        directCount: Number(userProfile.directCount || 0n),
        leftDirectCount: Number(userProfile.leftDirectCount || 0n),
        rightDirectCount: Number(userProfile.rightDirectCount || 0n),
        leftTeamCount: Number(userProfile.leftTeamCount || 0n),
        rightTeamCount: Number(userProfile.rightTeamCount || 0n),
        leftCarryVolume: Number(userProfile.leftCarryVolume || 0n),
        rightCarryVolume: Number(userProfile.rightCarryVolume || 0n),
        rank: rankNum,
        rankName: rankName === 'None' ? 'Starter' : rankName,
        totalIncomeEarned: Number(userProfile.totalIncomeEarned || 0n) / 1e18,
      }
    } catch (err) {
      console.warn('Could not read user profile for:', userAddr, err)
      return null
    }
  }, [CONTRACT_ADDRESSES.GATEWAY])

  // Load Sponsor Tree BFS up to maxDepth levels (1 to 6) starting with self
  const loadSponsorGenealogy = useCallback(async (rootAddr, targetDepth) => {
    if (!rootAddr || !CONTRACT_ADDRESSES.GATEWAY) return
    setLoading(true)

    try {
      const client = createPublicClient({
        chain: activeChain,
        transport: http(rpcUrl),
      })

      const newNodesMap = {}
      const newChildrenMap = {}
      const newLevelMap = {}
      const newExpanded = {}

      // 1. Fetch root node (Self ID)
      let rootDetails = await fetchMemberDetails(client, rootAddr)
      if (!rootDetails) {
        // Fallback root object so Self ID is GUARANTEED to be visible
        rootDetails = {
          address: rootAddr,
          sponsor: '0x0000000000000000000000000000000000000000',
          parent: '0x0000000000000000000000000000000000000000',
          position: 0,
          isRegistered: true,
          directCount: 0,
          leftDirectCount: 0,
          rightDirectCount: 0,
          leftTeamCount: 0,
          rightTeamCount: 0,
          leftCarryVolume: 0,
          rightCarryVolume: 0,
          rank: 1,
          rankName: 'Starter',
          totalIncomeEarned: 0,
        }
      }

      const rootKey = rootAddr.toLowerCase()
      newNodesMap[rootKey] = rootDetails
      newLevelMap[rootKey] = 0
      newExpanded[rootKey] = true

      // 2. BFS Traversal Queue for Levels 1 to targetDepth
      let currentLevelQueue = [rootAddr]

      for (let level = 1; level <= targetDepth; level++) {
        if (currentLevelQueue.length === 0) break

        // Fetch direct referrals for all addresses in currentLevelQueue
        const directPromises = currentLevelQueue.map((addr) =>
          client.readContract({
            address: CONTRACT_ADDRESSES.GATEWAY,
            abi: ELZORA_GATEWAY_ABI,
            functionName: 'getDirectReferrals',
            args: [addr],
          }).catch((err) => {
            console.warn('Failed getDirectReferrals for:', addr, err)
            return []
          })
        )

        const directsResults = await Promise.all(directPromises)

        const nextLevelQueue = []
        const membersToFetch = []

        for (let i = 0; i < currentLevelQueue.length; i++) {
          const parentAddr = currentLevelQueue[i].toLowerCase()
          const children = (directsResults[i] || []).filter(
            (c) => c && c !== '0x0000000000000000000000000000000000000000'
          )
          newChildrenMap[parentAddr] = children

          // Expand top levels by default
          if (level <= 2) {
            newExpanded[parentAddr] = true
          }

          for (const child of children) {
            const childKey = child.toLowerCase()
            newLevelMap[childKey] = level
            if (!newNodesMap[childKey]) {
              membersToFetch.push(child)
              nextLevelQueue.push(child)
            }
          }
        }

        // Batch fetch details for all children at this level
        if (membersToFetch.length > 0) {
          const detailsPromises = membersToFetch.map((addr) => fetchMemberDetails(client, addr))
          const fetchedDetails = await Promise.all(detailsPromises)
          fetchedDetails.forEach((d) => {
            if (d) newNodesMap[d.address.toLowerCase()] = d
          })
        }

        currentLevelQueue = nextLevelQueue
      }

      setNodesMap(newNodesMap)
      setChildrenMap(newChildrenMap)
      setLevelMap(newLevelMap)
      setExpandedNodes(newExpanded)
    } catch (err) {
      console.error('Failed to load sponsor genealogy:', err)
    } finally {
      setLoading(false)
    }
  }, [activeChain, rpcUrl, CONTRACT_ADDRESSES.GATEWAY, fetchMemberDetails])

  useEffect(() => {
    if (focusAddress) {
      loadSponsorGenealogy(focusAddress, maxDepth)
    }
  }, [focusAddress, maxDepth, loadSponsorGenealogy])

  // Drill down into a downline member as new view root
  const handleDrillDown = (memberAddr) => {
    if (!memberAddr || memberAddr.toLowerCase() === focusAddress?.toLowerCase()) return
    setBreadcrumbs((prev) => [...prev, focusAddress])
    setFocusAddress(memberAddr)
  }

  // Navigate breadcrumb
  const handleBreadcrumbClick = (idx) => {
    const target = breadcrumbs[idx]
    setBreadcrumbs((prev) => prev.slice(0, idx))
    setFocusAddress(target)
  }

  // Toggle node expansion in tree
  const toggleNodeExpansion = (nodeAddr) => {
    const key = nodeAddr.toLowerCase()
    setExpandedNodes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Expand all / Collapse all
  const handleExpandAll = () => {
    const allExpanded = {}
    Object.keys(nodesMap).forEach((k) => {
      allExpanded[k] = true
    })
    setExpandedNodes(allExpanded)
  }

  const handleCollapseAll = () => {
    const allCollapsed = {}
    if (focusAddress) allCollapsed[focusAddress.toLowerCase()] = true
    setExpandedNodes(allCollapsed)
  }

  // Search Address
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim().startsWith('0x') && searchInput.trim().length === 42) {
      setBreadcrumbs((prev) => [...prev, focusAddress])
      setFocusAddress(searchInput.trim())
      setSearchInput('')
    }
  }

  const isMyRoot = focusAddress?.toLowerCase() === connectedAddress?.toLowerCase()

  // Downline members list (excluding focus root user itself, sorted by level then rank)
  const allDownlineMembers = useMemo(() => {
    if (!focusAddress) return []
    const rootKey = focusAddress.toLowerCase()
    return Object.entries(nodesMap)
      .filter(([key]) => key !== rootKey)
      .map(([key, data]) => ({
        ...data,
        level: levelMap[key] || 1,
      }))
      .sort((a, b) => a.level - b.level || b.directCount - a.directCount)
  }, [nodesMap, levelMap, focusAddress])

  // Filtered members for table
  const filteredDownlineMembers = useMemo(() => {
    if (selectedLevelFilter === 'all') return allDownlineMembers
    const targetLvl = Number(selectedLevelFilter)
    return allDownlineMembers.filter((m) => m.level === targetLvl)
  }, [allDownlineMembers, selectedLevelFilter])

  // Count by level
  const levelCounts = useMemo(() => {
    const counts = {}
    for (let i = 1; i <= maxDepth; i++) counts[i] = 0
    allDownlineMembers.forEach((m) => {
      if (counts[m.level] !== undefined) counts[m.level]++
      else counts[m.level] = 1
    })
    return counts
  }, [allDownlineMembers, maxDepth])

  // Recursive tree node renderer
  const renderTreeNode = (addr, currentLvl = 0) => {
    if (!addr) return null
    const key = addr.toLowerCase()
    
    // Retrieve node from map, or create immediate visual node for self if root
    const node = nodesMap[key] || (currentLvl === 0 ? {
      address: addr,
      sponsor: liveProfile?.sponsor || '0x0000000000000000000000000000000000000000',
      rankName: liveProfile?.rankName || 'Starter',
      directCount: liveProfile?.directCount || 0,
      leftTeamCount: liveProfile?.leftTeamCount || 0,
      rightTeamCount: liveProfile?.rightTeamCount || 0,
    } : null)

    if (!node) return null

    const children = childrenMap[key] || []
    const isExpanded = Boolean(expandedNodes[key])
    const hasChildren = children.length > 0
    const badgeStyle = RANK_BADGE_COLORS[node.rankName] || RANK_BADGE_COLORS.Starter
    const isSelfNode = currentLvl === 0

    return (
      <div key={addr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* NODE CARD */}
        <div
          style={{
            background: isSelfNode
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(168, 85, 247, 0.35) 100%)'
              : 'rgba(15, 20, 50, 0.92)',
            border: isSelfNode
              ? '2px solid rgba(192, 132, 252, 0.8)'
              : '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: 18,
            padding: '14px 18px',
            minWidth: 230,
            maxWidth: 270,
            boxShadow: isSelfNode
              ? '0 12px 30px rgba(168, 85, 247, 0.35), 0 0 20px rgba(99, 102, 241, 0.2)'
              : '0 8px 22px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'all 0.2s ease',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Top Row: Level / Self Tag & Rank */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 900,
                color: isSelfNode ? '#fbbf24' : '#cbd5e1',
                background: isSelfNode ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: isSelfNode ? '1px solid rgba(251, 191, 36, 0.5)' : 'none',
                padding: '2px 9px',
                borderRadius: 10,
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {isSelfNode ? '⭐ SELF (YOU)' : `LEVEL ${currentLvl}`}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                background: badgeStyle.bg,
                border: `1px solid ${badgeStyle.border}`,
                color: badgeStyle.text,
                padding: '2px 8px',
                borderRadius: 10,
              }}
            >
              {node.rankName}
            </span>
          </div>

          {/* Member Address & Copy */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: isSelfNode ? '#fbbf24' : '#8b5cf6',
                  color: '#060814',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                }}
              >
                {isSelfNode ? 'ME' : `L${currentLvl}`}
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.88rem', color: '#f8fafc' }}>
                {node.address.slice(0, 6)}...{node.address.slice(-4)}
              </span>
            </div>
            <button
              onClick={(e) => copyAddressToClipboard(node.address, e)}
              title="Copy address"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'inline-flex',
                padding: 2,
              }}
            >
              {copiedAddr === node.address ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            </button>
          </div>

          {/* Mini Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 4,
              background: 'rgba(6, 8, 20, 0.75)',
              padding: '6px 8px',
              borderRadius: 10,
              fontSize: '0.68rem',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Directs</span>
              <b style={{ color: '#38bdf8' }}>{node.directCount}</b>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Left</span>
              <b style={{ color: '#818cf8' }}>{node.leftTeamCount}</b>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Right</span>
              <b style={{ color: '#c084fc' }}>{node.rightTeamCount}</b>
            </div>
          </div>

          {/* Node Action Buttons */}
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            {hasChildren ? (
              <button
                onClick={() => toggleNodeExpansion(node.address)}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: 8,
                  background: isExpanded ? 'rgba(139, 92, 246, 0.25)' : 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
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
                {isExpanded ? <FolderMinus size={13} /> : <FolderPlus size={13} />}
                <span>{isExpanded ? 'Collapse' : `Directs (${children.length})`}</span>
              </button>
            ) : (
              <div
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: '#64748b',
                  fontSize: '0.68rem',
                  textAlign: 'center',
                }}
              >
                0 Directs
              </div>
            )}

            {currentLvl > 0 && (
              <button
                onClick={() => handleDrillDown(node.address)}
                title="Focus this member as tree root"
                style={{
                  padding: '5px 8px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* CONNECTOR LINE DOWN TO DIRECTS */}
        {hasChildren && isExpanded && currentLvl < maxDepth && (
          <div style={{ width: 2, height: 26, background: 'rgba(168, 85, 247, 0.5)' }} />
        )}

        {/* RECURSIVE CHILDREN CONTAINER */}
        {hasChildren && isExpanded && currentLvl < maxDepth && (
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Horizontal Branch Line connecting children */}
            {children.length > 1 && (
              <div
                style={{
                  width: `calc(100% - ${240 / children.length}px)`,
                  height: 2,
                  background: 'rgba(168, 85, 247, 0.5)',
                  position: 'absolute',
                  top: 0,
                }}
              />
            )}

            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', paddingTop: children.length > 1 ? 26 : 0 }}>
              {children.map((childAddr) => (
                <div key={childAddr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Vertical stub down from horizontal branch line */}
                  {children.length > 1 && (
                    <div style={{ width: 2, height: 26, background: 'rgba(168, 85, 247, 0.5)', marginTop: -26 }} />
                  )}
                  {renderTreeNode(childAddr, currentLvl + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <MemberLayout pageTitle="Sponsor Tree Genealogy">
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* HEADER CONTROLS */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 20,
            border: '1px solid rgba(139, 92, 246, 0.35)',
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.95) 0%, rgba(10, 14, 38, 0.98) 100%)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45), 0 0 24px rgba(139, 92, 246, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  color: '#c084fc',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  marginBottom: 6,
                }}
              >
                <Network size={13} /> 5-TO-6 LEVEL MULTI-TIER GENEALOGY EXPLORER
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Sponsor Lineage & Downline Tree
              </h1>
              <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: '0.84rem' }}>
                Starts with your Self ID at root, branching out into Directs (Level 1) and your entire downline genealogy up to Level {maxDepth}.
              </p>
            </div>

            {/* CONTROLS: DEPTH SELECTOR, SEARCH, REFRESH */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Max Depth Selector (1 to 6) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(6, 8, 20, 0.8)', padding: '4px 10px', borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Depth:</span>
                <select
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#c084fc',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value={1} style={{ background: '#0b0f24', color: '#fff' }}>1 Level (Directs)</option>
                  <option value={2} style={{ background: '#0b0f24', color: '#fff' }}>2 Levels</option>
                  <option value={3} style={{ background: '#0b0f24', color: '#fff' }}>3 Levels</option>
                  <option value={4} style={{ background: '#0b0f24', color: '#fff' }}>4 Levels</option>
                  <option value={5} style={{ background: '#0b0f24', color: '#fff' }}>5 Levels</option>
                  <option value={6} style={{ background: '#0b0f24', color: '#fff' }}>6 Levels</option>
                </select>
              </div>

              {/* Search Member */}
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search 0x... member address"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{
                      background: 'rgba(6, 8, 20, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.35)',
                      borderRadius: 12,
                      padding: '8px 12px 8px 34px',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                      width: 220,
                      outline: 'none',
                    }}
                  />
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Lookup
                </button>
              </form>

              {/* Refresh Button */}
              <button
                onClick={() => loadSponsorGenealogy(focusAddress, maxDepth)}
                disabled={loading}
                style={{
                  padding: '9px',
                  borderRadius: 12,
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#c084fc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Refresh Genealogy Tree"
              >
                <RefreshCw size={16} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {/* BREADCRUMBS & EXPAND/COLLAPSE CONTROLS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: '0.8rem' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Genealogy Path:</span>
              <button
                onClick={() => {
                  setBreadcrumbs([])
                  setFocusAddress(connectedAddress)
                }}
                style={{
                  background: isMyRoot ? 'rgba(99, 102, 241, 0.25)' : 'none',
                  border: isMyRoot ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                  color: isMyRoot ? '#f8fafc' : '#c084fc',
                  borderRadius: 8,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                }}
              >
                My Account (Self)
              </button>
              {breadcrumbs.map((addr, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight size={13} color="#64748b" />
                  <button
                    onClick={() => handleBreadcrumbClick(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                    }}
                  >
                    {addr.slice(0, 6)}...{addr.slice(-4)}
                  </button>
                </React.Fragment>
              ))}
              {!isMyRoot && (
                <>
                  <ChevronRight size={13} color="#64748b" />
                  <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                    {focusAddress?.slice(0, 6)}...{focusAddress?.slice(-4)}
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {activeTab === 'tree' && (
                <>
                  <button
                    onClick={handleExpandAll}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={handleCollapseAll}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Collapse All
                  </button>
                </>
              )}

              {/* View Switcher Tabs */}
              <div style={{ display: 'flex', background: 'rgba(6, 8, 20, 0.8)', padding: 3, borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <button
                  onClick={() => setActiveTab('tree')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 8,
                    background: activeTab === 'tree' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    border: 'none',
                    color: activeTab === 'tree' ? '#fff' : '#94a3b8',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Interactive Tree
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 8,
                    background: activeTab === 'table' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    border: 'none',
                    color: activeTab === 'table' ? '#fff' : '#94a3b8',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Downline Table ({allDownlineMembers.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LEVEL STATS SUMMARY STRIP */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maxDepth}, 1fr)`, gap: 10 }}>
          {Array.from({ length: maxDepth }, (_, i) => i + 1).map((lvl) => (
            <div
              key={lvl}
              onClick={() => {
                setActiveTab('table')
                setSelectedLevelFilter(String(lvl))
              }}
              style={{
                background: selectedLevelFilter === String(lvl) && activeTab === 'table'
                  ? 'rgba(139, 92, 246, 0.25)'
                  : 'rgba(16, 23, 60, 0.75)',
                border: selectedLevelFilter === String(lvl) && activeTab === 'table'
                  ? '1px solid #c084fc'
                  : '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: 14,
                padding: '10px 14px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.04em' }}>
                LEVEL {lvl}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: '2px 0' }}>
                {levelCounts[lvl] || 0}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#c084fc' }}>
                {lvl === 1 ? 'Directs' : 'Downline'}
              </div>
            </div>
          ))}
        </div>

        {/* TAB 1: INTERACTIVE SPONSOR TREE VIEW */}
        {activeTab === 'tree' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: 20,
              padding: '28px 20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              minHeight: 520,
              overflowX: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {loading && !nodesMap[focusAddress?.toLowerCase()] ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#c084fc', fontWeight: 700, fontSize: '0.95rem' }}>
                <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                Loading Level 1 to {maxDepth} Genealogy Tree from Blockchain...
              </div>
            ) : !focusAddress ? (
              <div style={{ padding: 60, color: '#94a3b8' }}>Connect wallet or enter address to view sponsor tree.</div>
            ) : (
              <div style={{ padding: '10px 20px 40px', minWidth: 'fit-content' }}>
                {renderTreeNode(focusAddress, 0)}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOWNLINE MEMBERS DIRECTORY TABLE */}
        {activeTab === 'table' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(10, 14, 38, 0.95) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: 20,
              padding: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: 8, borderRadius: 10, background: 'rgba(168, 85, 247, 0.2)' }}>
                  <Users size={18} color="#c084fc" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc' }}>
                    Downline Members Directory ({filteredDownlineMembers.length})
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    Showing all sponsored team members up to Level {maxDepth}
                  </span>
                </div>
              </div>

              {/* Level Filter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Filter Level:</span>
                <button
                  onClick={() => setSelectedLevelFilter('all')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 8,
                    background: selectedLevelFilter === 'all' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  All ({allDownlineMembers.length})
                </button>
                {Array.from({ length: maxDepth }, (_, i) => i + 1).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelFilter(String(lvl))}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 8,
                      background: selectedLevelFilter === String(lvl) ? '#a855f7' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    L{lvl} ({levelCounts[lvl] || 0})
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#c084fc', fontWeight: 700, fontSize: '0.9rem' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                Loading Downline Data from Blockchain...
              </div>
            ) : filteredDownlineMembers.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  background: 'rgba(6, 8, 20, 0.5)',
                  borderRadius: 14,
                  border: '1px dashed rgba(139, 92, 246, 0.3)',
                }}
              >
                <Users size={32} color="#64748b" style={{ margin: '0 auto 8px' }} />
                <div style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.92rem' }}>No Members Found at This Level</div>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', maxWidth: 460, margin: '6px auto 14px' }}>
                  {isMyRoot
                    ? 'Expand your personal direct team to build deep multi-level genealogy downlines.'
                    : 'This member does not have active referrals at this depth yet.'}
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.25)', color: '#94a3b8', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 14px' }}>Level</th>
                      <th style={{ padding: '12px 14px' }}>Member Address</th>
                      <th style={{ padding: '12px 14px' }}>Sponsor</th>
                      <th style={{ padding: '12px 14px' }}>Placement Leg</th>
                      <th style={{ padding: '12px 14px' }}>Club Rank</th>
                      <th style={{ padding: '12px 14px' }}>Directs</th>
                      <th style={{ padding: '12px 14px' }}>Left Team</th>
                      <th style={{ padding: '12px 14px' }}>Right Team</th>
                      <th style={{ padding: '12px 14px' }}>Total Earned</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDownlineMembers.map((member, idx) => (
                      <tr
                        key={member.address}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        {/* Level */}
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: member.level === 1 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                              color: member.level === 1 ? '#818cf8' : '#cbd5e1',
                              padding: '2px 8px',
                              borderRadius: 8,
                            }}
                          >
                            L{member.level}
                          </span>
                        </td>

                        {/* Member Address */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc' }}>
                              {member.address.slice(0, 6)}...{member.address.slice(-4)}
                            </span>
                            <button
                              onClick={(e) => copyAddressToClipboard(member.address, e)}
                              title="Copy full address"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              {copiedAddr === member.address ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>

                        {/* Sponsor */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.78rem' }}>
                            {member.sponsor && member.sponsor !== '0x0000000000000000000000000000000000000000'
                              ? `${member.sponsor.slice(0, 6)}...${member.sponsor.slice(-4)}`
                              : 'Root'}
                          </span>
                        </td>

                        {/* Placement Leg */}
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 8,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: member.position === 1 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                              color: member.position === 1 ? '#818cf8' : '#c084fc',
                              border: member.position === 1 ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
                            }}
                          >
                            {member.position === 1 ? 'Left Leg' : 'Right Leg'}
                          </span>
                        </td>

                        {/* Club Rank */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 800, color: '#cbd5e1' }}>
                            {member.rankName}
                          </span>
                        </td>

                        {/* Direct Referrals Count */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                            {member.directCount} Directs
                          </span>
                        </td>

                        {/* Left Team Count */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ color: '#cbd5e1' }}>
                            {member.leftTeamCount} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({member.leftDirectCount} dir)</span>
                          </span>
                        </td>

                        {/* Right Team Count */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ color: '#cbd5e1' }}>
                            {member.rightTeamCount} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({member.rightDirectCount} dir)</span>
                          </span>
                        </td>

                        {/* Total Earned */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 800, color: '#4ade80' }}>
                            ${member.totalIncomeEarned.toFixed(2)}
                          </span>
                        </td>

                        {/* Action Drill Down */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDrillDown(member.address)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 8,
                              background: 'rgba(99, 102, 241, 0.2)',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              color: '#c084fc',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Focus this member's genealogy tree"
                          >
                            <span>Explore Tree</span>
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </MemberLayout>
  )
}

export default TreePage
