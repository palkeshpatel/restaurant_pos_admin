'use client'

import dynamic from 'next/dynamic'

const AdminDecisionGroups = dynamic(() => import('../../../src/pages/Admin/DecisionGroups'), {
  ssr: false,
})

export default function DecisionGroupsPage() {
  return <AdminDecisionGroups />
}

