import { useAventraContracts } from './useAventraContracts'
import { DEFAULT_ROOT_ID, DEFAULT_ROOT_ADDRESS } from '../utils/referral'

export function useReferralData(userAddress) {
  const { memberInfo } = useAventraContracts()

  const userId = memberInfo.userId || (userAddress?.toLowerCase() === DEFAULT_ROOT_ADDRESS.toLowerCase() ? 1 : null)
  const refParam = userId ? userId.toString() : (userAddress || DEFAULT_ROOT_ID.toString())
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${refParam}`

  return {
    referralLink,
    userId,
    directReferrals: memberInfo.directCount,
    sponsor: memberInfo.sponsor,
  }
}
