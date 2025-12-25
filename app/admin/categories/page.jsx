'use client'

import dynamic from 'next/dynamic'

const AdminCategories = dynamic(() => import('../../../src/pages/Admin/Categories'), {
  ssr: false,
})

export default function CategoriesPage() {
  return <AdminCategories />
}

