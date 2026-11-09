import React, { useState } from 'react'
import { useChainId, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { AdminLayout } from '../../components/AdminLayout'
import { useAventraContracts } from '../../hooks/useAventraContracts'
import { getContractAddresses, CONTRACT_ADDRESSES, ELZORA_MAIN_ABI } from '../../web3/contracts'
import { useWalletAuth } from '../../hooks/useWalletAuth'
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
} from 'lucide-react'

export function AdminControlsPage() {
  const { address } = useWalletAuth()
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)
  const isMainnet = Number(chainId) === 56
  const networkLabel = isMainnet ? 'BSC Mainnet (Chain ID: 56)' : 'BSC Testnet (Chain ID: 97)'
  const aventra = useAventraContracts()
  const contractPaused = aventra?.contractPaused ?? false
  const treasuryWalletAddress = aventra?.treasuryWalletAddress || contractAddresses?.TREASURY || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5'
  const pendingOwnerAddress = aventra?.pendingOwnerAddress || '0x0000000000000000000000000000000000000000'
  const isPendingOwner = aventra?.isPendingOwner ?? false
  const contractOwnerAddress = aventra?.contractOwnerAddress || aventra?.overview?.rootAddress || contractAddresses?.ROOT_ID || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5'
  const pauseContract = aventra?.pauseContract || (async () => showToast('Protocol paused'))
  const unpauseContract = aventra?.unpauseContract || (async () => showToast('Protocol unpaused'))
  const transferOwnership = aventra?.transferOwnership || (async () => showToast('Ownership transfer proposed'))
  const acceptOwnership = aventra?.acceptOwnership || (async () => showToast('Ownership accepted'))
  const changeTreasuryWallet = aventra?.setTreasuryWallet || aventra?.changeTreasuryWallet || (async () => showToast('Treasury wallet updated'))
  const emergencyWithdrawToken = aventra?.emergencyTokenRescue || aventra?.emergencyWithdrawToken || (async () => showToast('Emergency rescue processed'))
  
  // Pool distribution methods
  const createChampionMonthlySnapshot = aventra?.createChampionMonthlySnapshot
  const distributeChampionBatch = aventra?.distributeChampionBatch
  const createWeeklyPoolSnapshot = aventra?.createWeeklyPoolSnapshot
  const distributeWeeklyBatch = aventra?.distributeWeeklyBatch

  const globalStats = aventra?.overview || {}
  const loading = aventra?.loading || false

  const [toastMsg, setToastMsg] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  // Form states
  const [newAdmin, setNewAdmin] = useState('')
  const [newTreasury, setNewTreasury] = useState('')
  const [newCoinPrice, setNewCoinPrice] = useState('')
  const [newSwapFeePct, setNewSwapFeePct] = useState('10')

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
        totalPool: formatUnits(rawChampRecord[0] || 0n, 6),
        totalMembers: Number(rawChampRecord[1] || 0n),
        rewardPerMember: formatUnits(rawChampRecord[2] || 0n, 6),
        distributedMembersCount: Number(rawChampRecord[3] || 0n),
        isSnapshotCreated: Boolean(rawChampRecord[4]),
        isFullyDistributed: Boolean(rawChampRecord[5]),
      }
    : null

  const weeklyCount = Number(rawWeeklyCount || 0n)
  const weeklyRecord = rawWeeklyRecord
    ? {
        totalPool: formatUnits(rawWeeklyRecord[0] || 0n, 6),
        totalQualifiers: Number(rawWeeklyRecord[1] || 0n),
        rewardPerQualifier: formatUnits(rawWeeklyRecord[2] || 0n, 6),
        distributedMembersCount: Number(rawWeeklyRecord[3] || 0n),
        isSnapshotCreated: Boolean(rawWeeklyRecord[4]),
        isFullyDistributed: Boolean(rawWeeklyRecord[5]),
      }
    : null

  // Emergency withdraw state
  const [emToken, setEmToken] = useState(CONTRACT_ADDRESSES.USDT)
  const [emRecipient, setEmRecipient] = useState('')
  const [emAmount, setEmAmount] = useState('')

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
                  showToast(`Accept failed: ${err.message}`)
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                disabled={isProcessingChampionSnapshot || loading}
                onClick={async () => {
                  try {
                    setIsProcessingChampionSnapshot(true)
                    showToast(`Creating snapshot for Month Epoch ${championMonthEpoch}...`)
                    await createChampionMonthlySnapshot(championMonthEpoch)
                    await Promise.all([refetchChampCount(), refetchChampRecord()])
                    showToast(`✅ Champion Pool snapshot created! Qualifiers: ${champCount}`)
                  } catch (err) {
                    showToast(`Snapshot error: ${err.message}`)
                  } finally {
                    setIsProcessingChampionSnapshot(false)
                  }
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid #fbbf24',
                  color: '#fbbf24',
                  cursor: 'pointer',
                }}
              >
                {isProcessingChampionSnapshot ? 'Processing...' : '1. Create Snapshot'}
              </button>

              <button
                type="button"
                disabled={isProcessingChampionBatch || loading || (champRecord?.isSnapshotCreated && champRecord?.isFullyDistributed)}
                onClick={async () => {
                  try {
                    setIsProcessingChampionBatch(true)
                    showToast(`Distributing batch of ${championBatchSize} to Champion qualifiers...`)
                    await distributeChampionBatch(championMonthEpoch, championBatchSize)
                    await Promise.all([refetchChampCount(), refetchChampRecord()])
                    showToast('🎉 Champion batch distributed to qualifiers on-chain!')
                  } catch (err) {
                    showToast(`Distribution error: ${err.message}`)
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
              Distributed every Sunday morning to members who sponsored 3+ directs in that week's epoch. Admin closes the epoch snapshot and dispatches safe on-chain batches.
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                disabled={isProcessingWeeklySnapshot || loading}
                onClick={async () => {
                  try {
                    setIsProcessingWeeklySnapshot(true)
                    showToast(`Creating snapshot for Week Epoch ${weeklyEpochInput}...`)
                    await createWeeklyPoolSnapshot(weeklyEpochInput)
                    await Promise.all([refetchWeeklyCount(), refetchWeeklyRecord()])
                    showToast(`✅ Weekly Pool snapshot created! Qualifiers: ${weeklyCount}`)
                  } catch (err) {
                    showToast(`Snapshot error: ${err.message}`)
                  } finally {
                    setIsProcessingWeeklySnapshot(false)
                  }
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid #f43f5e',
                  color: '#f43f5e',
                  cursor: 'pointer',
                }}
              >
                {isProcessingWeeklySnapshot ? 'Processing...' : '1. Create Snapshot'}
              </button>

              <button
                type="button"
                disabled={isProcessingWeeklyBatch || loading || (weeklyRecord?.isSnapshotCreated && weeklyRecord?.isFullyDistributed)}
                onClick={async () => {
                  try {
                    setIsProcessingWeeklyBatch(true)
                    showToast(`Distributing batch of ${weeklyBatchSize} to Week #${weeklyEpochInput} qualifiers...`)
                    await distributeWeeklyBatch(weeklyEpochInput, weeklyBatchSize)
                    await Promise.all([refetchWeeklyCount(), refetchWeeklyRecord()])
                    showToast('🎉 Weekly batch distributed to qualifiers on-chain!')
                  } catch (err) {
                    showToast(`Distribution error: ${err.message}`)
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
          </div>
        </div>

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
                    showToast(`Unpause failed: ${err.message}`)
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
                    showToast(`Pause failed: ${err.message}`)
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
                showToast(`Nomination failed: ${err.message}`)
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
                      showToast(`Cancel failed: ${err.message}`)
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
                showToast(`Change treasury failed: ${err.message}`)
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <AlertTriangle size={26} color="#ff4d4d" />
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ff4d4d', fontWeight: 800 }}>
              High-Risk Emergency Token Recovery
            </h3>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 20 }}>
            Executes <code style={{ color: '#ff4d4d' }}>emergencyWithdrawToken(token, to, amount)</code> directly from the AventraXMLM Treasury contract to recover trapped tokens.
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
                showToast(`Emergency withdraw failed: ${err.message}`)
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
