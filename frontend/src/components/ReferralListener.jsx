import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { extractReferralParam, saveReferral } from '../utils/referral'

export function ReferralListener() {
  const location = useLocation()

  useEffect(() => {
    const ref = extractReferralParam(location.search)
    if (ref) {
      saveReferral(ref)
    }
  }, [location])

  return null
}
