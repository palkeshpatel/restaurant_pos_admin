'use client'

import dynamic from 'next/dynamic'

const SuperAdminBusinesses = dynamic(() => import('../../../src/pages/SuperAdmin/Businesses'), {
  ssr: false,
})

export default function BusinessesPage() {
  return <SuperAdminBusinesses />
}

