import { useState } from 'react'

/**
 * Hook for recent transaction and activity history.
 * Prepared for future smart contract event indexing.
 */
export function useTransactions() {
  const [transactions] = useState([
    {
      id: 'TX-90812',
      type: 'Daily Coin ROI',
      amount: '+186.50 AVX ($186.50)',
      status: 'Completed',
      date: '2026-08-25 14:30',
      reference: '0x8f...39a1',
    },
    {
      id: 'TX-90811',
      type: 'Direct Referral Bonus',
      amount: '+150.00 AVX ($150.00)',
      status: 'Completed',
      date: '2026-08-24 18:15',
      reference: '0x7c...21e4',
    },
    {
      id: 'TX-90810',
      type: 'Package Stake (Tier 3)',
      amount: '-5,000.00 AVX',
      status: 'Completed',
      date: '2026-08-20 09:45',
      reference: '0x4b...90d2',
    },
    {
      id: 'TX-90809',
      type: 'Level 2 Binary Bonus',
      amount: '+75.00 AVX ($75.00)',
      status: 'Completed',
      date: '2026-08-18 11:20',
      reference: '0x1a...88b7',
    },
    {
      id: 'TX-90808',
      type: 'Withdrawal to Wallet',
      amount: '-500.00 AVX',
      status: 'Pending',
      date: '2026-08-15 16:10',
      reference: '0x9d...77f1',
    },
  ])

  return transactions
}
