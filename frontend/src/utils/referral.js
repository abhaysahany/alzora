import { createPublicClient, http, isAddress } from 'viem'
import { bsc } from 'viem/chains'
import { CONTRACT_ADDRESSES, AVENTRA_XMLM_ABI } from '../web3/contracts'

export const REFERRAL_STORAGE_KEY = 'aventrax_referral_sponsor'
export const DEFAULT_ROOT_ADDRESS = import.meta.env.VITE_ROOT_ID || CONTRACT_ADDRESSES.ROOT_ID || '0xFC4163220762D645a5e256704532494Ed3d3282F'
export const DEFAULT_ROOT_ID = 1

/**
 * Extract referral parameter from query string or URL
 */
export function extractReferralParam(searchStr = null) {
  if (typeof window === 'undefined') return ''
  const search = searchStr !== null ? searchStr : window.location.search
  if (!search) return ''
  const params = new URLSearchParams(search)
  return params.get('ref') || params.get('sponsor') || params.get('referral') || ''
}

/**
 * Save referral sponsor into session and local storage
 */
export function saveReferral(refValue) {
  if (typeof window === 'undefined' || !refValue || typeof refValue !== 'string') return
  const clean = refValue.trim().replace(/^AVX-?|^UID-?|^#/i, '')
  if (!clean) return
  try {
    sessionStorage.setItem(REFERRAL_STORAGE_KEY, clean)
    localStorage.setItem(REFERRAL_STORAGE_KEY, clean)
  } catch (e) {}
}

/**
 * Get stored referral sponsor from URL, session or local storage
 */
export function getStoredReferral() {
  if (typeof window === 'undefined') return ''
  const fromUrl = extractReferralParam()
  if (fromUrl) {
    saveReferral(fromUrl)
    return fromUrl.trim().replace(/^AVX-?|^UID-?|^#/i, '')
  }
  try {
    return (
      sessionStorage.getItem(REFERRAL_STORAGE_KEY) ||
      localStorage.getItem(REFERRAL_STORAGE_KEY) ||
      ''
    )
  } catch (e) {
    return ''
  }
}

/**
 * Clear stored referral
 */
export function clearStoredReferral() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY)
    localStorage.removeItem(REFERRAL_STORAGE_KEY)
  } catch (e) {}
}

/**
 * Resolve sponsor input (numeric User ID or 0x address) on-chain
 */
export async function resolveSponsorOnChain(sponsorInput) {
  if (!sponsorInput || !sponsorInput.toString().trim()) {
    return {
      isValid: false,
      address: null,
      userId: null,
      isRegistered: false,
      isRoot: false,
      error: 'Please enter a Sponsor User ID or Wallet Address',
    }
  }

  const cleanInput = sponsorInput.toString().trim().replace(/^AVX-?|^UID-?|^#/i, '')

  try {
    const publicClient = createPublicClient({
      chain: bsc,
      transport: http(),
    })

    let resolvedAddress = null
    let resolvedUserId = null

    if (isAddress(cleanInput)) {
      resolvedAddress = cleanInput
      // Query User ID by Address
      try {
        const uidRaw = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.XMLM,
          abi: AVENTRA_XMLM_ABI,
          functionName: 'addressToId',
          args: [resolvedAddress],
        })
        if (uidRaw && Number(uidRaw) > 0) {
          resolvedUserId = Number(uidRaw)
        }
      } catch (e) {}

      if (!resolvedUserId && resolvedAddress.toLowerCase() === DEFAULT_ROOT_ADDRESS.toLowerCase()) {
        resolvedUserId = DEFAULT_ROOT_ID
      }
    } else {
      // Numeric User ID
      const numId = parseInt(cleanInput, 10)
      if (isNaN(numId) || numId <= 0) {
        return {
          isValid: false,
          address: null,
          userId: null,
          isRegistered: false,
          isRoot: false,
          error: `Invalid Sponsor ID format: "${sponsorInput}".`,
        }
      }

      resolvedUserId = numId

      if (numId === DEFAULT_ROOT_ID) {
        resolvedAddress = DEFAULT_ROOT_ADDRESS
      } else {
        try {
          const addrRaw = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.XMLM,
            abi: AVENTRA_XMLM_ABI,
            functionName: 'idToAddress',
            args: [BigInt(numId)],
          })
          if (addrRaw && addrRaw !== '0x0000000000000000000000000000000000000000') {
            resolvedAddress = addrRaw
          }
        } catch (e) {
          console.warn('Failed to resolve idToAddress:', e)
        }
      }
    }

    if (!resolvedAddress) {
      return {
        isValid: false,
        address: null,
        userId: resolvedUserId,
        isRegistered: false,
        isRoot: false,
        error: `User ID #${resolvedUserId} is not registered on-chain.`,
      }
    }

    const isRoot = resolvedAddress.toLowerCase() === DEFAULT_ROOT_ADDRESS.toLowerCase() || resolvedUserId === DEFAULT_ROOT_ID

    // Check if registered & active
    let isRegistered = isRoot
    let isActive = isRoot
    if (!isRoot) {
      try {
        const memberRaw = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.XMLM,
          abi: AVENTRA_XMLM_ABI,
          functionName: 'getMember',
          args: [resolvedAddress],
        })
        if (memberRaw) {
          const regTime = Number(memberRaw.registrationTime ?? memberRaw[5] ?? 0n)
          const active = Boolean(memberRaw.active ?? memberRaw[1] ?? false)
          const pkgId = Number(memberRaw.packageId ?? memberRaw[2] ?? 0n)
          if (regTime > 0) {
            isRegistered = true
          }
          if (active || pkgId > 0) {
            isActive = true
          }
        }
      } catch (e) {}
    }

    if (!isRegistered) {
      return {
        isValid: false,
        address: resolvedAddress,
        userId: resolvedUserId,
        isRegistered: false,
        isActive: false,
        isRoot,
        error: `User ID #${resolvedUserId} is not registered on-chain.`,
      }
    }

    if (!isActive) {
      return {
        isValid: false,
        address: resolvedAddress,
        userId: resolvedUserId,
        isRegistered: true,
        isActive: false,
        isRoot,
        error: 'Sponsor is not active',
      }
    }

    return {
      isValid: true,
      address: resolvedAddress,
      userId: resolvedUserId,
      isRegistered: true,
      isActive: true,
      isRoot,
      error: null,
    }
  } catch (err) {
    return {
      isValid: false,
      address: null,
      userId: null,
      isRegistered: false,
      isRoot: false,
      error: err.shortMessage || err.message || 'Failed to verify sponsor on blockchain.',
    }
  }
}
