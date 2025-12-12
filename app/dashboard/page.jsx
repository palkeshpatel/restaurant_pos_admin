import dynamicImport from 'next/dynamic'

// Dynamically import Dashboard to reduce initial bundle size
const Dashboard = dynamicImport(() => import('../../src/pages/Dashboard'), {
  ssr: false,
  loading: () => <div>Loading...</div>
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DashboardPage() {
  return <Dashboard />
}

