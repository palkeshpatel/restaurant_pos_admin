'use client'

import dynamic from 'next/dynamic'

const SuperAdminUsers = dynamic(() => import('../../../src/pages/SuperAdmin/Users'), {
  ssr: false,
})

export default function UsersPage() {
  return <SuperAdminUsers />
}

