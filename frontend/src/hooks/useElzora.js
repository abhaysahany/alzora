import { useState, useEffect, useCallback } from 'react'
import { useReadContract, useWriteContract, useChainId, usePublicClient } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'
import { useWalletAuth } from './useWalletAuth'
import {
  getContractAddresses,
  ELZORA_GATEWAY_ABI,
  ELZORA_MAIN_ABI,
  ERC20_ABI,
} from '../web3/contracts'

const RANK_NAMES = [
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

export function useElzora() {
  const { address, isConnected } = useWalletAuth()
  const chainId = useChainId()
  const CONTRACT_ADDRESSES = getContractAddresses(chainId)
  const activeChain = Number(chainId) === 97 ? bscTestnet : bsc

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  // 1. Fetch User Dashboard via ElzoraGateway
  const {
    data: dashData,
    refetch: refetchDash,
    isFetched: isDashFetched,
    isLoading: isDashLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.GATEWAY,
    abi: ELZORA_GATEWAY_ABI,
    functionName: 'getUserDashboard',
    args: [address],
    query: {
      enabled: Boolean(address && isConnected),
      staleTime: 30_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: false,
    },
  })

  // 1b. Direct fallback user read (in case getUserDashboard fails due to struct variations)
  const {
    data: directUserData,
    refetch: refetchDirectUser,
    isFetched: isDirectUserFetched,
    isLoading: isDirectUserLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.GATEWAY,
    abi: ELZORA_GATEWAY_ABI,
    functionName: 'getUser',
    args: [address],
    query: {
      enabled: Boolean(address && isConnected),
      staleTime: 30_000,
      refetchInterval: 15_000,
      refetchOnWindowFocus: false,
    },
  })

  // 1c. Direct Income Breakdown read (Gateway getIncomeBreakdown)
  const {
    data: directIncomeData,
    refetch: refetchDirectIncome,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.GATEWAY,
    abi: ELZORA_GATEWAY_ABI,
    functionName: 'getIncomeBreakdown',
    args: [address],
    query: {
      enabled: Boolean(address && isConnected),
      staleTime: 10_000,
      refetchInterval: 10_000,
      refetchOnWindowFocus: true,
    },
  })

  // 1d. Direct Referrals list read (Gateway getDirectReferrals)
  const {
    data: directRefsData,
    refetch: refetchDirectRefs,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.GATEWAY,
    abi: ELZORA_GATEWAY_ABI,
    functionName: 'getDirectReferrals',
    args: [address],
    query: {
      enabled: Boolean(address && isConnected),
      staleTime: 10_000,
      refetchInterval: 10_000,
      refetchOnWindowFocus: true,
    },
  })

  // 2. Fetch Protocol Overview via ElzoraGateway
  const {
    data: overviewData,
    refetch: refetchOverview,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.GATEWAY,
    abi: ELZORA_GATEWAY_ABI,
    functionName: 'getProtocolOverview',
    query: {
      staleTime: 15_000,
      refetchInterval: 30_000,
    },
  })

  // 3. Fetch User USDT Balance & Allowance to Gateway
  const { data: usdtBalData, refetch: refetchUsdtBal } = useReadContract({
    address: CONTRACT_ADDRESSES.USDT,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: Boolean(address && isConnected),
      staleTime: 0,
      refetchInterval: 5_000,
      refetchOnWindowFocus: true,
    },
  })

  const { data: usdtAllowanceData, refetch: refetchUsdtAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.USDT,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, CONTRACT_ADDRESSES.GATEWAY],
    query: {
      enabled: Boolean(address && isConnected),
      staleTime: 0,
      refetchInterval: 5_000,
      refetchOnWindowFocus: true,
    },
  })

  // 4. Fetch Contract Owner & Pending Owner On-Chain
  const {
    data: onChainOwnerData,
    isLoading: isOwnerLoading,
    isFetched: isOwnerFetched,
    refetch: refetchOwner,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.TETHER_STREAM,
    abi: ELZORA_MAIN_ABI,
    functionName: 'owner',
    query: {
      refetchInterval: 10_000,
    },
  })

  const {
    data: onChainPendingOwnerData,
    isLoading: isPendingOwnerLoading,
    isFetched: isPendingOwnerFetched,
    refetch: refetchPendingOwner,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.TETHER_STREAM,
    abi: ELZORA_MAIN_ABI,
    functionName: 'pendingOwner',
    query: {
      refetchInterval: 5_000,
    },
  })

  // Format User Profile
  const rawProfile = dashData?.profile || directUserData
  const rawIncome = dashData?.income || directIncomeData
  const directRefs = (dashData?.directReferrals && dashData.directReferrals.length > 0)
    ? dashData.directReferrals
    : (directRefsData || [])

  const contractOwnerAddress = onChainOwnerData || CONTRACT_ADDRESSES.OWNER_ADDRESS || '0x1AD6f582C38C0Ee6036b4EBCd9Af2Be3376D3DE5'
  const pendingOwnerAddress = onChainPendingOwnerData || '0x0000000000000000000000000000000000000000'
  const isPendingOwner = Boolean(
    address &&
    pendingOwnerAddress &&
    pendingOwnerAddress !== '0x0000000000000000000000000000000000000000' &&
    address.toLowerCase() === pendingOwnerAddress.toLowerCase()
  )

  const isRoot = Boolean(
    address &&
    CONTRACT_ADDRESSES.ROOT_ID &&
    address.toLowerCase() === CONTRACT_ADDRESSES.ROOT_ID.toLowerCase()
  )
  // A wallet is confirmed owner ONLY when on-chain owner equals their address, AND they are NOT pending
  const isOwner = Boolean(
    !isPendingOwner &&
    address &&
    (
      (onChainOwnerData && address.toLowerCase() === onChainOwnerData.toLowerCase()) ||
      (!onChainOwnerData && CONTRACT_ADDRESSES.OWNER_ADDRESS && address.toLowerCase() === CONTRACT_ADDRESSES.OWNER_ADDRESS.toLowerCase())
    )
  )

  // User does NOT get admin access until they accept ownership!
  const isAdmin = Boolean(isOwner && !isPendingOwner)
  const isUserRegistered = Boolean(rawProfile?.isRegistered || directUserData?.isRegistered || isRoot)

  // Calculate total income sum from breakdown if totalIncomeEarned is 0 (fallback)
  const computedTotalIncome = rawIncome
    ? (
        BigInt(rawIncome.directIncome || 0n) +
        BigInt(rawIncome.affiliateIncome || 0n) +
        BigInt(rawIncome.clubIncome || 0n) +
        BigInt(rawIncome.matchingIncome || 0n) +
        BigInt(rawIncome.championIncome || 0n) +
        BigInt(rawIncome.weeklyIncome || 0n) +
        BigInt(rawIncome.lifetimeIncome || 0n) +
        BigInt(rawIncome.globalClubIncome || 0n)
      )
    : 0n

  const effectiveTotalIncomeEarned = (rawProfile?.totalIncomeEarned && BigInt(rawProfile.totalIncomeEarned) > 0n)
    ? rawProfile.totalIncomeEarned
    : computedTotalIncome

  const effectiveDirectCount = (rawProfile?.directCount && Number(rawProfile.directCount) > 0)
    ? Number(rawProfile.directCount)
    : directRefs.length

  const profile = rawProfile
    ? {
        userAddress: rawProfile.userAddress || address,
        sponsor: rawProfile.sponsor,
        parent: rawProfile.parent,
        leftChild: rawProfile.leftChild,
        rightChild: rawProfile.rightChild,
        position: Number(rawProfile.position || 0), // 1 = Left, 2 = Right
        isRegistered: isUserRegistered,
        active: isUserRegistered,
        currentRank: Number(rawProfile.currentRank || 1),
        rankName: RANK_NAMES[Number(rawProfile.currentRank || 1)] || 'Starter',
        directCount: effectiveDirectCount,
        leftDirectCount: Number(rawProfile.leftDirectCount || 0n),
        rightDirectCount: Number(rawProfile.rightDirectCount || 0n),
        leftTeamCount: Number(rawProfile.leftTeamCount || 0n),
        rightTeamCount: Number(rawProfile.rightTeamCount || 0n),
        leftCarryVolume: Number(rawProfile.leftCarryVolume || 0n),
        rightCarryVolume: Number(rawProfile.rightCarryVolume || 0n),
        hasMatchedFirstPair: Boolean(rawProfile.hasMatchedFirstPair),
        totalIncomeEarned: formatUnits(effectiveTotalIncomeEarned, 6),
        withdrawableBalance: formatUnits(rawProfile.withdrawableBalance || 0n, 6),
        totalWithdrawn: formatUnits(rawProfile.totalWithdrawn || 0n, 6),
        completedLifetimeMilestones: Number(rawProfile.completedLifetimeMilestones || 0n),
        // Compatibility fields
        packageId: 1,
        packagePrice: '50.00',
        totalEarned: formatUnits(effectiveTotalIncomeEarned, 6),
      }
    : {
        isRegistered: isRoot,
        active: isRoot,
        currentRank: 1,
        rankName: 'Starter',
        directCount: directRefs.length,
        leftTeamCount: 0,
        rightTeamCount: 0,
        totalIncomeEarned: formatUnits(computedTotalIncome, 6),
        withdrawableBalance: '0.00',
        totalWithdrawn: '0.00',
        totalEarned: formatUnits(computedTotalIncome, 6),
      }

  const incomeBreakdown = rawIncome
    ? {
        directIncome: formatUnits(rawIncome.directIncome || 0n, 6),
        affiliateIncome: formatUnits(rawIncome.affiliateIncome || 0n, 6),
        clubIncome: formatUnits(rawIncome.clubIncome || 0n, 6),
        matchingIncome: formatUnits(rawIncome.matchingIncome || 0n, 6),
        championIncome: formatUnits(rawIncome.championIncome || 0n, 6),
        weeklyIncome: formatUnits(rawIncome.weeklyIncome || 0n, 6),
        lifetimeIncome: formatUnits(rawIncome.lifetimeIncome || 0n, 6),
        globalClubIncome: formatUnits(rawIncome.globalClubIncome || 0n, 6),
      }
    : {
        directIncome: '0.00',
        affiliateIncome: '0.00',
        clubIncome: '0.00',
        matchingIncome: '0.00',
        championIncome: '0.00',
        weeklyIncome: '0.00',
        lifetimeIncome: '0.00',
        globalClubIncome: '0.00',
      }

  const champion = {
    isEligible: Boolean(dashData?.isChampionEligible),
    pendingReward: formatUnits(dashData?.pendingChampionReward || 0n, 6),
  }

  const weekly = {
    currentEpoch: Number(dashData?.currentWeeklyEpoch || 0n),
    currentDirects: Number(dashData?.currentWeeklyDirects || 0n),
    isEligible: Boolean(dashData?.isWeeklyEligibleCurrentEpoch),
  }

  const matching = {
    todayPairs: Number(dashData?.todayMatchingPairs || 0n),
  }

  const milestoneStatus = dashData?.milestoneStatus ? Array.from(dashData.milestoneStatus).map(Number) : []

  const globalClub = {
    entriesCount: Number(dashData?.globalClubEntriesCount || 0n),
    cyclesCompleted: Number(dashData?.globalClubCyclesCompleted || 0n),
  }

  const overview = overviewData
    ? {
        totalUsers: Number(overviewData.totalUsers || 0n),
        totalRegistrationVolume: formatUnits(overviewData.totalRegistrationVolume || 0n, 6),
        totalIncomeDistributed: formatUnits(overviewData.totalIncomeDistributed || 0n, 6),
        totalLiabilities: formatUnits(overviewData.totalLiabilities || 0n, 6),
        contractTokenBalance: formatUnits(overviewData.contractTokenBalance || 0n, 6),
        isSolvent: Boolean(overviewData.isSolvent),
        championPoolBalance: formatUnits(overviewData.championPoolBalance || 0n, 6),
        weeklyPoolBalance: formatUnits(overviewData.weeklyPoolBalance || 0n, 6),
        currentWeeklyEpoch: Number(overviewData.currentWeeklyEpoch || 0n),
        currentMonthEpoch: Number(overviewData.currentMonthEpoch || 0n),
        globalClubTotalEntries: Number(overviewData.globalClubTotalEntries || 0n),
        isPaused: Boolean(overviewData.isPaused),
      }
    : {
        totalUsers: 0,
        totalRegistrationVolume: '0.00',
        totalIncomeDistributed: '0.00',
        contractTokenBalance: '0.00',
        isSolvent: true,
      }

  const usdtBalance = usdtBalData ? formatUnits(usdtBalData, 6) : '0'
  const usdtAllowance = usdtAllowanceData ? formatUnits(usdtAllowanceData, 6) : '0'

  const refreshAll = useCallback(() => {
    refetchDash()
    refetchOverview()
    refetchUsdtBal()
    refetchUsdtAllowance()
    refetchOwner()
    refetchPendingOwner()
  }, [refetchDash, refetchOverview, refetchUsdtBal, refetchUsdtAllowance, refetchOwner, refetchPendingOwner])

  // --- Actions ---

  const approveUSDT = async (amount = '50') => {
    setLoading(true)
    setError(null)
    try {
      const parsedAmount = parseUnits(amount.toString(), 6)
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.USDT,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.GATEWAY, parsedAmount],
        chain: activeChain,
      })

      // Explicitly wait for blockchain confirmation
      if (publicClient && txHash) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      // Force immediate refetch
      await Promise.all([
        refetchUsdtAllowance(),
        refetchUsdtBal(),
      ])

      setLoading(false)
      return txHash
    } catch (err) {
      console.error('Approve failed:', err)
      setError(err.message || 'Approval failed')
      setLoading(false)
      throw err
    }
  }

  const register = async (sponsor, parent, position = 1) => {
    setLoading(true)
    setError(null)
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.GATEWAY,
        abi: ELZORA_GATEWAY_ABI,
        functionName: 'register',
        args: [sponsor, parent, Number(position)],
        chain: activeChain,
      })

      if (publicClient && txHash) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      await refreshAll()
      setLoading(false)
      return txHash
    } catch (err) {
      console.error('Registration failed:', err)
      setError(err.message || 'Registration failed')
      setLoading(false)
      throw err
    }
  }

  const joinGlobalClub = async () => {
    setLoading(true)
    setError(null)
    try {
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.GATEWAY,
        abi: ELZORA_GATEWAY_ABI,
        functionName: 'joinGlobalClub',
        chain: activeChain,
      })
      if (publicClient && txHash) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }
      await refreshAll()
      setLoading(false)
      return txHash
    } catch (err) {
      console.error('Join Global Club failed:', err)
      setError(err.message || 'Join Global Club failed')
      setLoading(false)
      throw err
    }
  }

  const withdrawIncome = async () => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.GATEWAY,
        abi: ELZORA_GATEWAY_ABI,
        functionName: 'withdrawIncome',
        chain: activeChain,
      })
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Withdraw income failed:', err)
      setError(err.message || 'Withdrawal failed')
      setLoading(false)
      throw err
    }
  }

  const claimChampionReward = async () => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.GATEWAY,
        abi: ELZORA_GATEWAY_ABI,
        functionName: 'claimChampionReward',
        chain: activeChain,
      })
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Claim champion reward failed:', err)
      setError(err.message || 'Claim champion reward failed')
      setLoading(false)
      throw err
    }
  }

  const claimWeeklyReward = async (epoch) => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.GATEWAY,
        abi: ELZORA_GATEWAY_ABI,
        functionName: 'claimWeeklyReward',
        args: [BigInt(epoch)],
        chain: activeChain,
      })
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Claim weekly reward failed:', err)
      setError(err.message || 'Claim weekly reward failed')
      setLoading(false)
      throw err
    }
  }

  const checkAndAwardLifetimeMilestones = async (userAddr = address) => {
    if (!userAddr) return
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'checkAndAwardLifetimeMilestones',
        args: [userAddr],
        chain: activeChain,
      })
      if (publicClient && tx) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Check & award milestone failed:', err)
      setError(err.message || 'Check & award milestone failed')
      setLoading(false)
      throw err
    }
  }

  const claimLifetimeMilestone = async () => {
    return checkAndAwardLifetimeMilestones(address)
  }

  const pauseContract = async () => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'pause',
        chain: activeChain,
      })
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Pause failed:', err)
      setError(err.message || 'Pause failed')
      setLoading(false)
      throw err
    }
  }

  const unpauseContract = async () => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'unpause',
        chain: activeChain,
      })
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Unpause failed:', err)
      setError(err.message || 'Unpause failed')
      setLoading(false)
      throw err
    }
  }

  const setGatewayContract = async (gatewayAddress) => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'setGatewayContract',
        args: [gatewayAddress],
        chain: activeChain,
      })
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Set gateway failed:', err)
      setError(err.message || 'Set gateway failed')
      setLoading(false)
      throw err
    }
  }

  const setTreasuryWallet = async (treasuryAddress) => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'setTreasuryWallet',
        args: [treasuryAddress],
        chain: activeChain,
      })
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Set treasury failed:', err)
      setError(err.message || 'Set treasury failed')
      setLoading(false)
      throw err
    }
  }

  const emergencyTokenRescue = async (tokenAddress, recipient, amount) => {
    setLoading(true)
    setError(null)
    try {
      const parsedAmount = parseUnits(amount.toString(), 6)
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'emergencyTokenRescue',
        args: [tokenAddress, recipient, parsedAmount],
        chain: activeChain,
      })
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Emergency rescue failed:', err)
      setError(err.message || 'Emergency rescue failed')
      setLoading(false)
      throw err
    }
  }

  const transferOwnership = async (newOwner) => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'transferOwnership',
        args: [newOwner],
        chain: activeChain,
      })
      if (publicClient && tx) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }
      await refreshAll()
      await refetchPendingOwner?.()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Transfer ownership failed:', err)
      setError(err.message || 'Transfer ownership failed')
      setLoading(false)
      throw err
    }
  }

  const cancelOwnershipTransfer = async () => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'cancelOwnershipTransfer',
        chain: activeChain,
      })
      if (publicClient && tx) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }
      await refreshAll()
      await refetchPendingOwner?.()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Cancel ownership transfer failed:', err)
      setError(err.message || 'Cancel ownership transfer failed')
      setLoading(false)
      throw err
    }
  }

  const acceptOwnership = async () => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'acceptOwnership',
        chain: activeChain,
      })
      if (publicClient && tx) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }
      await refreshAll()
      await Promise.all([refetchOwner?.(), refetchPendingOwner?.()])
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Accept ownership failed:', err)
      setError(err.message || 'Accept ownership failed')
      setLoading(false)
      throw err
    }
  }

  // --- Champion & Weekly Pool Admin Distribution Functions ---
  const createChampionMonthlySnapshot = async (monthEpoch) => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'createChampionMonthlySnapshot',
        args: [BigInt(monthEpoch)],
        chain: activeChain,
      })
      if (publicClient && tx) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Create Champion snapshot failed:', err)
      setError(err.message || 'Create Champion snapshot failed')
      setLoading(false)
      throw err
    }
  }

  const distributeChampionBatch = async (monthEpoch, batchSize = 50) => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'distributeChampionBatch',
        args: [BigInt(monthEpoch), BigInt(batchSize)],
        chain: activeChain,
      })
      if (publicClient && tx) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Distribute Champion batch failed:', err)
      setError(err.message || 'Distribute Champion batch failed')
      setLoading(false)
      throw err
    }
  }

  const createWeeklyPoolSnapshot = async (epoch) => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'createWeeklyPoolSnapshot',
        args: [BigInt(epoch)],
        chain: activeChain,
      })
      if (publicClient && tx) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Create Weekly snapshot failed:', err)
      setError(err.message || 'Create Weekly snapshot failed')
      setLoading(false)
      throw err
    }
  }

  const distributeWeeklyBatch = async (epoch, batchSize = 50) => {
    setLoading(true)
    setError(null)
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.TETHER_STREAM,
        abi: ELZORA_MAIN_ABI,
        functionName: 'distributeWeeklyBatch',
        args: [BigInt(epoch), BigInt(batchSize)],
        chain: activeChain,
      })
      if (publicClient && tx) {
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }
      await refreshAll()
      setLoading(false)
      return tx
    } catch (err) {
      console.error('Distribute Weekly batch failed:', err)
      setError(err.message || 'Distribute Weekly batch failed')
      setLoading(false)
      throw err
    }
  }

  return {
    address,
    isConnected,
    CONTRACT_ADDRESSES,
    profile,
    incomeBreakdown,
    directReferrals: directRefs,
    champion,
    weekly,
    matching,
    milestoneStatus,
    globalClub,
    overview,
    contractPaused: Boolean(overview?.isPaused),
    usdtBalance,
    usdtAllowance,
    loading,
    error,
    isProfileFetched: isDashFetched,
    isProfileLoading: isDashLoading,
    refreshAll,
    refetchAll: refreshAll,
    isOwnerLoading,
    isOwnerFetched,
    isPendingOwnerLoading,
    isPendingOwnerFetched,
    approveUSDT,
    register,
    joinGlobalClub,
    withdrawIncome,
    claimChampionReward,
    claimWeeklyReward,
    claimLifetimeMilestone,
    checkAndAwardLifetimeMilestones,
    // Admin Controls
    pauseContract,
    unpauseContract,
    setGatewayContract,
    setTreasuryWallet,
    emergencyTokenRescue,
    contractOwnerAddress,
    pendingOwnerAddress,
    isPendingOwner,
    transferOwnership,
    cancelOwnershipTransfer,
    acceptOwnership,
    createChampionMonthlySnapshot,
    distributeChampionBatch,
    createWeeklyPoolSnapshot,
    distributeWeeklyBatch,
    // Shorthands & Registration Flags
    isRegistered: isUserRegistered,
    active: isUserRegistered,
    memberInfo: profile,
    isMemberInfoFetched: Boolean(isDashFetched || isDirectUserFetched),
    isAdmin,
    isOwner,
    isRoot,
  }
}

export const useTetherStream = useElzora
export const useAventraContracts = useElzora
