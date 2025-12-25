'use client'

import dynamic from 'next/dynamic'

const AdminMenus = dynamic(() => import('../../../src/pages/Admin/Menus'), {
  ssr: false,
})

export default function MenusPage() {
  return <AdminMenus />
}

