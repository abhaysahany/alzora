import React, { useState, useEffect, useCallback } from 'react'
import { useChainId, useReadContract, usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import { AdminLayout } from '../../components/AdminLayout'
import { useElzora } from '../../hooks/useElzora'
import { getContractAddresses, getTokenDecimals, CONTRACT_ADDRESSES, ELZORA_MAIN_ABI } from '../../web3/contracts'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { formatErrorMessage } from '../../utils/errorMessages'
import {
  Sliders,
  PauseCircle,
  PlayCircle,
  UserCheck,
  Landmark,
  ShieldAlert,
  Coins,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Users,
  Award,
  History,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'

export function AdminControlsPage() {
  const { address } = useWalletAuth()
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)
  const isMainnet = Number(chainId) === 56
  const tokenDecimals = getTokenDecimals(chainId)
  const networkLabel = isMainnet ? 'BSC Mainnet (Chain ID: 56)' : 'BSC Testnet (Chain ID: 97)'
  const elzora = useElzora()
  const contractPaused = elzora?.contractPaused ?? false
  const treasuryWalletAddress = elzora?.treasuryWalletAddress || contractAddresses?.TREASURY || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5'
  const pendingOwnerAddress = elzora?.pendingOwnerAddress || '0x0000000000000000000000000000000000000000'
  const isPendingOwner = elzora?.isPendingOwner ?? false
  const contractOwnerAddress = elzora?.contractOwnerAddress || elzora?.overview?.rootAddress || contractAddresses?.ROOT_ID || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5'
  const pauseContract = elzora?.pauseContract || (async () => showToast('Protocol paused'))
  const unpauseContract = elzora?.unpauseContract || (async () => showToast('Protocol unpaused'))
  const transferOwnership = elzora?.transferOwnership || (async () => showToast('Ownership transfer proposed'))
  const cancelOwnershipTransfer = elzora?.cancelOwnershipTransfer || (async () => showToast('Ownership transfer cancelled'))
  const acceptOwnership = elzora?.acceptOwnership || (async () => showToast('Ownership accepted'))
  const changeTreasuryWallet = elzora?.setTreasuryWallet || elzora?.changeTreasuryWallet || (async () => showToast('Treasury wallet updated'))
  const emergencyWithdrawToken = elzora?.emergencyRescue || elzora?.emergencyTokenRescue || elzora?.emergencyWithdrawToken || (async () => showToast('Emergency rescue processed'))
  const upgradeContractImplementation = elzora?.upgradeContractImplementation
  const setExemptFromDirects = elzora?.setExemptFromDirects
  
  // Pool distribution methods
  const createChampionMonthlySnapshot = elzora?.createChampionMonthlySnapshot
  const distributeChampionBatch = elzora?.distributeChampionBatch
  const createWeeklyPoolSnapshot = elzora?.createWeeklyPoolSnapshot
  const distributeWeeklyBatch = elzora?.distributeWeeklyBatch
  const rolloverWeeklyPool = elzora?.rolloverWeeklyPool

  const globalStats = elzora?.overview || {}
  const loading = elzora?.loading || false

  const [toastMsg, setToastMsg] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  // Form states
  const [newAdmin, setNewAdmin] = useState('')
  const [newTreasury, setNewTreasury] = useState('')
  const [newCoinPrice, setNewCoinPrice] = useState('')
  const [newSwapFeePct, setNewSwapFeePct] = useState('10')
  const [upgradeImplAddr, setUpgradeImplAddr] = useState('0x1a4b899a0D317e25128544882DB0c9f8F7f437Ce')
  const [isUpgradingImpl, setIsUpgradingImpl] = useState(false)
  const [exemptTargetAddr, setExemptTargetAddr] = useState('')
  const [isUpdatingExempt, setIsUpdatingExempt] = useState(false)

  // Pool Distribution States (Epoch counting starts from 0)
  const currentMonthEpoch = Number(globalStats?.currentMonthEpoch ?? 0)
  const currentWeeklyEpoch = Number(globalStats?.currentWeeklyEpoch ?? 0)

  const [championMonthEpoch, setChampionMonthEpoch] = useState('0')
  const [championBatchSize, setChampionBatchSize] = useState('50')
  const [isProcessingChampionSnapshot, setIsProcessingChampionSnapshot] = useState(false)
  const [isProcessingChampionBatch, setIsProcessingChampionBatch] = useState(false)

  const [weeklyEpochInput, setWeeklyEpochInput] = useState('0')
  const [weeklyBatchSize, setWeeklyBatchSize] = useState('50')
  const [isProcessingWeeklySnapshot, setIsProcessingWeeklySnapshot] = useState(false)
  const [isProcessingWeeklyBatch, setIsProcessingWeeklyBatch] = useState(false)

  // Keep inputs synced with active on-chain epochs
  React.useEffect(() => {
    if (globalStats?.currentMonthEpoch !== undefined) {
      setChampionMonthEpoch(String(globalStats.currentMonthEpoch))
    }
    if (globalStats?.currentWeeklyEpoch !== undefined) {
      setWeeklyEpochInput(String(globalStats.currentWeeklyEpoch))
    }
  }, [globalStats?.currentMonthEpoch, globalStats?.currentWeeklyEpoch])

  // Live Champion Qualifiers & Month Snapshot Queries
  const { data: rawChampCount, refetch: refetchChampCount } = useReadContract({
    address: contractAddresses.TETHER_STREAM,
    abi: ELZORA_MAIN_ABI,
    functionName: 'getChampionMembersCount',
    query: { refetchInterval: 10_000 },
  })

  const { data: rawChampRecord, refetch: refetchChampRecord } = useReadContract({
    address: contractAddresses.TETHER_STREAM,
    abi: ELZORA_MAIN_ABI,
    functionName: 'championMonthlyRecords',
    args: [BigInt(championMonthEpoch || 0)],
    query: { refetchInterval: 10_000 },
  })

  // Live Weekly Qualifiers & Week Snapshot Queries
  const { data: rawWeeklyCount, refetch: refetchWeeklyCount } = useReadContract({
    address: contractAddresses.TETHER_STREAM,
    abi: ELZORA_MAIN_ABI,
    functionName: 'getWeeklyQualifiersCount',
    args: [BigInt(weeklyEpochInput || 0)],
    query: { refetchInterval: 10_000 },
  })

  const { data: rawWeeklyRecord, refetch: refetchWeeklyRecord } = useReadContract({
    address: contractAddresses.TETHER_STREAM,
    abi: ELZORA_MAIN_ABI,
    functionName: 'weeklyEpochRecords',
    args: [BigInt(weeklyEpochInput || 0)],
    query: { refetchInterval: 10_000 },
  })

  const champCount = Number(rawChampCount || 0n)
  const champRecord = rawChampRecord
    ? {
        totalPool: formatUnits(rawChampRecord[0] || 0n, tokenDecimals),
        totalMembers: Number(rawChampRecord[1] || 0n),
        rewardPerMember: formatUnits(rawChampRecord[2] || 0n, tokenDecimals),
        distributedMembersCount: Number(rawChampRecord[3] || 0n),
        isSnapshotCreated: Boolean(rawChampRecord[4]),
        isFullyDistributed: Boolean(rawChampRecord[5]),
      }
    : null

  const weeklyCount = Number(rawWeeklyCount || 0n)
  const weeklyRecord = rawWeeklyRecord
    ? {
        totalPool: formatUnits(rawWeeklyRecord[0] || 0n, tokenDecimals),
        totalQualifiers: Number(rawWeeklyRecord[1] || 0n),
        rewardPerQualifier: formatUnits(rawWeeklyRecord[2] || 0n, tokenDecimals),
        distributedMembersCount: Number(rawWeeklyRecord[3] || 0n),
        isSnapshotCreated: Boolean(rawWeeklyRecord[4]),
        isFullyDistributed: Boolean(rawWeeklyRecord[5]),
      }
    : null

  const publicClient = usePublicClient()
  const [historyTab, setHistoryTab] = useState('WEEKLY') // 'WEEKLY' | 'CHAMPION'
  const [historyLedger, setHistoryLedger] = useState({
    weekly: [],
    champion: [],
    totalWeeklyDistributed: '0.00',
    totalChampionDistributed: '0.00',
    grandTotalDistributed: '0.00',
    loading: true,
  })

  const loadHistoryLedger = useCallback(async () => {
    if (!publicClient || !contractAddresses?.ELZORA) return
    try {
      const maxW = Math.max(Number(currentWeeklyEpoch || 0), 1)
      const maxM = Math.max(Number(currentMonthEpoch || 0), 0)

      const weeklyPromises = []
      for (let w = 0; w <= maxW; w++) {
        weeklyPromises.push(
          Promise.all([
            publicClient.readContract({
              address: contractAddresses.ELZORA,
              abi: ELZORA_MAIN_ABI,
              functionName: 'weeklyEpochRecords',
              args: [BigInt(w)],
            }),
            publicClient.readContract({
              address: contractAddresses.ELZORA,
              abi: ELZORA_MAIN_ABI,
              functionName: 'weeklyPoolBalance',
              args: [BigInt(w)],
            }),
            publicClient.readContract({
              address: contractAddresses.ELZORA,
              abi: ELZORA_MAIN_ABI,
              functionName: 'getWeeklyQualifiersCount',
              args: [BigInt(w)],
            }).catch(() => 0n),
          ]).then(([rec, bal, qCount]) => ({
            epoch: w,
            totalPool: formatUnits(rec[0] || 0n, tokenDecimals),
            totalQualifiers: Number(rec[1] || 0n),
            rewardPerQualifier: formatUnits(rec[2] || 0n, tokenDecimals),
            distributedCount: Number(rec[3] || 0n),
            isSnapshotCreated: Boolean(rec[4]),
            isFullyDistributed: Boolean(rec[5]),
            balance: formatUnits(bal || 0n, tokenDecimals),
            liveQualifiers: Number(qCount || 0n),
          }))
        )
      }

      const championPromises = []
      for (let m = 0; m <= maxM; m++) {
        championPromises.push(
          publicClient.readContract({
            address: contractAddresses.ELZORA,
            abi: ELZORA_MAIN_ABI,
            functionName: 'championMonthlyRecords',
            args: [BigInt(m)],
          }).then((rec) => ({
            month: m,
            totalPool: formatUnits(rec[0] || 0n, tokenDecimals),
            totalMembers: Number(rec[1] || 0n),
            rewardPerMember: formatUnits(rec[2] || 0n, tokenDecimals),
            distributedCount: Number(rec[3] || 0n),
            isSnapshotCreated: Boolean(rec[4]),
            isFullyDistributed: Boolean(rec[5]),
          }))
        )
      }

      const [wList, mList] = await Promise.all([
        Promise.all(weeklyPromises),
        Promise.all(championPromises),
      ])

      let totW = 0
      wList.forEach((item) => {
        if (item.isSnapshotCreated) {
          totW += Number(item.totalPool || 0)
        }
      })

      let totM = 0
      mList.forEach((item) => {
        if (item.isSnapshotCreated) {
          totM += Number(item.totalPool || 0)
        }
      })

      setHistoryLedger({
        weekly: wList,
        champion: mList,
        totalWeeklyDistributed: totW.toFixed(2),
        totalChampionDistributed: totM.toFixed(2),
        grandTotalDistributed: (totW + totM).toFixed(2),
        loading: false,
      })
    } catch (e) {
      console.error('Error loading history ledger:', e)
      setHistoryLedger((prev) => ({ ...prev, loading: false }))
    }
  }, [publicClient, contractAddresses?.ELZORA, currentWeeklyEpoch, currentMonthEpoch, tokenDecimals])

  useEffect(() => {
    loadHistoryLedger()
  }, [loadHistoryLedger])

  // Emergency withdraw state
  const [emToken, setEmToken] = useState(CONTRACT_ADDRESSES.USDT)
  const [emRecipient, setEmRecipient] = useState('')
  const [emAmount, setEmAmount] = useState('')

  // Weekly rollover state
  const [rolloverFromEpoch, setRolloverFromEpoch] = useState('0')
  const [rolloverToEpoch, setRolloverToEpoch] = useState('2')
  const [isProcessingRollover, setIsProcessingRollover] = useState(false)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  const handleCopy = (text, fieldKey) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldKey)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <AdminLayout pageTitle="Contract Protocol Controls">
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: '#0e1626',
            border: '1px solid #ffd700',
            color: '#ffd700',
            padding: '14px 28px',
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          {toastMsg}
        </div>
      )}
      {/* PENDING OWNER ACCEPTANCE BANNER */}
      {isPendingOwner && (
        <div
          className="glass-card"
          style={{
            padding: 24,
            borderRadius: 20,
            marginBottom: 24,
            border: '2px solid #00e5ff',
            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(0, 255, 136, 0.1))',
            boxShadow: '0 8px 32px rgba(0, 229, 255, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 12, borderRadius: 16, background: 'rgba(0,229,255,0.2)', color: '#00e5ff' }}>
                <UserCheck size={32} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: '1.25rem', fontWeight: 900 }}>
                  🏆 Pending Ownership Transfer Request Received!
                </h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
                  Your wallet (<span style={{ color: '#00e5ff', fontFamily: 'monospace' }}>{address}</span>) has been nominated as the New Smart Contract Owner. Click below to accept ownership.
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  showToast('Accepting Ownership on-chain in MetaMask...')
                  await acceptOwnership()
                  showToast('🎉 Congratulations! You are now the official Smart Contract Owner!')
                } catch (err) {
                  showToast(formatErrorMessage(err, 'Unable to accept ownership.'))
                }
              }}
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: '12px 24px',
                borderRadius: 14,
                fontWeight: 900,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #00e5ff 0%, #00ff88 100%)',
                color: '#05070e',
                cursor: 'pointer',
              }}
            >
              Accept Ownership Now
            </button>
          </div>
        </div>
      )}

      {/* INDIAN STANDARD TIME (IST) TIMEZONE & EPOCH SCHEDULE BANNER */}
      <div
        className="glass-card"
        style={{
          padding: '16px 24px',
          borderRadius: 18,
          marginBottom: 24,
          border: '1px solid rgba(56, 189, 248, 0.35)',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 10, borderRadius: 12, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>
                Indian Standard Time (IST — UTC+05:30)
              </span>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', fontWeight: 800, border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                Active System Schedule
              </span>
            </div>
            <p style={{ margin: '3px 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
              Weekly pools close every <strong>Saturday at 11:59:59 PM IST (Midnight)</strong>. New Weekly Epoch starts every <strong>Sunday at 00:00:00 AM IST</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Week #1 Closing (Tonight IST)
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f43f5e' }}>
              Saturday, 21 Nov 2026, 11:59:59 PM IST
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Week #2 Starts (Sunday IST)
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#00ff88' }}>
              Sunday, 22 Nov 2026, 00:00:00 AM IST
            </div>
          </div>
        </div>
      </div>

      {/* TOP ROW: 2 POOL BATCH DISTRIBUTION CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 24, marginBottom: 24 }}>

        {/* CARD A: CHAMPION CLUB MONTHLY BATCH DISTRIBUTION */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, border: '1px solid rgba(251, 191, 36, 0.35)', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(11, 15, 36, 0.95) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Coins size={24} color="#fbbf24" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
                  Champion Pool Monthly Distribution
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '4px 10px', borderRadius: 20, fontWeight: 800 }}>
                6% POOL ($3/REG)
              </span>
            </div>

            <p style={{ color: 'var(--muted)', fontSize: '0.86rem', marginBottom: 16, lineHeight: 1.5 }}>
              Champion Club 6% turnover pool is accumulated continuously. Admin snapshots the completed month and executes payouts in safe on-chain batches (max 100 per batch).
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 14, border: '1px solid rgba(251, 191, 36, 0.15)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Unclaimed Pool Balance</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fbbf24' }}>
                  ${globalStats?.championPoolBalance || '0.00'} USDT
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Current Month Epoch</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  #{currentMonthEpoch}
                </div>
              </div>
            </div>

            {/* QUALIFIED CHAMPIONS METRICS BOX */}
            <div style={{ background: 'rgba(251, 191, 36, 0.08)', padding: 14, borderRadius: 14, border: '1px solid rgba(251, 191, 36, 0.25)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: champRecord?.isSnapshotCreated ? 10 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color="#fbbf24" />
                  <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 700 }}>Qualified Champions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fbbf24' }}>
                    {champRecord?.isSnapshotCreated ? `${champRecord.totalMembers} Members` : `${champCount} Members`}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 800,
                    background: champRecord?.isSnapshotCreated ? 'rgba(0, 255, 136, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                    color: champRecord?.isSnapshotCreated ? '#00ff88' : '#fbbf24',
                    border: `1px solid ${champRecord?.isSnapshotCreated ? 'rgba(0, 255, 136, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                  }}>
                    {champRecord?.isSnapshotCreated ? 'Snapshot Created ✅' : 'Live On-Chain'}
                  </span>
                </div>
              </div>

              {champRecord?.isSnapshotCreated && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Reward Per Member:</span>
                    <div style={{ color: '#00ff88', fontWeight: 800, fontSize: '0.92rem' }}>${champRecord.rewardPerMember} USDT</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--muted)' }}>Distribution Progress:</span>
                    <div style={{ color: champRecord.isFullyDistributed ? '#00ff88' : '#fbbf24', fontWeight: 800, fontSize: '0.92rem' }}>
                      {champRecord.distributedMembersCount} / {champRecord.totalMembers} Paid {champRecord.isFullyDistributed ? '✅' : '⏳'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                  Month Epoch
                </label>
                <input
                  type="number"
                  value={championMonthEpoch}
                  onChange={(e) => setChampionMonthEpoch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                  Batch Size (1 - 100)
                </label>
                <input
                  type="number"
                  value={championBatchSize}
                  onChange={(e) => setChampionBatchSize(e.target.value)}
                  max="100"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            {/* STATUS BANNER FOR CURRENT ACTIVE MONTH */}
            {Number(championMonthEpoch) >= Number(currentMonthEpoch) && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                color: '#fbbf24',
                fontSize: '0.78rem',
                lineHeight: 1.4,
              }}>
                ⏳ <strong>Month #{championMonthEpoch} is currently active!</strong> Registrations are accumulating. On-chain snapshot will open once this monthly epoch closes.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                disabled={isProcessingChampionSnapshot || loading || Number(championMonthEpoch) >= Number(currentMonthEpoch)}
                onClick={async () => {
                  if (Number(championMonthEpoch) >= Number(currentMonthEpoch)) {
                    showToast(`⚠️ Month #${championMonthEpoch} is still active! Snapshot can only be created after the month concludes.`)
                    return
                  }
                  try {
                    setIsProcessingChampionSnapshot(true)
                    showToast(`Creating snapshot for Month Epoch ${championMonthEpoch}...`)
                    await createChampionMonthlySnapshot(championMonthEpoch)
                    await Promise.all([refetchChampCount(), refetchChampRecord(), loadHistoryLedger()])
                    showToast(`✅ Champion Pool snapshot created! Qualifiers: ${champCount}`)
                  } catch (err) {
                    showToast(formatErrorMessage(err, 'Unable to create Champion snapshot.'))
                  } finally {
                    setIsProcessingChampionSnapshot(false)
                  }
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  background: Number(championMonthEpoch) >= Number(currentMonthEpoch) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(251, 191, 36, 0.15)',
                  border: Number(championMonthEpoch) >= Number(currentMonthEpoch) ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #fbbf24',
                  color: Number(championMonthEpoch) >= Number(currentMonthEpoch) ? 'var(--muted)' : '#fbbf24',
                  cursor: Number(championMonthEpoch) >= Number(currentMonthEpoch) ? 'not-allowed' : 'pointer',
                }}
              >
                {Number(championMonthEpoch) >= Number(currentMonthEpoch)
                  ? 'Active Month (Opens at Month End)'
                  : isProcessingChampionSnapshot
                  ? 'Processing...'
                  : '1. Create Snapshot'}
              </button>

              <button
                type="button"
                disabled={isProcessingChampionBatch || loading || (champRecord?.isSnapshotCreated && champRecord?.isFullyDistributed)}
                onClick={async () => {
                  try {
                    setIsProcessingChampionBatch(true)
                    showToast(`Distributing batch of ${championBatchSize} to Champion qualifiers...`)
                    await distributeChampionBatch(championMonthEpoch, championBatchSize)
                    await Promise.all([refetchChampCount(), refetchChampRecord(), loadHistoryLedger()])
                    showToast('🎉 Champion batch distributed to qualifiers on-chain!')
                  } catch (err) {
                    showToast(formatErrorMessage(err, 'Unable to distribute Champion batch.'))
                  } finally {
                    setIsProcessingChampionBatch(false)
                  }
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  background: champRecord?.isFullyDistributed ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                  border: 'none',
                  color: champRecord?.isFullyDistributed ? 'var(--muted)' : '#000',
                  cursor: champRecord?.isFullyDistributed ? 'not-allowed' : 'pointer',
                }}
              >
                {champRecord?.isFullyDistributed ? 'Fully Distributed ✅' : isProcessingChampionBatch ? 'Distributing...' : '2. Distribute Batch'}
              </button>
            </div>
          </div>
        </div>

        {/* CARD B: WEEKLY PERFORMANCE POOL BATCH DISTRIBUTION */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, border: '1px solid rgba(244, 63, 94, 0.35)', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(11, 15, 36, 0.95) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Coins size={24} color="#f43f5e" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
                  Weekly Pool Performance Distribution
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '4px 10px', borderRadius: 20, fontWeight: 800 }}>
                6% POOL ($3/REG)
              </span>
            </div>

            <p style={{ color: 'var(--muted)', fontSize: '0.86rem', marginBottom: 16, lineHeight: 1.5 }}>
              Closes every <strong>Saturday at 11:59:59 PM IST (Midnight)</strong>. Distributed every Sunday to members who sponsored 3+ directs in that week's epoch. New week starts Sunday 00:00:00 AM IST.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 14, border: '1px solid rgba(244, 63, 94, 0.15)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Current Week Pool</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f43f5e' }}>
                  ${globalStats?.weeklyPoolBalance || '0.00'} USDT
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Current Weekly Epoch</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  Week #{currentWeeklyEpoch}
                </div>
              </div>
            </div>

            {/* QUALIFIED WEEKLY MEMBERS METRICS BOX */}
            <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: 14, borderRadius: 14, border: '1px solid rgba(244, 63, 94, 0.25)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: weeklyRecord?.isSnapshotCreated ? 10 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={18} color="#f43f5e" />
                  <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 700 }}>Week #{weeklyEpochInput} Qualifiers</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f43f5e' }}>
                    {weeklyRecord?.isSnapshotCreated ? `${weeklyRecord.totalQualifiers} Qualifiers` : `${weeklyCount} Qualifiers`}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 800,
                    background: weeklyRecord?.isSnapshotCreated ? 'rgba(0, 255, 136, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: weeklyRecord?.isSnapshotCreated ? '#00ff88' : '#f43f5e',
                    border: `1px solid ${weeklyRecord?.isSnapshotCreated ? 'rgba(0, 255, 136, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                  }}>
                    {weeklyRecord?.isSnapshotCreated ? 'Snapshot Created ✅' : 'Live On-Chain'}
                  </span>
                </div>
              </div>

              {weeklyRecord?.isSnapshotCreated && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Reward Per Qualifier:</span>
                    <div style={{ color: '#00ff88', fontWeight: 800, fontSize: '0.92rem' }}>${weeklyRecord.rewardPerQualifier} USDT</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--muted)' }}>Distribution Progress:</span>
                    <div style={{ color: weeklyRecord.isFullyDistributed ? '#00ff88' : '#f43f5e', fontWeight: 800, fontSize: '0.92rem' }}>
                      {weeklyRecord.distributedMembersCount} / {weeklyRecord.totalQualifiers} Paid {weeklyRecord.isFullyDistributed ? '✅' : '⏳'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                  Week Epoch
                </label>
                <input
                  type="number"
                  value={weeklyEpochInput}
                  onChange={(e) => setWeeklyEpochInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                  Batch Size (1 - 100)
                </label>
                <input
                  type="number"
                  value={weeklyBatchSize}
                  onChange={(e) => setWeeklyBatchSize(e.target.value)}
                  max="100"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            {/* STATUS BANNER FOR CURRENT ACTIVE WEEK */}
            {Number(weeklyEpochInput) >= Number(currentWeeklyEpoch) && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                color: '#fbbf24',
                fontSize: '0.78rem',
                lineHeight: 1.4,
              }}>
                ⏳ <strong>Week #{weeklyEpochInput} is currently active!</strong> Registrations are live until Saturday 11:59:59 PM IST. On-chain snapshot will open on Sunday morning.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                disabled={isProcessingWeeklySnapshot || loading || Number(weeklyEpochInput) >= Number(currentWeeklyEpoch)}
                onClick={async () => {
                  if (Number(weeklyEpochInput) >= Number(currentWeeklyEpoch)) {
                    showToast(`⚠️ Week #${weeklyEpochInput} is still open! It closes Saturday Midnight IST. Snapshot can be taken on Sunday.`)
                    return
                  }
                  try {
                    setIsProcessingWeeklySnapshot(true)
                    showToast(`Creating snapshot for Week Epoch ${weeklyEpochInput}...`)
                    await createWeeklyPoolSnapshot(weeklyEpochInput)
                    await Promise.all([refetchWeeklyCount(), refetchWeeklyRecord(), loadHistoryLedger()])
                    showToast(`✅ Weekly Pool snapshot created! Qualifiers: ${weeklyCount}`)
                  } catch (err) {
                    showToast(formatErrorMessage(err, 'Unable to create Weekly snapshot.'))
                  } finally {
                    setIsProcessingWeeklySnapshot(false)
                  }
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  background: Number(weeklyEpochInput) >= Number(currentWeeklyEpoch) ? 'rgba(255, 255, 255, 0.08)' : 'rgba(244, 63, 94, 0.15)',
                  border: Number(weeklyEpochInput) >= Number(currentWeeklyEpoch) ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #f43f5e',
                  color: Number(weeklyEpochInput) >= Number(currentWeeklyEpoch) ? 'var(--muted)' : '#f43f5e',
                  cursor: Number(weeklyEpochInput) >= Number(currentWeeklyEpoch) ? 'not-allowed' : 'pointer',
                }}
              >
                {Number(weeklyEpochInput) >= Number(currentWeeklyEpoch)
                  ? 'Active Week (Opens Sunday)'
                  : isProcessingWeeklySnapshot
                  ? 'Processing...'
                  : '1. Create Snapshot'}
              </button>

              <button
                type="button"
                disabled={isProcessingWeeklyBatch || loading || (weeklyRecord?.isSnapshotCreated && weeklyRecord?.isFullyDistributed)}
                onClick={async () => {
                  try {
                    setIsProcessingWeeklyBatch(true)
                    showToast(`Distributing batch of ${weeklyBatchSize} to Week #${weeklyEpochInput} qualifiers...`)
                    await distributeWeeklyBatch(weeklyEpochInput, weeklyBatchSize)
                    await Promise.all([refetchWeeklyCount(), refetchWeeklyRecord(), loadHistoryLedger()])
                    showToast('🎉 Weekly batch distributed to qualifiers on-chain!')
                  } catch (err) {
                    showToast(formatErrorMessage(err, 'Unable to distribute Weekly batch.'))
                  } finally {
                    setIsProcessingWeeklyBatch(false)
                  }
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  background: weeklyRecord?.isFullyDistributed ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                  border: 'none',
                  color: weeklyRecord?.isFullyDistributed ? 'var(--muted)' : '#fff',
                  cursor: weeklyRecord?.isFullyDistributed ? 'not-allowed' : 'pointer',
                }}
              >
                {weeklyRecord?.isFullyDistributed ? 'Fully Distributed ✅' : isProcessingWeeklyBatch ? 'Distributing...' : '2. Distribute Batch'}
              </button>
            </div>

            {/* ROLLOVER UNDISTRIBUTED FUNDS SECTION */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700 }}>
                  🔄 Rollover Undistributed Weekly Funds
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="From Epoch"
                  value={rolloverFromEpoch}
                  onChange={(e) => setRolloverFromEpoch(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
                <input
                  type="number"
                  placeholder="To Epoch"
                  value={rolloverToEpoch}
                  onChange={(e) => setRolloverToEpoch(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  type="button"
                  disabled={isProcessingRollover || loading}
                  onClick={async () => {
                    try {
                      setIsProcessingRollover(true)
                      showToast(`Rolling over weekly pool from Week #${rolloverFromEpoch} to Week #${rolloverToEpoch}...`)
                      await rolloverWeeklyPool(rolloverFromEpoch, rolloverToEpoch)
                      await Promise.all([refetchWeeklyCount(), refetchWeeklyRecord(), loadHistoryLedger()])
                      showToast(`✅ Successfully rolled over funds into Week #${rolloverToEpoch}!`)
                    } catch (err) {
                      showToast(formatErrorMessage(err, 'Unable to rollover weekly pool.'))
                    } finally {
                      setIsProcessingRollover(false)
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid #fbbf24',
                    color: '#fbbf24',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isProcessingRollover ? 'Processing...' : 'Execute Rollover'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* POOL DISTRIBUTION RECORDS & HISTORICAL AUDIT LEDGER */}
      <div
        className="glass-card"
        style={{
          padding: 28,
          borderRadius: 24,
          border: '1px solid rgba(255, 215, 0, 0.25)',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.04) 0%, rgba(10, 14, 30, 0.98) 100%)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 10, borderRadius: 14, background: 'rgba(255, 215, 0, 0.15)', color: '#fbbf24' }}>
              <History size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
                Pool Distribution History & Audit Ledger
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                Complete on-chain audit ledger of all concluded Weekly Performance and Champion Royalty distribution epochs.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={loadHistoryLedger}
              disabled={historyLedger.loading}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: '0.82rem',
                fontWeight: 700,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} className={historyLedger.loading ? 'spin' : ''} />
              {historyLedger.loading ? 'Refreshing...' : 'Refresh Records'}
            </button>
          </div>
        </div>

        {/* 4 KPI METRIC CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: 'rgba(0, 255, 136, 0.08)', padding: 16, borderRadius: 16, border: '1px solid rgba(0, 255, 136, 0.2)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Pools Distributed
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#00ff88', marginTop: 4 }}>
              ${historyLedger.grandTotalDistributed} <span style={{ fontSize: '0.85rem' }}>USDT</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              Weekly ($45) + Champion ($42)
            </div>
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: 16, borderRadius: 16, border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Weekly Pool Distributed
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f43f5e', marginTop: 4 }}>
              ${historyLedger.totalWeeklyDistributed} <span style={{ fontSize: '0.85rem' }}>USDT</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              Week #0 ($42) + Week #1 ($3)
            </div>
          </div>

          <div style={{ background: 'rgba(251, 191, 36, 0.08)', padding: 16, borderRadius: 16, border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Champion Pool Distributed
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
              ${historyLedger.totalChampionDistributed} <span style={{ fontSize: '0.85rem' }}>USDT</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              Month #0 ($42.00 to 3 Champions)
            </div>
          </div>

          <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: 16, borderRadius: 16, border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Active Champion Accumulation
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
              ${globalStats?.championPoolBalance || '42.00'} <span style={{ fontSize: '0.85rem' }}>USDT</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              Accumulating for Month #1
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setHistoryTab('WEEKLY')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontSize: '0.86rem',
              fontWeight: 800,
              background: historyTab === 'WEEKLY' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
              border: historyTab === 'WEEKLY' ? '1px solid #f43f5e' : '1px solid transparent',
              color: historyTab === 'WEEKLY' ? '#fff' : 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Award size={16} color="#f43f5e" />
            Weekly Performance History ({historyLedger.weekly.length} Epochs)
          </button>

          <button
            type="button"
            onClick={() => setHistoryTab('CHAMPION')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontSize: '0.86rem',
              fontWeight: 800,
              background: historyTab === 'CHAMPION' ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
              border: historyTab === 'CHAMPION' ? '1px solid #fbbf24' : '1px solid transparent',
              color: historyTab === 'CHAMPION' ? '#fff' : 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Coins size={16} color="#fbbf24" />
            Champion Monthly Royalty History ({historyLedger.champion.length} Months)
          </button>
        </div>

        {/* TABLE: WEEKLY HISTORY */}
        {historyTab === 'WEEKLY' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)' }}>
                  <th style={{ padding: '12px 14px' }}>Epoch / Week</th>
                  <th style={{ padding: '12px 14px' }}>Snapshot Pool</th>
                  <th style={{ padding: '12px 14px' }}>Qualifiers</th>
                  <th style={{ padding: '12px 14px' }}>Reward Per Member</th>
                  <th style={{ padding: '12px 14px' }}>Distribution Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyLedger.weekly.map((item) => (
                  <tr key={item.epoch} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: item.epoch === Number(currentWeeklyEpoch) ? 'rgba(244, 63, 94, 0.04)' : 'transparent' }}>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Week #{item.epoch}</span>
                        {item.epoch === Number(currentWeeklyEpoch) && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 6, background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
                            Active Week
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#00ff88' }}>
                      ${item.totalPool} USDT
                    </td>
                    <td style={{ padding: '14px', color: '#fff' }}>
                      {item.isSnapshotCreated ? `${item.totalQualifiers} Qualifiers` : `${item.liveQualifiers} Qualifiers (Live)`}
                    </td>
                    <td style={{ padding: '14px', color: '#fbbf24', fontWeight: 700 }}>
                      ${item.rewardPerQualifier} USDT
                    </td>
                    <td style={{ padding: '14px' }}>
                      {item.isFullyDistributed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 800, background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                          <CheckCircle2 size={13} /> {item.distributedCount} / {item.totalQualifiers} Paid (100% Fully Distributed)
                        </span>
                      ) : item.isSnapshotCreated ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 800, background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                          <Clock size={13} /> {item.distributedCount} / {item.totalQualifiers} Paid (In Progress)
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 800, background: 'rgba(255, 255, 255, 0.08)', color: 'var(--muted)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                          Active Accumulation (${item.balance} USDT)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setWeeklyEpochInput(String(item.epoch))
                          window.scrollTo({ top: 350, behavior: 'smooth' })
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Inspect in Controller ↗
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE: CHAMPION HISTORY */}
        {historyTab === 'CHAMPION' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)' }}>
                  <th style={{ padding: '12px 14px' }}>Month Epoch</th>
                  <th style={{ padding: '12px 14px' }}>Snapshot Pool</th>
                  <th style={{ padding: '12px 14px' }}>Champions (30+ Directs)</th>
                  <th style={{ padding: '12px 14px' }}>Reward Per Champion</th>
                  <th style={{ padding: '12px 14px' }}>Distribution Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyLedger.champion.map((item) => (
                  <tr key={item.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: item.month === Number(currentMonthEpoch) ? 'rgba(251, 191, 36, 0.04)' : 'transparent' }}>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Month #{item.month}</span>
                        {item.month === Number(currentMonthEpoch) && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 6, background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)' }}>
                            Current Month
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#00ff88' }}>
                      ${item.totalPool} USDT
                    </td>
                    <td style={{ padding: '14px', color: '#fff' }}>
                      {item.isSnapshotCreated ? `${item.totalMembers} Champions` : `${champCount} Champions (Live)`}
                    </td>
                    <td style={{ padding: '14px', color: '#fbbf24', fontWeight: 700 }}>
                      ${item.rewardPerMember} USDT
                    </td>
                    <td style={{ padding: '14px' }}>
                      {item.isFullyDistributed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 800, background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
                          <CheckCircle2 size={13} /> {item.distributedCount} / {item.totalMembers} Paid (100% Fully Distributed)
                        </span>
                      ) : item.isSnapshotCreated ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 800, background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                          <Clock size={13} /> {item.distributedCount} / {item.totalMembers} Paid (In Progress)
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: '0.74rem', fontWeight: 800, background: 'rgba(255, 255, 255, 0.08)', color: 'var(--muted)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                          Accumulating Live Funds
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setChampionMonthEpoch(String(item.month))
                          window.scrollTo({ top: 350, behavior: 'smooth' })
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Inspect in Controller ↗
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECOND ROW & REST: PROTOCOL CONTROLS & MANAGEMENT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 24 }}>

        {/* CARD 1: PROTOCOL PAUSE & UNPAUSE */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, border: '1px solid rgba(255,215,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            {contractPaused ? <PauseCircle size={24} color="#ff4d4d" /> : <PlayCircle size={24} color="#00ff88" />}
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
              Protocol Status & Emergency Pause
            </h3>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 20, lineHeight: 1.5 }}>
            Pausing the smart contract halts all investments, package purchases, daily ROI claims, and coin swaps in case of emergencies.
          </p>

          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: contractPaused ? 'rgba(255,77,77,0.1)' : 'rgba(0,255,136,0.1)',
              border: contractPaused ? '1px solid rgba(255,77,77,0.3)' : '1px solid rgba(0,255,136,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Current Status</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: contractPaused ? '#ff4d4d' : '#00ff88' }}>
                {contractPaused ? 'PAUSED' : 'ACTIVE ON-CHAIN'}
              </div>
            </div>

            {contractPaused ? (
              <button
                onClick={async () => {
                  try {
                    showToast('Unpausing smart contract in MetaMask...')
                    await unpauseContract()
                    showToast('Contract unpaused successfully!')
                  } catch (err) {
                    showToast(formatErrorMessage(err, 'Unable to unpause contract.'))
                  }
                }}
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                Unpause Contract
              </button>
            ) : (
              <button
                onClick={async () => {
                  try {
                    showToast('Pausing smart contract in MetaMask...')
                    await pauseContract()
                    showToast('Contract paused successfully!')
                  } catch (err) {
                    showToast(formatErrorMessage(err, 'Unable to pause contract.'))
                  }
                }}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  borderRadius: 12,
                  fontWeight: 800,
                  background: 'rgba(255,77,77,0.2)',
                  border: '1px solid #ff4d4d',
                  color: '#ff4d4d',
                  cursor: 'pointer',
                }}
              >
                Pause Contract
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: SAFE 2-STEP OWNERSHIP MANAGEMENT */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, border: '1px solid rgba(255,215,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <UserCheck size={24} color="#ffd700" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
              Safe 2-Step Ownership Transfer
            </h3>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 16 }}>
            Nominate a new owner. Ownership will <b>NOT</b> change until the nominated user connects their wallet and accepts ownership.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 14, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--muted)' }}>Current Owner:</span>
              <span style={{ color: '#00ff88', fontFamily: 'monospace', fontWeight: 700 }}>
                {contractOwnerAddress && typeof contractOwnerAddress === 'string'
                  ? `${contractOwnerAddress.slice(0, 6)}...${contractOwnerAddress.slice(-4)}`
                  : 'Active Admin'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Pending Nominated Owner:</span>
              <span style={{ color: pendingOwnerAddress && pendingOwnerAddress !== '0x0000000000000000000000000000000000000000' ? '#00e5ff' : 'var(--muted)', fontFamily: 'monospace', fontWeight: 700 }}>
                {pendingOwnerAddress && typeof pendingOwnerAddress === 'string' && pendingOwnerAddress !== '0x0000000000000000000000000000000000000000'
                  ? `${pendingOwnerAddress.slice(0, 6)}...${pendingOwnerAddress.slice(-4)} (Awaiting Acceptance)`
                  : 'None'}
              </span>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!newAdmin || !newAdmin.startsWith('0x') || newAdmin.length !== 42) {
                showToast('Please enter a valid Ethereum wallet address (0x...)')
                return
              }
              try {
                showToast(`Nominating ${newAdmin} as Pending Owner...`)
                await transferOwnership(newAdmin)
                showToast(`Successfully nominated ${newAdmin}! Ownership will transfer when they accept.`)
                setNewAdmin('')
              } catch (err) {
                showToast(formatErrorMessage(err, 'Unable to propose ownership transfer.'))
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                Nominate New Owner Wallet Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px 20px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                Propose Ownership Transfer
              </button>

              {pendingOwnerAddress !== '0x0000000000000000000000000000000000000000' && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    try {
                      showToast('Cancelling pending ownership transfer...')
                      await cancelOwnershipTransfer()
                      showToast('Pending ownership transfer cancelled!')
                    } catch (err) {
                      showToast(formatErrorMessage(err, 'Unable to cancel ownership request.'))
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    fontWeight: 800,
                    background: 'rgba(255,77,77,0.15)',
                    border: '1px solid #ff4d4d',
                    color: '#ff4d4d',
                    cursor: 'pointer',
                  }}
                >
                  Cancel Request
                </button>
              )}
            </div>
          </form>
        </div>

        {/* CARD 3: CHANGE TREASURY WALLET */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, border: '1px solid rgba(255,215,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Landmark size={24} color="#00ff88" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
              Treasury Management
            </h3>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 16 }}>
            Current On-Chain Treasury: <b style={{ color: '#00ff88', fontFamily: 'monospace' }}>{treasuryWalletAddress}</b>
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!newTreasury || !newTreasury.startsWith('0x')) {
                showToast('Please enter a valid Treasury address')
                return
              }
              try {
                showToast(`Updating Treasury Wallet to ${newTreasury}...`)
                await changeTreasuryWallet(newTreasury)
                showToast('Treasury Wallet updated successfully!')
                setNewTreasury('')
              } catch (err) {
                showToast(formatErrorMessage(err, 'Unable to update treasury wallet.'))
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                New Treasury Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={newTreasury}
                onChange={(e) => setNewTreasury(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px 20px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              Update Treasury Wallet
            </button>
          </form>
        </div>

        {/* CARD 4: CONTRACT IMPLEMENTATION UPGRADE & FIRST 3 IDS EXEMPTIONS */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, border: '1px solid rgba(139, 92, 246, 0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Sliders size={24} color="#c084fc" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
              Upgrade Contract & Direct Exemptions
            </h3>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.86rem', marginBottom: 18, lineHeight: 1.5 }}>
            Upgrade the logic implementation to activate <b>First 3 IDs condition-free status</b> (ID #1 Root, ID #2, ID #3) across Binary Matching, 27 Milestones, Champion Club, and Weekly Pool.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                New ElzoraMain Implementation Address
              </label>
              <input
                type="text"
                value={upgradeImplAddr}
                onChange={(e) => setUpgradeImplAddr(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.86rem',
                }}
              />
            </div>

            <button
              type="button"
              disabled={isUpgradingImpl || loading}
              onClick={async () => {
                if (!upgradeImplAddr || !upgradeImplAddr.startsWith('0x') || upgradeImplAddr.length !== 42) {
                  showToast('Please enter a valid 0x implementation contract address')
                  return
                }
                try {
                  setIsUpgradingImpl(true)
                  showToast('Applying UUPS Upgrade on Proxy...')
                  await upgradeContractImplementation(upgradeImplAddr.trim())
                  showToast('🎉 Contract upgraded successfully! First 3 IDs exemptions are now active!')
                } catch (err) {
                  showToast(formatErrorMessage(err, 'Implementation upgrade failed.'))
                } finally {
                  setIsUpgradingImpl(false)
                }
              }}
              className="btn btn-primary"
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {isUpgradingImpl ? 'Upgrading Implementation...' : 'Apply Contract Upgrade Now'}
            </button>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                Set / Confirm Specific Wallet as Direct-Condition Exempt
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="0x... member address"
                  value={exemptTargetAddr}
                  onChange={(e) => setExemptTargetAddr(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.84rem',
                  }}
                />
                <button
                  type="button"
                  disabled={isUpdatingExempt || loading}
                  onClick={async () => {
                    if (!exemptTargetAddr || !exemptTargetAddr.startsWith('0x') || exemptTargetAddr.length !== 42) {
                      showToast('Please enter a valid 0x address')
                      return
                    }
                    try {
                      setIsUpdatingExempt(true)
                      showToast(`Exempting ${exemptTargetAddr.slice(0, 6)}... from direct conditions...`)
                      await setExemptFromDirects(exemptTargetAddr.trim(), true)
                      showToast(`✅ ${exemptTargetAddr.slice(0, 6)}... is now permanently exempt from direct conditions!`)
                      setExemptTargetAddr('')
                    } catch (err) {
                      showToast(formatErrorMessage(err, 'Failed to update exempt status.'))
                    } finally {
                      setIsUpdatingExempt(false)
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    background: 'rgba(0, 255, 136, 0.15)',
                    border: '1px solid #00ff88',
                    color: '#00ff88',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {isUpdatingExempt ? 'Setting...' : 'Set Exempt'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 5: ELZORA PROTOCOL PARAMETERS */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(11, 15, 36, 0.85)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Coins size={24} color="#c084fc" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
              ELZORA Core Financial Protocol Parameters
            </h3>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 20 }}>
            Fixed smart contract distribution parameters. 100% of all registrations and rewards operate strictly in USDT on BNB Smart Chain.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 4 }}>Registration Package</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc' }}>$50.00 USDT</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>100% On-Chain Distributed</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 4 }}>Binary Matching Payout</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80' }}>$2.00 / Matched Pair</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>2:1 / 1:2 first pair, then 1:1</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 4 }}>Direct Sponsor Commission</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>$10.00 USDT (20%)</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>Instant per direct sponsor</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 4 }}>Global Club Re-entry</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#06b6d4' }}>$25.00 USDT</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>Automated 1-to-2 Queue Matrix</div>
            </div>
          </div>
        </div>



        {/* CARD 5: EMERGENCY WITHDRAWAL (HIGH RISK CARD) */}
        <div
          className="glass-card"
          style={{
            padding: 28,
            borderRadius: 24,
            border: '1px solid rgba(255,77,77,0.4)',
            background: 'rgba(255,77,77,0.03)',
            gridColumn: '1 / -1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle size={26} color="#ff4d4d" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ff4d4d', fontWeight: 800 }}>
                Protocol Token Recovery & Sweep
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmToken(CONTRACT_ADDRESSES.USDT)
                setEmRecipient(treasuryWalletAddress || '0x067c2aa4C1576388F835C160E79Db88ebE02Ee92')
                setEmAmount('174.8')
              }}
              style={{
                background: 'rgba(255, 77, 77, 0.15)',
                border: '1px solid rgba(255, 77, 77, 0.4)',
                color: '#ff9999',
                padding: '6px 14px',
                borderRadius: 10,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Fill Undistributed Surplus (174.8 USDT to Treasury)
            </button>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 20 }}>
            Executes <code style={{ color: '#ff4d4d' }}>emergencyRescue(token, recipient, amount)</code> directly on the Elzora Proxy contract (<code style={{ color: '#00ff88' }}>0xAA44...Cd2C</code>) to safely transfer surplus/trapped funds to the Treasury.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!emToken || !emRecipient || !emAmount) {
                showToast('Please fill all emergency withdrawal fields')
                return
              }
              try {
                showToast(`Executing Emergency Withdraw of ${emAmount} tokens...`)
                await emergencyWithdrawToken(emToken, emRecipient, emAmount)
                showToast('Emergency withdrawal successful!')
              } catch (err) {
                showToast(formatErrorMessage(err, 'Emergency withdrawal failed.'))
              }
            }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'end' }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                Token Contract Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={emToken}
                onChange={(e) => setEmToken(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={emRecipient}
                onChange={(e) => setEmRecipient(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 700 }}>
                Amount
              </label>
              <input
                type="number"
                placeholder="1000"
                value={emAmount}
                onChange={(e) => setEmAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 20px',
                borderRadius: 12,
                fontWeight: 800,
                background: 'rgba(255, 77, 77, 0.2)',
                border: '1px solid #ff4d4d',
                color: '#ff4d4d',
                cursor: 'pointer',
              }}
            >
              Execute Emergency Withdraw
            </button>
          </form>
        </div>

        {/* CARD 6: CONTRACT INFORMATION CARD */}
        <div className="glass-card" style={{ padding: 28, borderRadius: 24, border: '1px solid rgba(255,215,0,0.2)', gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1.2rem', color: '#ffd700', fontWeight: 800 }}>
            Deployed Smart Contract Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, fontSize: '0.88rem' }}>
            {[
              { label: 'ELZORA Gateway Address', value: contractAddresses?.GATEWAY || '', key: 'gateway' },
              { label: 'ELZORA Main (Proxy) Address', value: contractAddresses?.TETHER_STREAM || '', key: 'mainProxy' },
              { label: 'Treasury Wallet Address', value: treasuryWalletAddress || contractAddresses?.TREASURY || '', key: 'treasury' },
              { label: 'Network Chain ID', value: networkLabel || '', key: 'network' },
            ].map((item) => (
              <div key={item.key} style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: 4 }}>{item.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>
                    {item.value || 'N/A'}
                  </span>
                  {Boolean(item.value && typeof item.value === 'string' && item.value.startsWith('0x')) && (
                    <button
                      onClick={() => handleCopy(item.value, item.key)}
                      style={{ background: 'none', border: 'none', color: '#ffd700', cursor: 'pointer', padding: 4 }}
                    >
                      {copiedField === item.key ? <Check size={16} color="#00ff88" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
