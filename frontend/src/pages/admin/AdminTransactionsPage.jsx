import React, { useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { AdminLayout } from '../../components/AdminLayout'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { getContractAddresses, getRpcUrl, ELZORA_MAIN_ABI } from '../../web3/contracts'
import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { Receipt, Search, ExternalLink, RefreshCw, Sparkles, Filter } from 'lucide-react'

export function AdminTransactionsPage() {
  const { address } = useWalletAuth()
  const chainId = useChainId()
  const CONTRACT_ADDRESSES = getContractAddresses(chainId)
  const rpcUrl = getRpcUrl(chainId)
  const activeChain = Number(chainId) === 97 ? bscTestnet : bsc

  const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'REGISTRATION' | 'WITHDRAWAL' | 'GLOBAL_CLUB'
  const [searchTerm, setSearchTerm] = useState('')
  const [txLogs, setTxLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const loadAllTransactions = async () => {
    try {
      setLoading(true)
      const targetAddr = CONTRACT_ADDRESSES.TETHER_STREAM // Main Proxy
      const publicClient = createPublicClient({ chain: activeChain, transport: http(rpcUrl) })

      const regAbi = parseAbiItem('event UserRegistered(address indexed user, address indexed sponsor, address indexed parent, uint8 position)')
      const withdrawAbi = parseAbiItem('event IncomeWithdrawn(address indexed user, address indexed recipient, uint256 amount)')
      const globalClubAbi = parseAbiItem('event GlobalClubEntered(address indexed user, uint256 entryId, uint256 queuePosition)')

      const [regLogs, withdrawLogs, gcLogs] = await Promise.all([
        publicClient.getLogs({ address: targetAddr, event: regAbi, fromBlock: 'earliest', toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: withdrawAbi, fromBlock: 'earliest', toBlock: 'latest' }).catch(() => []),
        publicClient.getLogs({ address: targetAddr, event: globalClubAbi, fromBlock: 'earliest', toBlock: 'latest' }).catch(() => []),
      ])

      const allEvents = []

      regLogs.forEach((l, idx) => {
        allEvents.push({
          id: `reg-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          member: l.args?.user || '0x0000000000000000000000000000000000000000',
          type: 'REGISTRATION',
          typeLabel: 'Core Registration ($50)',
          amount: 50,
          token: 'USDT',
          status: 'Confirmed On-Chain',
          color: '#8b5cf6',
        })
      })

      withdrawLogs.forEach((l, idx) => {
        allEvents.push({
          id: `w-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          member: l.args?.user || '0x0000000000000000000000000000000000000000',
          type: 'WITHDRAWAL',
          typeLabel: 'User Income Withdrawal',
          amount: Number(formatUnits(l.args?.amount || 0n, 6)),
          token: 'USDT',
          status: 'Transferred to Wallet',
          color: '#06b6d4',
        })
      })

      gcLogs.forEach((l, idx) => {
        allEvents.push({
          id: `gc-${l.transactionHash}-${idx}`,
          hash: l.transactionHash,
          blockNumber: Number(l.blockNumber || 0),
          member: l.args?.user || '0x0000000000000000000000000000000000000000',
          type: 'GLOBAL_CLUB',
          typeLabel: 'Global Club Entry ($25 Queue)',
          amount: 25,
          token: 'USDT',
          status: 'Queued On-Chain',
          color: '#38bdf8',
        })
      })

      // Sort by block number descending
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber)
      setTxLogs(allEvents)
    } catch (err) {
      console.warn('Error loading transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllTransactions()
  }, [activeChain, CONTRACT_ADDRESSES.TETHER_STREAM, rpcUrl])

  const filteredLogs = txLogs.filter((tx) => {
    const matchSearch =
      tx.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.typeLabel.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchSearch) return false

    if (activeTab === 'REGISTRATION') return tx.type === 'REGISTRATION'
    if (activeTab === 'WITHDRAWAL') return tx.type === 'WITHDRAWAL'
    if (activeTab === 'GLOBAL_CLUB') return tx.type === 'GLOBAL_CLUB'

    return true
  })

  return (
    <AdminLayout pageTitle="ELZORA Master Transaction Explorer">
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
                <Sparkles size={14} /> REAL-TIME BLOCKCHAIN TRANSACTION STREAM
              </div>
              <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900, color: '#fff' }}>
                On-Chain Transaction Explorer
              </h2>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
                Complete live transaction ledger across Registrations, Global Club queues, and User Withdrawals.
              </p>
            </div>

            <button
              onClick={loadAllTransactions}
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px 22px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Logs'}</span>
            </button>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            borderRadius: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            background: 'rgba(11, 15, 36, 0.85)',
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'REGISTRATION', label: 'Registrations ($50)' },
              { id: 'WITHDRAWAL', label: 'Withdrawals' },
              { id: 'GLOBAL_CLUB', label: 'Global Club ($25)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 12,
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === tab.id ? '#fff' : 'var(--muted)',
                  border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="text"
              placeholder="Search address or tx hash..."
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
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--purple-light)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              <span>Scanning BSC Testnet blocks...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              No transactions found matching your criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                    <th style={{ padding: '12px 16px' }}>EVENT TYPE</th>
                    <th style={{ padding: '12px 16px' }}>MEMBER WALLET</th>
                    <th style={{ padding: '12px 16px' }}>AMOUNT</th>
                    <th style={{ padding: '12px 16px' }}>BLOCK</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>TRANSACTION HASH</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            background: `${tx.color}15`,
                            color: tx.color,
                          }}
                        >
                          {tx.typeLabel}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 800, color: '#fff' }}>
                        {tx.member ? `${tx.member.slice(0, 6)}...${tx.member.slice(-4)}` : 'Unknown'}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 900, color: tx.type === 'WITHDRAWAL' ? '#f43f5e' : '#4ade80' }}>
                        {tx.type === 'WITHDRAWAL' ? '-' : '+'}${tx.amount.toFixed(2)} USDT
                      </td>
                      <td style={{ padding: '16px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                        #{tx.blockNumber}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace' }}>
                        <a
                          href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>{tx.hash ? `${tx.hash.slice(0, 6)}...` : 'Tx'}</span>
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

      </div>
    </AdminLayout>
  )
}

export default AdminTransactionsPage
