import React from 'react'
import { MemberLayout } from '../components/MemberLayout'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { AffiliateMatrixGenealogy } from '../components/AffiliateMatrixGenealogy'

export function AffiliateMatrixPage() {
  const { address } = useWalletAuth()

  return (
    <MemberLayout pageTitle="Affiliate Income Matrix">
      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <AffiliateMatrixGenealogy
          isAdmin={false}
          userAddress={address}
          embedded={false}
        />
      </div>
    </MemberLayout>
  )
}
