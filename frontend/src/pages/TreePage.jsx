import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useChainId } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { MemberLayout } from '../components/MemberLayout'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { useTetherStream } from '../hooks/useTetherStream'
import {
  getContractAddresses,
  getRpcUrl,
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
  Plus,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
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

export function TreePage() {
  const { address: connectedAddress } = useWalletAuth()
  const { CONTRACT_ADDRESSES } = useTetherStream()
  const chainId = useChainId()
  const rpcUrl = getRpcUrl(chainId)
  const activeChain = Number(chainId) === 97 ? bscTestnet : bsc

  const [focusAddress, setFocusAddress] = useState(connectedAddress)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [copiedAddr, setCopiedAddr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [treeData, setTreeData] = useState(null)

  // Fetch binary node data recursively for 3 tiers
  const fetchBinaryNode = useCallback(async (client, userAddr) => {
    if (!userAddr || userAddr === '0x0000000000000000000000000000000000000000') return null
    try {
      const summary = await client.readContract({
        address: CONTRACT_ADDRESSES.GATEWAY,
        abi: ELZORA_GATEWAY_ABI,
        functionName: 'getBinaryTeamSummary',
        args: [userAddr],
      })
      const userProfile = await client.readContract({
        address: CONTRACT_ADDRESSES.GATEWAY,
        abi: ELZORA_GATEWAY_ABI,
        functionName: 'getUser',
        args: [userAddr],
      })

      return {
        user: summary.user,
        leftChild: summary.leftChild,
        rightChild: summary.rightChild,
        leftDirects: Number(summary.leftDirects || 0n),
        rightDirects: Number(summary.rightDirects || 0n),
        leftTotalMembers: Number(summary.leftTotalMembers || 0n),
        rightTotalMembers: Number(summary.rightTotalMembers || 0n),
        leftCarryVolume: Number(summary.leftCarryVolume || 0n),
        rightCarryVolume: Number(summary.rightCarryVolume || 0n),
        hasMatchedFirstPair: Boolean(summary.hasMatchedFirstPair),
        rank: Number(userProfile.currentRank || 1),
        rankName: CLUB_RANKS[Number(userProfile.currentRank || 1)] || 'Starter',
        isRegistered: Boolean(userProfile.isRegistered),
        sponsor: userProfile.sponsor,
      }
    } catch (err) {
      console.error('Error fetching binary node:', userAddr, err)
      return null
    }
  }, [CONTRACT_ADDRESSES.GATEWAY])

  // Load Tier 1 (Root), Tier 2 (Left, Right), Tier 3 (LL, LR, RL, RR)
  const loadTreeHierarchy = useCallback(async (targetAddr) => {
    if (!targetAddr) return
    setLoading(true)
    const client = createPublicClient({ chain: activeChain, transport: http(rpcUrl) })

    try {
      // 1. Root Node
      const rootNode = await fetchBinaryNode(client, targetAddr)
      if (!rootNode) {
        setLoading(false)
        return
      }

      // 2. Level 1 Children
      const [leftNode, rightNode] = await Promise.all([
        rootNode.leftChild ? fetchBinaryNode(client, rootNode.leftChild) : null,
        rootNode.rightChild ? fetchBinaryNode(client, rootNode.rightChild) : null,
      ])

      // 3. Level 2 Grandchildren
      const [llNode, lrNode, rlNode, rrNode] = await Promise.all([
        leftNode?.leftChild ? fetchBinaryNode(client, leftNode.leftChild) : null,
        leftNode?.rightChild ? fetchBinaryNode(client, leftNode.rightChild) : null,
        rightNode?.leftChild ? fetchBinaryNode(client, rightNode.leftChild) : null,
        rightNode?.rightChild ? fetchBinaryNode(client, rightNode.rightChild) : null,
      ])

      setTreeData({
        root: rootNode,
        left: leftNode,
        right: rightNode,
        ll: llNode,
        lr: lrNode,
        rl: rlNode,
        rr: rrNode,
      })
    } catch (err) {
      console.error('Tree load error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeChain, rpcUrl, fetchBinaryNode])

  useEffect(() => {
    if (focusAddress) {
      loadTreeHierarchy(focusAddress)
    }
  }, [focusAddress, loadTreeHierarchy])

  const handleNavigate = (addr) => {
    if (!addr || addr === '0x0000000000000000000000000000000000000000') return
    setBreadcrumbs((prev) => [...prev, focusAddress])
    setFocusAddress(addr)
  }

  const handleBreadcrumbClick = (idx) => {
    const target = breadcrumbs[idx]
    setBreadcrumbs((prev) => prev.slice(0, idx))
    setFocusAddress(target)
  }

  const copyText = (text, e) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedAddr(text)
    setTimeout(() => setCopiedAddr(null), 2000)
  }

  // Render a Single Binary Tree Node Card
  const renderNodeCard = (node, parentAddr, posLabel, posNumber) => {
    if (!node) {
      return (
        <div
          style={{
            width: 220,
            padding: '16px 14px',
            borderRadius: 16,
            background: 'rgba(6, 8, 20, 0.5)',
            border: '1px dashed rgba(139, 92, 246, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 140,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8' }}>
            {posLabel} SLOT OPEN
          </div>
          {parentAddr && (
            <Link
              to={`/register?parent=${parentAddr}&pos=${posNumber}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Plus size={14} />
              <span>Add Member</span>
            </Link>
          )}
        </div>
      )
    }

    const isCurrentFocus = node.user.toLowerCase() === focusAddress?.toLowerCase()

    return (
      <div
        onClick={() => !isCurrentFocus && handleNavigate(node.user)}
        style={{
          width: 220,
          padding: '14px',
          borderRadius: 16,
          background: isCurrentFocus ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.3))' : 'rgba(13, 18, 45, 0.85)',
          border: isCurrentFocus ? '2px solid #a855f7' : '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: isCurrentFocus ? '0 0 25px rgba(168, 85, 247, 0.4)' : '0 10px 20px rgba(0,0,0,0.4)',
          cursor: isCurrentFocus ? 'default' : 'pointer',
          textAlign: 'center',
          position: 'relative',
          transition: 'all 0.2s',
        }}
      >
        {/* Pos Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase' }}>
            {posLabel}
          </span>
          <span style={{ padding: '2px 8px', borderRadius: 6, background: '#6366f1', color: '#fff', fontSize: '0.65rem', fontWeight: 800 }}>
            {node.rankName}
          </span>
        </div>

        {/* Address */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
            {node.user.slice(0, 6)}...{node.user.slice(-4)}
          </span>
          <button
            onClick={(e) => copyText(node.user, e)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
          >
            {copiedAddr === node.user ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
          </button>
        </div>

        {/* Team Volume Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'rgba(6, 8, 20, 0.6)', padding: '6px 8px', borderRadius: 8, fontSize: '0.7rem' }}>
          <div>
            <div style={{ color: '#818cf8', fontWeight: 700 }}>L: {node.leftTotalMembers}</div>
            <div style={{ color: '#94a3b8' }}>Carry: {node.leftCarryVolume}</div>
          </div>
          <div>
            <div style={{ color: '#c084fc', fontWeight: 700 }}>R: {node.rightTotalMembers}</div>
            <div style={{ color: '#94a3b8' }}>Carry: {node.rightCarryVolume}</div>
          </div>
        </div>

        {!isCurrentFocus && (
          <div style={{ marginTop: 8, fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span>Click to Focus</span>
            <span>↓</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <MemberLayout pageTitle="Binary Matrix Tree">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* BANNER & SEARCH */}
        <div
          style={{
            padding: '24px 28px',
            borderRadius: 24,
            border: '1px solid rgba(139, 92, 246, 0.35)',
            background: 'linear-gradient(135deg, rgba(16, 23, 60, 0.85) 0%, rgba(9, 13, 35, 0.95) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#c084fc', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                <GitCommit size={16} /> INTERACTIVE GENEALOGY MATRIX
              </div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc' }}>
                Binary Matrix Tree Visualizer
              </h1>
            </div>

            {/* SEARCH WALLET */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Search user 0x..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(6, 8, 20, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  width: 240,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  if (searchInput.trim()) {
                    setBreadcrumbs((prev) => [...prev, focusAddress])
                    setFocusAddress(searchInput.trim())
                  }
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* BREADCRUMBS */}
          {breadcrumbs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: '0.82rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#94a3b8' }}>History:</span>
              <button
                onClick={() => {
                  setBreadcrumbs([])
                  setFocusAddress(connectedAddress)
                }}
                style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', fontWeight: 700 }}
              >
                My Account
              </button>
              {breadcrumbs.map((addr, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight size={14} color="#64748b" />
                  <button
                    onClick={() => handleBreadcrumbClick(idx)}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontFamily: 'monospace' }}
                  >
                    {addr.slice(0, 6)}...
                  </button>
                </React.Fragment>
              ))}
              <ChevronRight size={14} color="#64748b" />
              <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
                {focusAddress?.slice(0, 6)}...{focusAddress?.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* MOBILE SCROLL HINT */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600, padding: '4px 12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.25)', width: 'fit-content', margin: '0 auto' }}>
          <span>← Swipe horizontally to explore left & right binary legs →</span>
        </div>

        {/* BINARY TREE CANVAS VIEW */}
        <div
          style={{
            background: 'rgba(13, 18, 45, 0.7)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: 24,
            padding: '36px 20px',
            overflowX: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 520,
          }}
        >
          {loading ? (
            <div style={{ color: '#c084fc', padding: 40, fontWeight: 700 }}>Loading Binary Tree Data...</div>
          ) : !treeData?.root ? (
            <div style={{ color: '#94a3b8', padding: 40 }}>No binary node data found for this address.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, minWidth: 960 }}>
              
              {/* TIER 1: ROOT NODE */}
              <div>
                {renderNodeCard(treeData.root, null, 'ROOT FOCUS', 0)}
              </div>

              {/* TIER 2: LEVEL 1 (LEFT & RIGHT) */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 200, position: 'relative', width: '100%' }}>
                <div>
                  {renderNodeCard(treeData.left, treeData.root.user, 'LEFT LEG', 1)}
                </div>
                <div>
                  {renderNodeCard(treeData.right, treeData.root.user, 'RIGHT LEG', 2)}
                </div>
              </div>

              {/* TIER 3: LEVEL 2 (LL, LR, RL, RR) */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, width: '100%' }}>
                {/* Left Branch */}
                <div>
                  {renderNodeCard(treeData.ll, treeData.left?.user, 'LEFT-LEFT', 1)}
                </div>
                <div>
                  {renderNodeCard(treeData.lr, treeData.left?.user, 'LEFT-RIGHT', 2)}
                </div>

                {/* Right Branch */}
                <div>
                  {renderNodeCard(treeData.rl, treeData.right?.user, 'RIGHT-LEFT', 1)}
                </div>
                <div>
                  {renderNodeCard(treeData.rr, treeData.right?.user, 'RIGHT-RIGHT', 2)}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </MemberLayout>
  )
}
