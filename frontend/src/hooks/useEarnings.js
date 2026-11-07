import { useAventraContracts } from './useAventraContracts'

export function useEarnings() {
  const { incomeStats, memberInfo, globalStats } = useAventraContracts()

  const avxPrice = globalStats?.avxPriceUsd || 1.0
  const nonWorkingUsd = incomeStats.nonWorkingEarnedUsd
  const workingUsd = incomeStats.workingEarnedUsd
  const totalEarnedUsd = incomeStats.totalEarnedUsd
  const totalCapUsd = incomeStats.totalCapUsd
  const remainingCapUsd = incomeStats.remainingCapUsd

  const nonWorkingAvx = nonWorkingUsd / avxPrice
  const workingAvx = workingUsd / avxPrice
  const totalEarnedAvx = totalEarnedUsd / avxPrice
  const remainingCapAvx = remainingCapUsd / avxPrice

  const hasDirects = incomeStats.hasDirects

  const capProgressPercent = totalCapUsd > 0
    ? Math.min(100, Math.round((totalEarnedUsd / totalCapUsd) * 100))
    : 0

  return {
    totalEarnedAvx: `${totalEarnedAvx.toFixed(2)} AVX`,
    totalEarnedUsd: `$${totalEarnedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    totalEarned: `${totalEarnedAvx.toFixed(2)} AVX (≈ $${totalEarnedUsd.toFixed(2)} USDT)`,
    nonWorkingEarned: `${nonWorkingAvx.toFixed(2)} AVX (≈ $${nonWorkingUsd.toFixed(2)} USDT - 2X Cap)`,
    workingEarned: hasDirects
      ? `${workingAvx.toFixed(2)} AVX (≈ $${workingUsd.toFixed(2)} USDT - 3X Cap)`
      : `0.00 AVX (Requires Direct Referrals)`,
    totalCap: `$${totalCapUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${hasDirects ? '5X Total Cap' : '2X Non-Working Cap'})`,
    remainingCap: `$${remainingCapUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} (≈ ${remainingCapAvx.toFixed(2)} AVX)`,
    capProgressPercent,
    cappedOut: incomeStats.cappedOut,
    rankId: memberInfo.rank,
    hasDirects,
    avxPrice,
  }
}
