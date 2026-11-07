import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  trustWallet,
  tokenPocketWallet,
  safepalWallet,
  metaMaskWallet,
  binanceWallet,
  walletConnectWallet,
  okxWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'
import { bscTestnet, bsc } from 'wagmi/chains'

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  'f796d115e5cf859b4334a179576c6665'

const testnetRpc =
  import.meta.env.VITE_BSC_TESTNET_RPC ||
  'https://bsc-testnet-dataseed.bnbchain.org'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Supported Web3 Wallets',
      wallets: [
        trustWallet,
        tokenPocketWallet,
        safepalWallet,
        metaMaskWallet,
        binanceWallet,
        walletConnectWallet,
        okxWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'AventraX Coin Ecosystem',
    projectId,
  }
)

export const config = createConfig({
  connectors,
  chains: [bsc, bscTestnet],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org/'),
    [bscTestnet.id]: http(testnetRpc),
  },
  ssr: false,
})

