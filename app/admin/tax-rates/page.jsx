'use client'

import dynamic from 'next/dynamic'

const AdminTaxRates = dynamic(() => import('../../../src/pages/Admin/TaxRates'), {
  ssr: false,
})

export default function TaxRatesPage() {
  return <AdminTaxRates />
}

