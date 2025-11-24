'use client'

import dynamic from 'next/dynamic'

const AdminMenuItems = dynamic(() => import('../../../src/pages/Admin/MenuItems'), {
  ssr: false,
})

export default function MenuItemsPage() {
  return <AdminMenuItems />
}

