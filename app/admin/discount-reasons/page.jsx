'use client'

import dynamic from 'next/dynamic'

const AdminDiscountReasons = dynamic(() => import('../../../src/pages/Admin/DiscountReasons'), {
  ssr: false,
})

export default function DiscountReasonsPage() {
  return <AdminDiscountReasons />
}

