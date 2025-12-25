'use client'

import dynamic from 'next/dynamic'

const AdminDailySummaryReport = dynamic(() => import('../../../../src/pages/Admin/DailySummaryReport'), {
  ssr: false,
})

export default function DailySummaryReportPage() {
  return <AdminDailySummaryReport />
}

