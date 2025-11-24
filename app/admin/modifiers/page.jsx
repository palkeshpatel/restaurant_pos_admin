'use client'

import dynamic from 'next/dynamic'

const AdminModifiers = dynamic(() => import('../../../src/pages/Admin/Modifiers'), {
  ssr: false,
})

export default function ModifiersPage() {
  return <AdminModifiers />
}

