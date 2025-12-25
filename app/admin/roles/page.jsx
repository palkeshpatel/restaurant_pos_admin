'use client'

import dynamic from 'next/dynamic'

const AdminRoles = dynamic(() => import('../../../src/pages/Admin/Roles'), {
  ssr: false,
})

export default function RolesPage() {
  return <AdminRoles />
}

