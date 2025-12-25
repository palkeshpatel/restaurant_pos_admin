'use client'

import dynamic from 'next/dynamic'

const AdminTables = dynamic(() => import('../../../src/pages/Admin/Tables'), {
  ssr: false,
})

export default function TablesPage() {
  return <AdminTables />
}

