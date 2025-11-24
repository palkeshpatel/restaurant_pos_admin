'use client'

import dynamic from 'next/dynamic'

const AdminMenuCategories = dynamic(() => import('../../../src/pages/Admin/MenuCategories'), {
  ssr: false,
})

export default function MenuCategoriesPage() {
  return <AdminMenuCategories />
}

