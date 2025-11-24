'use client'

import dynamic from 'next/dynamic'

const AdminModifierGroups = dynamic(() => import('../../../src/pages/Admin/ModifierGroups'), {
  ssr: false,
})

export default function ModifierGroupsPage() {
  return <AdminModifierGroups />
}

