'use client'

import dynamic from 'next/dynamic'

const AdminPermissions = dynamic(() => import('../../../src/pages/Admin/Permissions'), {
  ssr: false,
})

export default function PermissionsPage() {
  return <AdminPermissions />
}

