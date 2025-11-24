'use client'

import dynamic from 'next/dynamic'

// Dynamically import Dashboard to reduce initial bundle size
const Dashboard = dynamic(() => import('../../src/pages/Dashboard'), {
  ssr: false,
  loading: () => <div>Loading...</div>
})

export default function DashboardPage() {
  return <Dashboard />
}

