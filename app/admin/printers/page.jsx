'use client'

import dynamic from 'next/dynamic'

const AdminPrinters = dynamic(() => import('../../../src/pages/Admin/Printers'), {
  ssr: false,
})

export default function PrintersPage() {
  return <AdminPrinters />
}

