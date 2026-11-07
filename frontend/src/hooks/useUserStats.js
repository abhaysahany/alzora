import { useAventraContracts } from './useAventraContracts'

export function useUserStats() {
  const { memberInfo, balances } = useAventraContracts()

  const getPackageName = (id) => {
    if (id === 1) return 'Tier 1 Starter ($100 - 0.4%/day)'
    if (id === 2) return 'Tier 2 Executive ($1,000 - 0.6%/day)'
    if (id === 3) return 'Tier 3 Apex VIP ($5,000 - 0.8%/day)'
    return 'No Active Package'
  }

  const getRoiRate = (id) => {
    if (id === 1) return '0.4%'
    if (id === 2) return '0.6%'
    if (id === 3) return '0.8%'
    return '0.0%'
  }

  return {
    totalInvestment: `$${memberInfo.totalStakedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    availableBalance: `$${balances.usdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    avxBalance: `${balances.avx.toLocaleString('en-US', { minimumFractionDigits: 2 })} AVX`,
    activePackage: getPackageName(memberInfo.packageId),
    dailyRoiRate: getRoiRate(memberInfo.packageId),
    accountStatus: memberInfo.active ? 'Active' : 'Inactive',
    pendingRoiUsd: memberInfo.pendingRoiUsd,
    pendingRoiAvx: memberInfo.pendingRoiAvx,
  }
}
