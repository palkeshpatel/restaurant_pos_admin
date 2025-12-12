import dynamicImport from 'next/dynamic'

const SuperAdminBusinesses = dynamicImport(() => import('../../../src/pages/SuperAdmin/Businesses'), {
  ssr: false,
})

export const dynamic = 'force-dynamic'

export default function BusinessesPage() {
  return <SuperAdminBusinesses />
}

