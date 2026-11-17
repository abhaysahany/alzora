import React from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { useWalletAuth } from '../../hooks/useWalletAuth'
import { AffiliateMatrixGenealogy } from '../../components/AffiliateMatrixGenealogy'

export function AdminAffiliateMatrixPage() {
  const { address } = useWalletAuth()

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', padding: '10px 0' }}>
        <AffiliateMatrixGenealogy
          isAdmin={true}
          userAddress={address}
          embedded={false}
        />
      </div>
    </AdminLayout>
  )
}
