'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spin } from 'antd'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  // Wait for client mount so Zustand can rehydrate from localStorage
  // before we decide whether to redirect — prevents false redirects on refresh
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !token) router.replace(ROUTES.LOGIN)
  }, [mounted, token, router])

  if (!mounted || !token) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  return <>{children}</>
}
