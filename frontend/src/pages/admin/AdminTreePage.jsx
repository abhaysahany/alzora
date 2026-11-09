import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { useChainId } from 'wagmi'
import { createPublicClient, http as viemHttp, isAddress } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import {
  getContractAddresses,
  getRpcUrl,
  ELZORA_GATEWAY_ABI,
  ELZORA_MAIN_ABI,
} from '../../web3/contracts'
import {
  GitCommit,
  GitFork,
  Search,
  RefreshCw,
  Users,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  ArrowDown,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Award,
  DollarSign,
  TrendingUp,
  Sparkles,
  Network,
  FolderPlus,
  FolderMinus,
} from 'lucide-react'

const CLUB_RANKS = {
  1: 'Starter',
  2: 'Bronze Club',
  3: 'Silver Club',
  4: 'Gold Club',
  5: 'Platinum Club',
  6: 'Diamond Club',
  7: 'Crown Diamond',
  8: 'Legend',
}

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

export function AdminTreePage() {
  const chainId = useChainId()
  const activeChainId = Number(chainId) === 56 ? 56 : 97
  const activeChain = activeChainId === 97 ? bscTestnet : bsc
  const rpcUrl = getRpcUrl(activeChainId)
  const CONTRACT_ADDRESSES = getContractAddresses(activeChainId)
  const rootAddress = CONTRACT_ADDRESSES.ROOT_ID || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5'

  const [activeTab, setActiveTab] = useState('binary') // 'binary', 'sponsor', or 'single_leg'
  const [focusAddress, setFocusAddress] = useState(rootAddress)
  const [searchInput, setSearchInput] = useState('')
  const [copiedAddr, setCopiedAddr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [maxDepth, setMaxDepth] = useState(4) // default 4 levels for binary tree
  const [expandedNodes, setExpandedNodes] = useState({})

  // Binary Tree State
  const [binaryNodesMap, setBinaryNodesMap] = useState({})
  const [levelCounts, setLevelCounts] = useState({ left: 0, right: 0, total: 0 })

  // Sponsor Tree (Genealogy / Directs) State
  const [sponsorFocusAddress, setSponsorFocusAddress] = useState(rootAddress)
  const [sponsorSearchInput, setSponsorSearchInput] = useState('')
  const [sponsorLoading, setSponsorLoading] = useState(false)
  const [sponsorMaxDepth, setSponsorMaxDepth] = useState(5)
  const [sponsorExpandedNodes, setSponsorExpandedNodes] = useState({})
  const [sponsorNodesMap, setSponsorNodesMap] = useState({})
  const [sponsorChildrenMap, setSponsorChildrenMap] = useState({})
  const [sponsorLevelMap, setSponsorLevelMap] = useState({})
  const [sponsorBreadcrumbs, setSponsorBreadcrumbs] = useState([])

  // Single Leg Tree State
  const [singleLegEntries, setSingleLegEntries] = useState([])
  const [queueHead, setQueueHead] = useState(0)
  const [singleLegLoading, setSingleLegLoading] = useState(false)
  const [singleLegSearch, setSingleLegSearch] = useState('')

  const handleCopy = (addr, e) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(addr)
    setCopiedAddr(addr)
    setTimeout(() => setCopiedAddr(null), 2000)
  }

  // Fetch a user's binary profile from Gateway/Main
  const fetchBinaryUser = useCallback(
    async (client, userAddr) => {
      if (!userAddr || userAddr === '0x0000000000000000000000000000000000000000') return null
      try {
        const prof = await client.readContract({
          address: CONTRACT_ADDRESSES.GATEWAY,
          abi: ELZORA_GATEWAY_ABI,
          functionName: 'getUser',
          args: [userAddr],
        })

        const rankNum = Number(prof.currentRank || 0)
        return {
          address: userAddr,
          sponsor: prof.sponsor,
          parent: prof.parent,
          leftChild: prof.leftChild && prof.leftChild !== '0x0000000000000000000000000000000000000000' ? prof.leftChild : null,
          rightChild: prof.rightChild && prof.rightChild !== '0x0000000000000000000000000000000000000000' ? prof.rightChild : null,
          position: Number(prof.position || 0), // 1=Left, 2=Right
          isRegistered: Boolean(prof.isRegistered),
          directCount: Number(prof.directCount || 0n),
          leftDirectCount: Number(prof.leftDirectCount || 0n),
          rightDirectCount: Number(prof.rightDirectCount || 0n),
          leftTeamCount: Number(prof.leftTeamCount || 0n),
          rightTeamCount: Number(prof.rightTeamCount || 0n),
          leftCarryVolume: Number(prof.leftCarryVolume || 0n),
          rightCarryVolume: Number(prof.rightCarryVolume || 0n),
          rank: rankNum,
          rankName: CLUB_RANKS[rankNum] || 'Starter',
          totalIncomeEarned: Number(prof.totalIncomeEarned || 0n) / 1e6,
        }
      } catch (err) {
        console.warn('Error reading binary user:', userAddr, err)
        return null
      }
    },
    [CONTRACT_ADDRESSES.GATEWAY]
  )

  // Load Binary Tree BFS starting from focusAddress
  const loadBinaryTree = useCallback(
    async (startAddr = focusAddress) => {
      if (!startAddr || !isAddress(startAddr)) return
      setLoading(true)

      try {
        const client = createPublicClient({
          chain: activeChain,
          transport: viemHttp(rpcUrl),
        })

        const visited = new Set()
        const queue = [{ address: startAddr, depth: 0 }]
        const newNodesMap = {}
        const defaultExpanded = {}

        while (queue.length > 0) {
          const { address, depth } = queue.shift()
          const key = address.toLowerCase()
          if (visited.has(key)) continue
          visited.add(key)

          const data = await fetchBinaryUser(client, address)
          if (!data) continue
          newNodesMap[key] = data

          // Expand top 2 levels by default
          if (depth < 2) {
            defaultExpanded[key] = true
          }

          if (depth < maxDepth) {
            if (data.leftChild) {
              queue.push({ address: data.leftChild, depth: depth + 1 })
            }
            if (data.rightChild) {
              queue.push({ address: data.rightChild, depth: depth + 1 })
            }
          }
        }

        setBinaryNodesMap(newNodesMap)
        setExpandedNodes((prev) => ({ ...defaultExpanded, ...prev }))

        // Set Level/Subtree Counts from focus user
        const rootKey = startAddr.toLowerCase()
        const rootUser = newNodesMap[rootKey]
        if (rootUser) {
          setLevelCounts({
            left: rootUser.leftTeamCount || 0,
            right: rootUser.rightTeamCount || 0,
            total: (rootUser.leftTeamCount || 0) + (rootUser.rightTeamCount || 0),
          })
        }
      } catch (err) {
        console.error('Failed to load binary tree:', err)
      } finally {
        setLoading(false)
      }
    },
    [activeChain, rpcUrl, focusAddress, maxDepth, fetchBinaryUser]
  )

  // Load Single Leg / Global Club Entries
  const loadSingleLegData = useCallback(async () => {
    setSingleLegLoading(true)
    try {
      const client = createPublicClient({
        chain: activeChain,
        transport: viemHttp(rpcUrl),
      })

      const totalEntriesCount = await client.readContract({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'getGlobalClubEntriesCount',
      })

      const head = await client.readContract({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'globalClubQueueHead',
      })
      setQueueHead(Number(head || 0n))

      const total = Number(totalEntriesCount || 0n)
      if (total === 0) {
        setSingleLegEntries([])
        return
      }

      // Fetch entries up to last 100 entries for efficiency
      const fetchCount = Math.min(total, 100)
      const entryPromises = []
      for (let i = 0; i < fetchCount; i++) {
        entryPromises.push(
          client.readContract({
            address: CONTRACT_ADDRESSES.TETHER_STREAM,
            abi: ELZORA_MAIN_ABI,
            functionName: 'getGlobalClubEntry',
            args: [BigInt(i)],
          })
        )
      }

      const entriesRaw = await Promise.all(entryPromises)
      const mapped = entriesRaw.map((e, idx) => ({
        entryId: Number(e.entryId ?? idx),
        user: e.user,
        isReentry: Boolean(e.isReentry),
        originalEntryId: Number(e.originalEntryId || 0n),
        isCompleted: Boolean(e.isCompleted),
        cycleTimestamp: Number(e.cycleTimestamp || 0n),
      }))

      setSingleLegEntries(mapped)
    } catch (err) {
      console.warn('Error reading single leg entries:', err)
    } finally {
      setSingleLegLoading(false)
    }
  }, [activeChain, rpcUrl, CONTRACT_ADDRESSES.TETHER_STREAM])

  // Load Sponsor Tree (Genealogy / Direct Referrals) BFS up to sponsorMaxDepth levels
  const loadSponsorGenealogy = useCallback(
    async (rootAddr = sponsorFocusAddress, targetDepth = sponsorMaxDepth) => {
      if (!rootAddr || !CONTRACT_ADDRESSES.GATEWAY) return
      setSponsorLoading(true)

      try {
        const client = createPublicClient({
          chain: activeChain,
          transport: viemHttp(rpcUrl),
        })

        const newNodesMap = {}
        const newChildrenMap = {}
        const newLevelMap = {}
        const newExpanded = {}

        // Fetch Root node details
        let rootDetails = await fetchBinaryUser(client, rootAddr)
        if (!rootDetails) {
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

        let currentLevelQueue = [rootAddr]

        for (let level = 1; level <= targetDepth; level++) {
          if (currentLevelQueue.length === 0) break

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

          if (membersToFetch.length > 0) {
            const detailsPromises = membersToFetch.map((addr) => fetchBinaryUser(client, addr))
            const fetchedDetails = await Promise.all(detailsPromises)
            fetchedDetails.forEach((d) => {
              if (d) newNodesMap[d.address.toLowerCase()] = d
            })
          }

          currentLevelQueue = nextLevelQueue
        }

        setSponsorNodesMap(newNodesMap)
        setSponsorChildrenMap(newChildrenMap)
        setSponsorLevelMap(newLevelMap)
        setSponsorExpandedNodes(newExpanded)
      } catch (err) {
        console.error('Failed to load sponsor genealogy in admin:', err)
      } finally {
        setSponsorLoading(false)
      }
    },
    [activeChain, rpcUrl, CONTRACT_ADDRESSES.GATEWAY, fetchBinaryUser, sponsorFocusAddress, sponsorMaxDepth]
  )

  useEffect(() => {
    loadBinaryTree()
  }, [loadBinaryTree])

  useEffect(() => {
    if (activeTab === 'sponsor') {
      loadSponsorGenealogy()
    }
  }, [activeTab, loadSponsorGenealogy])

  useEffect(() => {
    if (activeTab === 'single_leg') {
      loadSingleLegData()
    }
  }, [activeTab, loadSingleLegData])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchInput || !isAddress(searchInput)) return
    setFocusAddress(searchInput)
  }

  const toggleNode = (addr, e) => {
    if (e) e.stopPropagation()
    const key = addr.toLowerCase()
    setExpandedNodes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSponsorSearch = (e) => {
    e.preventDefault()
    if (!sponsorSearchInput || !isAddress(sponsorSearchInput)) return
    setSponsorBreadcrumbs((prev) => [...prev, sponsorFocusAddress])
    setSponsorFocusAddress(sponsorSearchInput.trim())
    setSponsorSearchInput('')
  }

  const handleSponsorDrillDown = (memberAddr) => {
    if (!memberAddr || memberAddr.toLowerCase() === sponsorFocusAddress?.toLowerCase()) return
    setSponsorBreadcrumbs((prev) => [...prev, sponsorFocusAddress])
    setSponsorFocusAddress(memberAddr)
  }

  const handleSponsorBreadcrumbClick = (idx) => {
    const target = sponsorBreadcrumbs[idx]
    setSponsorBreadcrumbs((prev) => prev.slice(0, idx))
    setSponsorFocusAddress(target)
  }

  const toggleSponsorNode = (addr, e) => {
    if (e) e.stopPropagation()
    const key = addr.toLowerCase()
    setSponsorExpandedNodes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSponsorExpandAll = () => {
    const allExp = {}
    Object.keys(sponsorNodesMap).forEach((k) => {
      allExp[k] = true
    })
    setSponsorExpandedNodes(allExp)
  }

  const handleSponsorCollapseAll = () => {
    const allCol = {}
    if (sponsorFocusAddress) allCol[sponsorFocusAddress.toLowerCase()] = true
    setSponsorExpandedNodes(allCol)
  }

  // Recursive Sponsor Tree Node Component
  const renderSponsorNode = (addr, currentLvl = 0) => {
    if (!addr) return null
    const key = addr.toLowerCase()
    const node = sponsorNodesMap[key]
    if (!node) return null

    const children = sponsorChildrenMap[key] || []
    const isExpanded = Boolean(sponsorExpandedNodes[key])
    const hasChildren = children.length > 0
    const badgeStyle = RANK_BADGE_COLORS[node.rankName] || RANK_BADGE_COLORS.Starter
    const isSelfRoot = currentLvl === 0

    return (
      <div key={addr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Node Card */}
        <div
          style={{
            background: isSelfRoot
              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(168, 85, 247, 0.35) 100%)'
              : 'rgba(15, 20, 50, 0.92)',
            border: isSelfRoot
              ? '2px solid rgba(236, 72, 153, 0.8)'
              : '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: 18,
            padding: '14px 18px',
            minWidth: 230,
            maxWidth: 270,
            boxShadow: isSelfRoot
              ? '0 12px 30px rgba(236, 72, 153, 0.35), 0 0 20px rgba(168, 85, 247, 0.2)'
              : '0 8px 22px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'all 0.2s ease',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Top Row: Level Tag & Rank */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 900,
                color: isSelfRoot ? '#f472b6' : '#cbd5e1',
                background: isSelfRoot ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                border: isSelfRoot ? '1px solid rgba(236, 72, 153, 0.5)' : 'none',
                padding: '2px 9px',
                borderRadius: 10,
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {isSelfRoot ? '👑 ROOT / FOCUS' : `LEVEL ${currentLvl}`}
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
                  background: isSelfRoot ? '#ec4899' : '#8b5cf6',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                }}
              >
                {isSelfRoot ? '👑' : `L${currentLvl}`}
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.88rem', color: '#f8fafc' }}>
                {node.address.slice(0, 6)}...{node.address.slice(-4)}
              </span>
            </div>
            <button
              onClick={(e) => handleCopy(node.address, e)}
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
                onClick={(e) => toggleSponsorNode(node.address, e)}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: 8,
                  background: isExpanded ? 'rgba(236, 72, 153, 0.25)' : 'rgba(99, 102, 241, 0.2)',
                  border: isExpanded ? '1px solid rgba(236, 72, 153, 0.5)' : '1px solid rgba(99, 102, 241, 0.4)',
                  color: isExpanded ? '#f472b6' : '#c084fc',
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
                onClick={() => handleSponsorDrillDown(node.address)}
                title="Focus this member as subtree root"
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

        {/* Connector Line Down to Directs */}
        {hasChildren && isExpanded && currentLvl < sponsorMaxDepth && (
          <div style={{ width: 2, height: 26, background: 'rgba(236, 72, 153, 0.5)' }} />
        )}

        {/* Children Container */}
        {hasChildren && isExpanded && currentLvl < sponsorMaxDepth && (
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {children.length > 1 && (
              <div
                style={{
                  width: `calc(100% - ${240 / children.length}px)`,
                  height: 2,
                  background: 'rgba(236, 72, 153, 0.5)',
                  position: 'absolute',
                  top: 0,
                }}
              />
            )}

            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', paddingTop: children.length > 1 ? 26 : 0 }}>
              {children.map((childAddr) => (
                <div key={childAddr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {children.length > 1 && (
                    <div style={{ width: 2, height: 26, background: 'rgba(236, 72, 153, 0.5)', marginTop: -26 }} />
                  )}
                  {renderSponsorNode(childAddr, currentLvl + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Recursive Binary Tree Node Component
  const renderBinaryNode = (addr, positionLabel = 'ROOT', depth = 0) => {
    if (!addr) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.4, margin: '8px 12px' }}>
          <div
            style={{
              padding: '10px 18px',
              borderRadius: 14,
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.02)',
              fontSize: '0.75rem',
              color: 'var(--muted)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontWeight: 800 }}>{positionLabel}</span>
            <div style={{ fontSize: '0.7rem', marginTop: 2 }}>[ Vacant Spot ]</div>
          </div>
        </div>
      )
    }

    const key = addr.toLowerCase()
    const node = binaryNodesMap[key]
    const isExpanded = expandedNodes[key]
    const isRoot = depth === 0
    const hasChildren = node && (node.leftChild || node.rightChild)

    const posColor = positionLabel === 'LEFT' ? '#38bdf8' : positionLabel === 'RIGHT' ? '#a855f7' : '#ffd700'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 10px' }}>
        {/* Node Card */}
        <div
          className="glass-card"
          onClick={() => setFocusAddress(addr)}
          style={{
            minWidth: 220,
            maxWidth: 260,
            padding: '14px 16px',
            borderRadius: 16,
            background: isRoot
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: `1px solid ${isRoot ? '#ffd700' : posColor + '55'}`,
            boxShadow: isRoot ? '0 8px 30px rgba(251, 191, 36, 0.25)' : '0 6px 20px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 900,
                color: posColor,
                background: `${posColor}20`,
                padding: '2px 8px',
                borderRadius: 10,
                letterSpacing: '0.5px',
              }}
            >
              {positionLabel}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#ffd700', fontWeight: 800 }}>
              {node?.rankName || 'Starter'}
            </span>
          </div>

          {/* Address */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff', fontSize: '0.82rem' }}>
              {addr.slice(0, 6)}...{addr.slice(-4)}
            </span>
            <button
              onClick={(e) => handleCopy(addr, e)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
            >
              {copiedAddr === addr ? <Check size={14} color="#00ff88" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Left / Right Team Counter */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              background: 'rgba(0,0,0,0.3)',
              padding: '6px 8px',
              borderRadius: 10,
              fontSize: '0.72rem',
              textAlign: 'center',
            }}
          >
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>L: {node?.leftTeamCount ?? 0}</span>
              <div style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>Direct: {node?.leftDirectCount ?? 0}</div>
            </div>
            <div>
              <span style={{ color: '#a855f7', fontWeight: 800 }}>R: {node?.rightTeamCount ?? 0}</span>
              <div style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>Direct: {node?.rightDirectCount ?? 0}</div>
            </div>
          </div>

          {/* Toggle Expand Button */}
          {hasChildren && depth < maxDepth && (
            <button
              onClick={(e) => toggleNode(addr, e)}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '4px 0',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: 'var(--muted)',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>{isExpanded ? 'Collapse Subtree' : 'Expand Subtree'}</span>
            </button>
          )}
        </div>

        {/* Binary Children: Left & Right */}
        {hasChildren && isExpanded && depth < maxDepth && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Connector Line */}
            <div style={{ width: 2, height: 16, background: 'rgba(139, 92, 246, 0.4)' }} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, position: 'relative' }}>
              {/* Branch connecting bar */}
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
              {renderBinaryNode(node.leftChild, 'LEFT', depth + 1)}
              {renderBinaryNode(node.rightChild, 'RIGHT', depth + 1)}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Filter single leg entries by address or entryId
  const filteredSingleLegEntries = useMemo(() => {
    return singleLegEntries.filter((e) => {
      if (!singleLegSearch) return true
      const matchAddr = e.user?.toLowerCase().includes(singleLegSearch.toLowerCase())
      const matchId = e.entryId.toString() === singleLegSearch.trim()
      return matchAddr || matchId
    })
  }, [singleLegEntries, singleLegSearch])

  return (
    <AdminLayout pageTitle="ELZORA Lineage & Tree Genealogy">
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* BANNER */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: 28,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(16, 21, 54, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: 'var(--purple-light)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                <Sparkles size={14} /> LIVE ON-CHAIN LINEAGE & QUEUE AUDIT
              </div>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
                Genealogy & Single Leg Tree Explorer
              </h2>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>
                Complete administrative audit of the 2:1 / 1:2 Binary Tree Matrix and the $25 Perpetual Single Leg Global Club.
              </p>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 4 }}>
              <button
                onClick={() => setActiveTab('binary')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === 'binary' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                  color: activeTab === 'binary' ? '#fff' : 'var(--muted)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <GitCommit size={16} /> Binary Tree (From 1st ID)
              </button>

              <button
                onClick={() => setActiveTab('sponsor')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === 'sponsor' ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'transparent',
                  color: activeTab === 'sponsor' ? '#fff' : 'var(--muted)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Network size={16} /> Sponsor Lineage Tree (Directs)
              </button>

              <button
                onClick={() => setActiveTab('single_leg')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: activeTab === 'single_leg' ? 'linear-gradient(135deg, #06b6d4, #0284c7)' : 'transparent',
                  color: activeTab === 'single_leg' ? '#fff' : 'var(--muted)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <GitFork size={16} /> Single Leg Global Club ($25)
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: BINARY TREE EXPLORER */}
        {activeTab === 'binary' && (
          <>
            {/* CONTROLS & SEARCH BAR */}
            <div
              className="glass-card"
              style={{
                padding: 20,
                borderRadius: 20,
                background: 'rgba(11, 15, 36, 0.85)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search any 0x... wallet address to inspect subtree"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '0.86rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                  }}
                >
                  Inspect
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setFocusAddress(rootAddress)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    background: 'rgba(255, 215, 0, 0.1)',
                    color: '#ffd700',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Reset to 1st ID (Root)
                </button>

                <button
                  onClick={() => loadBinaryTree(focusAddress)}
                  disabled={loading}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={14} className={loading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* FOCUS NODE STATS PILLS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="glass-card" style={{ padding: 18, borderRadius: 16, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                <div style={{ fontSize: '0.74rem', color: '#ffd700', fontWeight: 800, textTransform: 'uppercase' }}>Focus Tree Root</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff', fontSize: '1.05rem', marginTop: 4 }}>
                  {focusAddress.slice(0, 8)}...{focusAddress.slice(-6)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                  {focusAddress.toLowerCase() === rootAddress.toLowerCase() ? 'System 1st ID (Master Root)' : 'Downline Sub-Root'}
                </div>
              </div>

              <div className="glass-card" style={{ padding: 18, borderRadius: 16, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>Left Team Volume</div>
                <div style={{ fontWeight: 900, color: '#38bdf8', fontSize: '1.5rem', marginTop: 4 }}>
                  {levelCounts.left} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Members</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>Active in Left Subtree</div>
              </div>

              <div className="glass-card" style={{ padding: 18, borderRadius: 16, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                <div style={{ fontSize: '0.74rem', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase' }}>Right Team Volume</div>
                <div style={{ fontWeight: 900, color: '#a855f7', fontSize: '1.5rem', marginTop: 4 }}>
                  {levelCounts.right} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Members</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>Active in Right Subtree</div>
              </div>

              <div className="glass-card" style={{ padding: 18, borderRadius: 16, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(74, 222, 128, 0.25)' }}>
                <div style={{ fontSize: '0.74rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>Total Network Team</div>
                <div style={{ fontWeight: 900, color: '#4ade80', fontSize: '1.5rem', marginTop: 4 }}>
                  {levelCounts.total} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Nodes</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>Cumulative Dual-Team Count</div>
              </div>
            </div>

            {/* INTERACTIVE TREE CANVAS */}
            <div
              className="glass-card"
              style={{
                padding: 36,
                borderRadius: 24,
                background: 'rgba(11, 15, 36, 0.85)',
                minHeight: 460,
                overflowX: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {loading ? (
                <div style={{ padding: 80, textAlign: 'center', color: 'var(--cyan)' }}>
                  <RefreshCw size={36} className="spin" style={{ margin: '0 auto 16px' }} />
                  <div style={{ fontWeight: 700 }}>Traversing Blockchain Binary Tree from 1st ID...</div>
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  {renderBinaryNode(focusAddress, 'ROOT', 0)}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: SPONSOR LINEAGE TREE (DIRECTS) EXPLORER */}
        {activeTab === 'sponsor' && (
          <>
            {/* CONTROLS & SEARCH BAR */}
            <div
              className="glass-card"
              style={{
                padding: 20,
                borderRadius: 20,
                background: 'rgba(11, 15, 36, 0.85)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <form onSubmit={handleSponsorSearch} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search any 0x... wallet address to inspect sponsor lineage"
                    value={sponsorSearchInput}
                    onChange={(e) => setSponsorSearchInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 38px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '0.86rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                  }}
                >
                  Inspect
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => {
                    setSponsorBreadcrumbs([])
                    setSponsorFocusAddress(rootAddress)
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    background: 'rgba(236, 72, 153, 0.15)',
                    color: '#f472b6',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Shield size={14} /> Reset to 1st ID
                </button>

                {/* Depth selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700 }}>Depth:</span>
                  <select
                    value={sponsorMaxDepth}
                    onChange={(e) => setSponsorMaxDepth(Number(e.target.value))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value={3} style={{ background: '#0b0f24' }}>3 Levels</option>
                    <option value={4} style={{ background: '#0b0f24' }}>4 Levels</option>
                    <option value={5} style={{ background: '#0b0f24' }}>5 Levels</option>
                    <option value={6} style={{ background: '#0b0f24' }}>6 Levels</option>
                  </select>
                </div>

                <button
                  onClick={handleSponsorExpandAll}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Expand All
                </button>

                <button
                  onClick={handleSponsorCollapseAll}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Collapse All
                </button>

                <button
                  onClick={() => loadSponsorGenealogy(sponsorFocusAddress, sponsorMaxDepth)}
                  disabled={sponsorLoading}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                  title="Refresh Sponsor Lineage"
                >
                  <RefreshCw size={16} className={sponsorLoading ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {/* BREADCRUMB NAVIGATION */}
            {sponsorBreadcrumbs.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: 'rgba(15, 20, 50, 0.6)',
                  borderRadius: 12,
                  fontSize: '0.8rem',
                  color: '#cbd5e1',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Lineage Path:</span>
                {sponsorBreadcrumbs.map((addr, idx) => (
                  <React.Fragment key={addr}>
                    <button
                      onClick={() => handleSponsorBreadcrumbClick(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#c084fc',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {idx === 0 && addr.toLowerCase() === rootAddress.toLowerCase()
                        ? '1st Root ID'
                        : `${addr.slice(0, 6)}...${addr.slice(-4)}`}
                    </button>
                    <ChevronRight size={13} color="#64748b" />
                  </React.Fragment>
                ))}
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#f472b6' }}>
                  {sponsorFocusAddress.slice(0, 6)}...{sponsorFocusAddress.slice(-4)} (Current View)
                </span>
              </div>
            )}

            {/* INTERACTIVE SPONSOR TREE CANVAS */}
            <div
              className="glass-card"
              style={{
                padding: 36,
                borderRadius: 24,
                background: 'rgba(11, 15, 36, 0.85)',
                minHeight: 460,
                overflowX: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {sponsorLoading ? (
                <div style={{ padding: 80, textAlign: 'center', color: '#ec4899' }}>
                  <RefreshCw size={36} className="spin" style={{ margin: '0 auto 16px' }} />
                  <div style={{ fontWeight: 700 }}>Traversing Blockchain Sponsor Lineage & Directs...</div>
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  {renderSponsorNode(sponsorFocusAddress, 0)}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: SINGLE LEG GLOBAL CLUB ($25) EXPLORER */}
        {activeTab === 'single_leg' && (
          <>
            {/* STATS OVERVIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="glass-card" style={{ padding: 20, borderRadius: 18, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ fontSize: '0.76rem', color: '#06b6d4', fontWeight: 800, textTransform: 'uppercase' }}>Total Single Leg Entries</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginTop: 4 }}>
                  {singleLegEntries.length} Entries
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: 4 }}>Autonomous global 1-to-2 queue</div>
              </div>

              <div className="glass-card" style={{ padding: 20, borderRadius: 18, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                <div style={{ fontSize: '0.76rem', color: '#4ade80', fontWeight: 800, textTransform: 'uppercase' }}>Current Queue Head</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ade80', marginTop: 4 }}>
                  Entry #{queueHead}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: 4 }}>Next entry to complete cycle</div>
              </div>

              <div className="glass-card" style={{ padding: 20, borderRadius: 18, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                <div style={{ fontSize: '0.76rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>Payout Per Cycle</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
                  $25.00 USDT
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: 4 }}>+ 1 Automatic Re-entry Spot</div>
              </div>
            </div>

            {/* SEARCH & REFRESH BAR */}
            <div
              className="glass-card"
              style={{
                padding: 18,
                borderRadius: 18,
                background: 'rgba(11, 15, 36, 0.85)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter by Member Wallet Address or Entry ID..."
                  value={singleLegSearch}
                  onChange={(e) => setSingleLegSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              <button
                onClick={loadSingleLegData}
                disabled={singleLegLoading}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <RefreshCw size={14} className={singleLegLoading ? 'spin' : ''} />
                <span>Refresh Queue</span>
              </button>
            </div>

            {/* SINGLE LEG ENTRIES TABLE */}
            <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>
                Single Leg Queue Lineage & Execution Sequence
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                      <th style={{ padding: '12px 16px' }}>QUEUE POSITION</th>
                      <th style={{ padding: '12px 16px' }}>MEMBER WALLET</th>
                      <th style={{ padding: '12px 16px' }}>TYPE</th>
                      <th style={{ padding: '12px 16px' }}>STATUS</th>
                      <th style={{ padding: '12px 16px' }}>CYCLE TIMING</th>
                    </tr>
                  </thead>
                  <tbody>
                    {singleLegLoading ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                          Loading Single Leg entries from blockchain...
                        </td>
                      </tr>
                    ) : filteredSingleLegEntries.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                          No single leg queue entries found.
                        </td>
                      </tr>
                    ) : (
                      filteredSingleLegEntries.map((e) => {
                        const isCurrentHead = e.entryId === queueHead
                        return (
                          <tr
                            key={e.entryId}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              background: isCurrentHead ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '14px 16px', fontWeight: 900, color: isCurrentHead ? '#06b6d4' : '#fff' }}>
                              #{e.entryId} {isCurrentHead && <span style={{ fontSize: '0.7rem', background: '#06b6d4', color: '#000', padding: '2px 6px', borderRadius: 6, marginLeft: 6 }}>CURRENT HEAD</span>}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff' }}>
                                  {e.user.slice(0, 8)}...{e.user.slice(-6)}
                                </span>
                                <button
                                  onClick={(ev) => handleCopy(e.user, ev)}
                                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                                >
                                  {copiedAddr === e.user ? <Check size={14} color="#00ff88" /> : <Copy size={14} />}
                                </button>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  fontWeight: 800,
                                  background: e.isReentry ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                  color: e.isReentry ? '#c084fc' : '#38bdf8',
                                }}
                              >
                                {e.isReentry ? `Re-entry (Origin #${e.originalEntryId})` : 'Initial Entry'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  fontWeight: 800,
                                  background: e.isCompleted ? 'rgba(74, 222, 128, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                                  color: e.isCompleted ? '#4ade80' : '#fbbf24',
                                }}
                              >
                                {e.isCompleted ? 'Completed Cycle ✅' : 'Queued (Pending)'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: '0.82rem' }}>
                              {e.cycleTimestamp > 0
                                ? new Date(e.cycleTimestamp * 1000).toLocaleString()
                                : 'Pending queue rotation'}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </AdminLayout>
  )
}
export default AdminTreePage

