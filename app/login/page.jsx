'use client'

import dynamic from 'next/dynamic'

const Login = dynamic(() => import('../../src/pages/Login'), {
  ssr: false,
})

export default function LoginPage() {
  return <Login />
}

