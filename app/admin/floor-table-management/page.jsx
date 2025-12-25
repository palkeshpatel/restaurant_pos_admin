'use client'

import dynamic from 'next/dynamic'

const FloorTableManagement = dynamic(() => import('../../../src/pages/Admin/FloorTableManagement'), {
  ssr: false,
})

export default function FloorTableManagementPage() {
  return <FloorTableManagement />
}

