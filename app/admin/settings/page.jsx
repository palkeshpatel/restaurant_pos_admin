'use client'

import dynamic from 'next/dynamic'

const AdminSettings = dynamic(() => import('../../../src/pages/Admin/Settings'), {
  ssr: false,
})

export default function SettingsPage() {
  return <AdminSettings />
}

