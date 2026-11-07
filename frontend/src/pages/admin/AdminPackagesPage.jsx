import React, { useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { AdminLayout } from '../../components/AdminLayout'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { useAdminMembers } from '../../hooks/useAdminMembers'
import { useTetherStream } from '../../hooks/useTetherStream'
import { getContractAddresses, getRpcUrl, ELZORA_MAIN_ABI } from '../../web3/contracts'
import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import {
  Package,
  History,
  CheckCircle2,
  ShieldCheck,
  Search,
  DollarSign,
  TrendingUp,
  Users,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Crown,
  Split,
  Award,
} from 'lucide-react'

export function AdminPackagesPage() {
  const { address } = useWalletAuth()
  const { overview } = useTetherStream()
  const { members, loading: loadingMembers } = useAdminMembers()
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)
  const rpcUrl = getRpcUrl(chainId)
  const activeChain = Number(chainId) === 97 ? bscTestnet : bsc

  const [activeTab, setActiveTab] = useState('tiers') // 'tiers' | 'history' | 'analytics'
  const [searchTerm, setSearchTerm] = useState('')
  const [purchaseHistory, setPurchaseHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const packagesConfig = [
    {
      id: 1,
      name: 'ELZORA Core Registration',
      tier: 'CORE SYSTEM ENTRY',
      price: 50,
      currency: 'USDT',
      allocation: '100% On-Chain Distributed Across 7 Streams',
      streams: [
        'Direct Sponsor: $10.00 (20%)',
        '20-Level Affiliate: $7.00 (14%)',
        '8 Club Matrix: $12.00 (24%)',
        'Binary Matching: $10.00 (20%)',
        'Champion Club: $3.00 (6%)',
        'Weekly Reward: $3.00 (6%)',
        'Lifetime Milestones: $5.00 (10%)',
      ],
      color: '#8b5cf6',
      active: true,
    },
    {
      id: 2,
      name: 'Global Club ($25 Re-entry)',
      tier: 'AUTOMATED 1-TO-2 QUEUE',
      price: 25,
      currency: 'USDT',
      allocation: 'Queue Payout ($25) + Automated Re-entry ($25)',
      streams: [
        '1-to-2 Queue Matrix Architecture',
        'First member under creates queue position',
        'Second member pays $25 USDT to sponsor',
        'Cycles completed automatically re-enter queue',
      ],
      color: '#06b6d4',
      active: true,
    },
  ]

  useEffect(() => {
    async function loadPurchaseHistory() {
      setLoadingHistory(true)
      try {
        const publicClient = createPublicClient({ chain: activeChain, transport: http(rpcUrl) })
        const mainAddr = contractAddresses.TETHER_STREAM // Proxy address

        const userRegEvent = parseAbiItem('event UserRegistered(address indexed user, address indexed sponsor, address indexed parent, uint8 position)')
        const logs = await publicClient.getLogs({
          address: mainAddr,
          event: userRegEvent,
          fromBlock: 'earliest',
          toBlock: 'latest',
        }).catch(() => [])

        const formatted = logs.map((l, idx) => ({
          id: `reg-${l.transactionHash}-${idx}`,
          txHash: l.transactionHash,
          user: l.args?.user,
          sponsor: l.args?.sponsor,
          parent: l.args?.parent,
          position: Number(l.args?.position) === 2 ? 'Right' : 'Left',
          packageName: 'Core Registration Package ($50)',
          price: 50,
          date: 'Confirmed On-Chain',
        }))

        setPurchaseHistory(formatted.reverse())
      } catch (err) {
        console.warn('Error fetching registration history logs:', err)
      } finally {
        setLoadingHistory(false)
      }
    }

    loadPurchaseHistory()
  }, [activeChain, contractAddresses.TETHER_STREAM, rpcUrl])

  const totalRegistrations = members.filter((m) => m.active).length
  const totalVolumeUsd = totalRegistrations * 50
  const globalClubEntries = Number(overview?.globalClubTotalEntries || 0)

  const filteredHistory = purchaseHistory.filter((item) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      item.user?.toLowerCase().includes(term) ||
      item.sponsor?.toLowerCase().includes(term) ||
      item.txHash?.toLowerCase().includes(term)
    )
  })

  return (
    <AdminLayout pageTitle="ELZORA Package Configuration & Staking Tiers">
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* BANNER */}
        <div
          className="glass-card glass-card-glow"
          style={{
            padding: 30,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(16, 21, 54, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 14px',
                  borderRadius: 20,
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: 'var(--purple-light)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> ON-CHAIN SMART CONTRACT ARCHITECTURE
              </div>
              <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900, color: '#fff' }}>
                Package Architecture & Staking Configuration
              </h2>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
                $50 Core Registration Package (100% 7-Stream Allocation) and $25 Global Club 1-to-2 Queue Matrix.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px 22px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block' }}>Total Package Volume</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ade80' }}>${totalVolumeUsd.toFixed(2)} USDT</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS HEADER */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
          {[
            { id: 'tiers', label: 'Package Tiers & Allocations', icon: Package },
            { id: 'history', label: 'On-Chain Activation Logs', icon: History },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 14,
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: isActive ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#fff' : 'var(--muted)',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* TAB 1: TIERS */}
        {activeTab === 'tiers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 24 }}>
            {packagesConfig.map((pkg) => (
              <div
                key={pkg.id}
                className="glass-card"
                style={{
                  padding: 28,
                  borderRadius: 22,
                  background: 'rgba(11, 15, 36, 0.85)',
                  border: `1px solid ${pkg.color}40`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 10,
                        background: `${pkg.color}20`,
                        color: pkg.color,
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        letterSpacing: 0.5,
                      }}
                    >
                      {pkg.tier}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 800 }}>● ACTIVE ON-CHAIN</span>
                  </div>

                  <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.4rem', fontWeight: 900 }}>
                    {pkg.name}
                  </h3>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: pkg.color, marginBottom: 14 }}>
                    ${pkg.price}.00 <span style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 600 }}>{pkg.currency}</span>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: 20 }}>
                    {pkg.allocation}
                  </p>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                      MATHEMATICAL DISTRIBUTION:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', fontSize: '0.84rem', lineHeight: 1.8 }}>
                      {pkg.streams.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Total Adherents:
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                    {pkg.id === 1 ? totalRegistrations : globalClubEntries}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div style={{ position: 'relative', width: 320 }}>
                <input
                  type="text"
                  placeholder="Search by address or tx..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '9px 38px 9px 14px',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Showing <b>{filteredHistory.length}</b> events
              </div>
            </div>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--purple-light)' }}>
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
                <span>Reading on-chain activation logs...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                No registration logs found on BSC Testnet yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                      <th style={{ padding: '12px 16px' }}>MEMBER</th>
                      <th style={{ padding: '12px 16px' }}>SPONSOR</th>
                      <th style={{ padding: '12px 16px' }}>BINARY PARENT</th>
                      <th style={{ padding: '12px 16px' }}>POSITION</th>
                      <th style={{ padding: '12px 16px' }}>AMOUNT</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>TX HASH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '16px', fontFamily: 'monospace', color: '#fff', fontWeight: 800 }}>
                          {item.user ? `${item.user.slice(0, 6)}...${item.user.slice(-4)}` : 'Unknown'}
                        </td>
                        <td style={{ padding: '16px', fontFamily: 'monospace', color: 'var(--purple-light)' }}>
                          {item.sponsor ? `${item.sponsor.slice(0, 6)}...${item.sponsor.slice(-4)}` : 'None'}
                        </td>
                        <td style={{ padding: '16px', fontFamily: 'monospace', color: 'var(--cyan)' }}>
                          {item.parent ? `${item.parent.slice(0, 6)}...${item.parent.slice(-4)}` : 'None'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: 8,
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              background: item.position === 'Right' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                              color: item.position === 'Right' ? 'var(--cyan)' : 'var(--purple-light)',
                            }}
                          >
                            {item.position}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 900, color: '#4ade80' }}>
                          ${item.price}.00 USDT
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace' }}>
                          <a
                            href={`https://testnet.bscscan.com/tx/${item.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>{item.txHash ? `${item.txHash.slice(0, 6)}...` : 'Tx'}</span>
                            <ExternalLink size={14} />
                          </a>
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
    </AdminLayout>
  )
}

export default AdminPackagesPage
