import { useAccount, useDisconnect } from 'wagmi'
import { useEffect, useState, useCallback } from 'react'

let globalConnectedAddress = null
const LOGOUT_STORAGE_KEY = 'aventrax_user_logged_out'

export function closeWeb3Modal() {
  if (typeof document === 'undefined') return
  try {
    const escEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(escEvent)
    window.dispatchEvent(escEvent)
    const closeBtns = document.querySelectorAll('[aria-label="Close"], [data-rk] button[aria-label]')
    closeBtns.forEach((btn) => {
      try {
        btn.click()
      } catch (e) {}
    })
  } catch (err) {}
}

export function useWalletAuth() {
  const { address: wagmiAddress, isConnected: wagmiConnected, isConnecting, chain } = useAccount()
  const { disconnect } = useDisconnect()

  const [isLoggedOut, setIsLoggedOut] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(LOGOUT_STORAGE_KEY) === 'true'
    return false
  })

  const [localAddr, setLocalAddr] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(LOGOUT_STORAGE_KEY) === 'true') {
      return null
    }
    return globalConnectedAddress || null
  })

  // Synchronize state when wagmi connection changes
  useEffect(() => {
    if (isConnecting) return

    if (wagmiConnected && wagmiAddress) {
      globalConnectedAddress = wagmiAddress
      setLocalAddr(wagmiAddress)
      setIsLoggedOut(false)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOGOUT_STORAGE_KEY)
      }
    } else if (!wagmiConnected && !isConnecting) {
      globalConnectedAddress = null
      setLocalAddr(null)
    }
  }, [wagmiConnected, wagmiAddress, isConnecting])

  // Synchronize state across all hook instances via event bus
  useEffect(() => {
    const handleAuthChange = (e) => {
      const isOut =
        e.detail?.isLoggedOut !== undefined
          ? e.detail.isLoggedOut
          : (typeof window !== 'undefined' && localStorage.getItem(LOGOUT_STORAGE_KEY) === 'true')

      setIsLoggedOut(isOut)
      if (isOut) {
        setLocalAddr(null)
        globalConnectedAddress = null
      } else if (e.detail?.address) {
        setLocalAddr(e.detail.address)
        globalConnectedAddress = e.detail.address
      }
    }

    const handleConnected = (e) => {
      const acct = e.detail
      if (acct) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOGOUT_STORAGE_KEY)
        }
        setIsLoggedOut(false)
        globalConnectedAddress = acct
        setLocalAddr(acct)
        closeWeb3Modal()
      }
    }

    const handleDisconnected = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOGOUT_STORAGE_KEY, 'true')
      }
      setIsLoggedOut(true)
      globalConnectedAddress = null
      setLocalAddr(null)
    }

    window.addEventListener('aventrax_auth_state_changed', handleAuthChange)
    window.addEventListener('aventrax_account_connected', handleConnected)
    window.addEventListener('aventrax_account_disconnected', handleDisconnected)

    return () => {
      window.removeEventListener('aventrax_auth_state_changed', handleAuthChange)
      window.removeEventListener('aventrax_account_connected', handleConnected)
      window.removeEventListener('aventrax_account_disconnected', handleDisconnected)
    }
  }, [])

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOGOUT_STORAGE_KEY, 'true')
    }
    setIsLoggedOut(true)
    globalConnectedAddress = null
    setLocalAddr(null)

    try {
      disconnect()
    } catch (e) {
      console.warn('Disconnect error:', e)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aventrax_auth_state_changed', { detail: { isLoggedOut: true } }))
      window.dispatchEvent(new CustomEvent('aventrax_account_disconnected'))
    }
  }, [disconnect])

  const login = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOGOUT_STORAGE_KEY)
    }
    setIsLoggedOut(false)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aventrax_auth_state_changed', { detail: { isLoggedOut: false } }))
    }
  }, [])

  const isExplicitlyLoggedOut = isLoggedOut || (typeof window !== 'undefined' && localStorage.getItem(LOGOUT_STORAGE_KEY) === 'true')

  const effectiveAddress = (wagmiConnected && wagmiAddress)
    ? wagmiAddress
    : (!isExplicitlyLoggedOut ? (localAddr || globalConnectedAddress) : null)

  const isConnected = Boolean(effectiveAddress)

  return {
    address: effectiveAddress || null,
    isConnected,
    isConnecting,
    isDisconnected: !isConnected,
    chain,
    isAuthenticated: isConnected,
    logout,
    login,
  }
}
