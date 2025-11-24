'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../src/contexts/AuthContext'
import Layout from '../../src/components/Layout'

export default function SuperAdminLayout({ children }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }
      
      // Check if user is super admin
      const isSuperAdmin = 
        user?.is_super_admin === true || 
        user?.is_super_admin === 1 || 
        user?.is_super_admin === '1' ||
        user?.is_super_admin === 'true'
      
      if (!isSuperAdmin) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const isSuperAdmin = 
    user?.is_super_admin === true || 
    user?.is_super_admin === 1 || 
    user?.is_super_admin === '1' ||
    user?.is_super_admin === 'true'

  if (!isSuperAdmin) {
    return null
  }

  return (
    <Layout>
      {children}
    </Layout>
  )
}

