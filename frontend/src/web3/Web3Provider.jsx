import React, { useEffect, useRef } from 'react'
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider, useConnect } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function MetaMaskClickListener() {
  const { connectAsync, connectors } = useConnect()
  const isRequestingRef = useRef(false)

  useEffect(() => {
    const handleClick = async (e) => {
      const dialog = document.querySelector('[role="dialog"], [aria-modal="true"]')
      if (!dialog || !dialog.contains(e.target)) return

      const clickedEl = e.target.closest('button, [role="button"], li')
      if (!clickedEl) return

      const text = (clickedEl.innerText || clickedEl.textContent || '').toLowerCase().trim()
      if (!text.includes('metamask')) return

      if (isRequestingRef.current) return
      isRequestingRef.current = true

      try {
        const injectedConnector =
          connectors.find(
            (c) =>
              c.id === 'metaMaskSDK' ||
              c.id === 'metaMask' ||
              c.id === 'injected' ||
              c.id === 'io.metamask' ||
              c.name.toLowerCase().includes('metamask')
          ) || connectors[0]

        if (injectedConnector) {
          const res = await connectAsync({ connector: injectedConnector })
          if (res?.accounts?.[0]) {
            window.dispatchEvent(
              new CustomEvent('aventrax_account_connected', { detail: res.accounts[0] })
            )
          }
        } else if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          if (accounts && accounts.length > 0) {
            window.dispatchEvent(
              new CustomEvent('aventrax_account_connected', { detail: accounts[0] })
            )
          }
        }
      } catch (err) {
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            if (accounts && accounts.length > 0) {
              window.dispatchEvent(
                new CustomEvent('aventrax_account_connected', { detail: accounts[0] })
              )
            }
          } catch (e) {}
        }
      } finally {
        setTimeout(() => {
          isRequestingRef.current = false
        }, 2000)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [connectors, connectAsync])

  return null
}

export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="wide"
          theme={darkTheme({
            accentColor: '#22e3d6',
            accentColorForeground: '#05070e',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          <MetaMaskClickListener />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
