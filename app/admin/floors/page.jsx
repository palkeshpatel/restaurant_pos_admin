'use client'

import dynamic from 'next/dynamic'

const AdminFloors = dynamic(() => import('../../../src/pages/Admin/Floors'), {
  ssr: false,
})

export default function FloorsPage() {
  return <AdminFloors />
}

