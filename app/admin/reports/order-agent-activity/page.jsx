'use client'

import dynamic from 'next/dynamic'

const AdminOrderAgentActivityReport = dynamic(() => import('../../../../src/pages/Admin/OrderAgentActivityReport'), {
  ssr: false,
})

export default function OrderAgentActivityReportPage() {
  return <AdminOrderAgentActivityReport />
}

