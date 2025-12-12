import dynamicImport from 'next/dynamic'

const Login = dynamicImport(() => import('../../src/pages/Login'), {
  ssr: false,
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function LoginPage() {
  return <Login />
}

