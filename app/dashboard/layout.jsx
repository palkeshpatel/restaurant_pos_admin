'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../src/contexts/AuthContext'
import dynamic from 'next/dynamic'

// Dynamically import Layout to reduce initial bundle size
const Layout = dynamic(() => import('../../src/components/Layout'), {
  ssr: false,
  loading: () => <div>Loading...</div>
})

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Memoize to prevent unnecessary re-renders
  const shouldRender = useMemo(() => !loading && user, [loading, user])

  if (!shouldRender) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      {children}
    </Layout>
  )
}

