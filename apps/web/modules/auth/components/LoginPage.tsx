'use client'

import dynamic from 'next/dynamic'
import { Spin } from 'antd'

// Skip SSR for LoginForm — browser password-manager extensions inject
// attributes (e.g. fdprocessedid) into <input> after server render,
// causing a React hydration mismatch.
const LoginForm = dynamic(() => import('./LoginForm'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Spin size="large" />
    </div>
  ),
})

export default function LoginPage() {
  return <LoginForm />
}
