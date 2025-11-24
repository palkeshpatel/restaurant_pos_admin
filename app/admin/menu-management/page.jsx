'use client'

import dynamic from 'next/dynamic'

const MenuManagement = dynamic(() => import('../../../src/pages/Admin/MenuManagement'), {
  ssr: false,
})

export default function MenuManagementPage() {
  return <MenuManagement />
}

