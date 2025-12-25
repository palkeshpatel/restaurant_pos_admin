'use client'

import dynamic from 'next/dynamic'

const AdminEmployees = dynamic(() => import('../../../src/pages/Admin/Employees'), {
  ssr: false,
})

export default function EmployeesPage() {
  return <AdminEmployees />
}

