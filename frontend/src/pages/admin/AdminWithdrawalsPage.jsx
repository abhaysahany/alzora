import React, { useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { AdminLayout } from '../../components/AdminLayout'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { useAdminMembers } from '../../hooks/useAdminMembers'
import { useTetherStream } from '../../hooks/useTetherStream'
import { getContractAddresses, getRpcUrl, getTokenDecimals, ELZORA_MAIN_ABI } from '../../web3/contracts'
import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import {
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Search,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Wallet,
  AlertTriangle,
} from 'lucide-react'

export function AdminWithdrawalsPage() {
  const { address } = useWalletAuth()
  const { overview } = useTetherStream()
  const { members } = useAdminMembers()
  const chainId = useChainId()
  const CONTRACT_ADDRESSES = getContractAddresses(chainId)
  const rpcUrl = getRpcUrl(chainId)
  const activeChain = Number(chainId) === 97 ? bscTestnet : bsc
  const tokenDecimals = getTokenDecimals(chainId)

  const [searchTerm, setSearchTerm] = useState('')
  const [withdrawalLogs, setWithdrawalLogs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadWithdrawalLogs() {
      setLoading(true)
      try {
        const publicClient = createPublicClient({ chain: activeChain, transport: http(rpcUrl) })
        const mainAddr = CONTRACT_ADDRESSES.TETHER_STREAM // Proxy

        const withdrawEvent = parseAbiItem('event IncomeWithdrawn(address indexed user, address indexed recipient, uint256 amount)')
        const logs = await publicClient.getLogs({
          address: mainAddr,
          event: withdrawEvent,
          fromBlock: 'earliest',
          toBlock: 'latest',
        }).catch(() => [])

        const formatted = logs.map((l, idx) => ({
          id: `w-${l.transactionHash}-${idx}`,
          txHash: l.transactionHash,
          user: l.args?.user,
          recipient: l.args?.recipient,
          amount: Number(formatUnits(l.args?.amount || 0n, tokenDecimals)),
          date: 'Confirmed On-Chain',
        }))

        setWithdrawalLogs(formatted.reverse())
      } catch (err) {
        console.warn('Error fetching withdrawal logs:', err)
      } finally {
        setLoading(false)
      }
    }

    loadWithdrawalLogs()
  }, [activeChain, CONTRACT_ADDRESSES.TETHER_STREAM, rpcUrl])

  const totalWithdrawnAmount = members.reduce((sum, m) => sum + (m.totalWithdrawn || 0), 0)
  const totalPendingWithdrawable = members.reduce((sum, m) => sum + (m.withdrawableBalance || 0), 0)

  const filteredLogs = withdrawalLogs.filter((log) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      log.user?.toLowerCase().includes(term) ||
      log.recipient?.toLowerCase().includes(term) ||
      log.txHash?.toLowerCase().includes(term)
    )
  })

  return (
    <AdminLayout pageTitle="ELZORA Withdrawal Audit & Solvency Ledger">
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
                <Sparkles size={14} /> ON-CHAIN SOLVENCY & WITHDRAWAL AUDITOR
              </div>
              <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900, color: '#fff' }}>
                Protocol Withdrawals & Vault Solvency
              </h2>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
                Audit instant on-chain USDT withdrawals, pending member liabilities, and solvency reserves.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px 22px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block' }}>Contract Vault Balance</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--cyan)' }}>
                  ${overview?.contractTokenBalance || '0.00'} USDT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          
          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Withdrawn On-Chain
            </span>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#4ade80', margin: '8px 0' }}>
              ${totalWithdrawnAmount.toFixed(2)} USDT
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
              Successfully claimed to personal wallets
            </span>
          </div>

          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Pending Withdrawable Liabilities
            </span>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--cyan)', margin: '8px 0' }}>
              ${totalPendingWithdrawable.toFixed(2)} USDT
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
              Accrued balances waiting for user claims
            </span>
          </div>

          <div className="glass-card" style={{ padding: 24, borderRadius: 20, background: 'rgba(11, 15, 36, 0.85)', border: '1px solid rgba(74, 222, 128, 0.25)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Solvency Protection Status
            </span>
            <div style={{ fontSize: '1.7rem', fontWeight: 900, color: overview?.isSolvent !== false ? '#4ade80' : '#ef4444', margin: '8px 0' }}>
              {overview?.isSolvent !== false ? '100% SOLVENT ✅' : 'SOLVENCY DEFICIT ⚠️'}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
              Vault Reserve ≥ Total Member Liabilities
            </span>
          </div>

        </div>

        {/* WITHDRAWAL EVENT LOGS */}
        <div className="glass-card" style={{ padding: 24, borderRadius: 24, background: 'rgba(11, 15, 36, 0.85)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>
              On-Chain Withdrawal Records
            </h3>
            <div style={{ position: 'relative', width: 280 }}>
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
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--purple-light)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              <span>Querying withdrawal events from BSC Testnet...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              No withdrawal transactions recorded on-chain yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                    <th style={{ padding: '12px 16px' }}>MEMBER WALLET</th>
                    <th style={{ padding: '12px 16px' }}>RECIPIENT</th>
                    <th style={{ padding: '12px 16px' }}>AMOUNT WITHDRAWN</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>TX HASH</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 800, color: '#fff' }}>
                        {log.user ? `${log.user.slice(0, 6)}...${log.user.slice(-4)}` : 'Unknown'}
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'monospace', color: 'var(--purple-light)' }}>
                        {log.recipient ? `${log.recipient.slice(0, 6)}...${log.recipient.slice(-4)}` : 'Same'}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 900, color: '#4ade80', fontSize: '1rem' }}>
                        ${log.amount.toFixed(2)} USDT
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontFamily: 'monospace' }}>
                        <a
                          href={`https://testnet.bscscan.com/tx/${log.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>{log.txHash ? `${log.txHash.slice(0, 6)}...` : 'Tx'}</span>
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

export default AdminWithdrawalsPage
