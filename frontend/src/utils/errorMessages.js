/**
 * Converts raw blockchain, viem, wagmi, RPC, and wallet errors into
 * short, user-friendly messages so technical stack traces are never shown.
 */
export function formatErrorMessage(err, fallback = 'Action failed. Please try again.') {
  if (!err) return fallback

  const raw = [
    err?.shortMessage,
    err?.reason,
    err?.data?.errorName,
    err?.cause?.shortMessage,
    err?.cause?.reason,
    err?.message,
    typeof err === 'string' ? err : '',
  ]
    .filter(Boolean)
    .join(' | ')

  const lower = raw.toLowerCase()

  // Wallet / user action
  if (
    lower.includes('user rejected') ||
    lower.includes('user denied') ||
    lower.includes('rejected the request') ||
    lower.includes('action_rejected') ||
    lower.includes('cancelled by user')
  ) {
    return 'Transaction cancelled by user.'
  }

  // Gas & balance
  if (
    lower.includes('insufficient funds for gas') ||
    lower.includes('insufficient funds for intrinsic') ||
    lower.includes('overshot')
  ) {
    return 'Insufficient BNB for gas fee.'
  }

  if (
    lower.includes('transaction gas limit too high') ||
    lower.includes('exceeds block gas limit')
  ) {
    return 'Unable to process transaction. Please verify your details and try again.'
  }

  // Wallet connection & network
  if (
    lower.includes('connectornotconnected') ||
    lower.includes('provider not found') ||
    lower.includes('wallet not connected')
  ) {
    return 'Please connect your wallet first.'
  }

  if (
    lower.includes('chainmismatch') ||
    lower.includes('chain mismatch') ||
    lower.includes('unsupported chain') ||
    lower.includes('wrong network')
  ) {
    return 'Please switch your wallet to BNB Smart Chain Testnet.'
  }

  if (
    lower.includes('nonce too low') ||
    lower.includes('replacement transaction underpriced') ||
    lower.includes('already known')
  ) {
    return 'Previous transaction is still pending. Please wait a moment.'
  }

  if (
    lower.includes('timeout') ||
    lower.includes('etimedout') ||
    lower.includes('fetch failed') ||
    lower.includes('http request failed') ||
    lower.includes('rate limit') ||
    lower.includes('429')
  ) {
    return 'Network is busy. Please try again in a moment.'
  }

  // ELZORA Smart Contract Custom Errors
  if (raw.includes('0x3a81d6fc') || raw.includes('AlreadyRegistered')) {
    return 'This wallet is already registered.'
  }
  if (raw.includes('NotRegistered')) {
    return 'Wallet is not registered yet.'
  }
  if (raw.includes('CannotSponsorSelf')) {
    return 'You cannot use your own wallet as sponsor.'
  }
  if (raw.includes('SponsorNotActive') || raw.includes('SponsorNotRegistered')) {
    return 'Sponsor wallet is not registered.'
  }
  if (raw.includes('ParentNotActive') || raw.includes('ParentNotRegistered')) {
    return 'Binary parent wallet is not registered.'
  }
  if (raw.includes('PositionAlreadyOccupied') || raw.includes('PositionOccupied')) {
    return 'Selected binary position is already occupied.'
  }
  if (raw.includes('InvalidPosition')) {
    return 'Invalid binary position selected.'
  }
  if (raw.includes('CircularReferralDetected')) {
    return 'Circular referral is not allowed.'
  }
  if (raw.includes('InsufficientAllowance') || raw.includes('ERC20InsufficientAllowance')) {
    return 'Please approve USDT spending limit first.'
  }
  if (raw.includes('InsufficientBalance') || raw.includes('ERC20InsufficientBalance')) {
    return 'Insufficient USDT balance in your wallet.'
  }
  if (raw.includes('TransferFailed')) {
    return 'USDT transfer failed. Please check your balance.'
  }
  if (raw.includes('ContractInsolvent')) {
    return 'Contract pool balance is insufficient.'
  }
  if (raw.includes('NothingToWithdraw')) {
    return 'No funds available for this action yet.'
  }
  if (raw.includes('FirstPairNotQualified')) {
    return 'First binary pair is not qualified yet.'
  }
  if (raw.includes('NoPairsToMatch')) {
    return 'No binary pairs available to match.'
  }
  if (raw.includes('DailyMatchingCapExceeded')) {
    return 'Daily matching income cap reached.'
  }
  if (raw.includes('NotEligibleForChampion')) {
    return 'Not eligible for Champion Pool reward.'
  }
  if (raw.includes('ChampionRewardAlreadyClaimed')) {
    return 'Champion reward already claimed.'
  }
  if (raw.includes('NotEligibleForWeekly')) {
    return 'Not eligible for Weekly Pool reward.'
  }
  if (raw.includes('WeeklyRewardAlreadyClaimed')) {
    return 'Weekly reward already claimed.'
  }
  if (raw.includes('LifetimeMilestoneNotReached')) {
    return 'Lifetime milestone target not reached yet.'
  }
  if (raw.includes('LifetimeMilestoneAlreadyClaimed')) {
    return 'Lifetime milestone already claimed.'
  }
  if (raw.includes('LifetimeMilestoneDirectsNotMet')) {
    return 'Required direct referrals not met yet.'
  }
  if (raw.includes('InvalidMilestoneIndex')) {
    return 'Invalid milestone selected.'
  }
  if (raw.includes('InvalidGlobalClubAmount')) {
    return 'Invalid Global Club amount ($25 required).'
  }
  if (
    raw.includes('0x118cdaa7') ||
    raw.includes('OwnableUnauthorizedAccount') ||
    raw.includes('Unauthorized')
  ) {
    return 'Your wallet is not authorized for this action.'
  }
  if (raw.includes('InvalidParameters')) {
    return 'Invalid parameters provided.'
  }
  if (raw.includes('BatchSizeExceeded')) {
    return 'Batch size is too large. Please reduce it.'
  }
  if (raw.includes('MonthAlreadyDistributed')) {
    return 'This month snapshot or distribution is already done.'
  }
  if (raw.includes('NoChampionMembers')) {
    return 'No Champion qualifiers found for this month.'
  }
  if (raw.includes('MonthNotClosed')) {
    return 'Month has not ended yet. Wait until the month closes.'
  }
  if (raw.includes('WeekNotClosed')) {
    return 'Week has not ended yet. Wait until the week closes.'
  }
  if (raw.includes('WeekAlreadyDistributed')) {
    return 'This week snapshot or distribution is already done.'
  }
  if (raw.includes('EnforcedPause') || lower.includes('pausable: paused')) {
    return 'Protocol is currently paused.'
  }
  if (raw.includes('ExpectedPause')) {
    return 'Protocol is already active.'
  }
  if (raw.includes('ZeroAddress')) {
    return 'Invalid wallet address provided.'
  }

  // Generic contract revert fallback (never expose raw viem stack/calldata)
  if (lower.includes('execution reverted') || lower.includes('reverted')) {
    return fallback
  }

  // If it's already a short custom message (no viem/RPC boilerplate), keep it
  const isCleanShortMessage =
    raw.length > 0 &&
    raw.length <= 120 &&
    !lower.includes('contract call:') &&
    !lower.includes('request arguments:') &&
    !lower.includes('docs:') &&
    !lower.includes('version:') &&
    !lower.includes('viem@') &&
    !lower.includes('0x')

  if (isCleanShortMessage) {
    return raw
  }

  return fallback
}

