'use client'

import dynamic from 'next/dynamic'

const AdminDecisions = dynamic(() => import('../../../src/pages/Admin/Decisions'), {
  ssr: false,
})

export default function DecisionsPage() {
  return <AdminDecisions />
}

