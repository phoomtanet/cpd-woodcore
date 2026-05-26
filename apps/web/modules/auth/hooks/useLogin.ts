'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { authApi } from '../services/authApi'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setAuth = useAuthStore((s) => s.setAuth)
  const router = useRouter()

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const { token, user } = await authApi.login({ email, password })
      setAuth(user, token)
      router.replace(ROUTES.DASHBOARD)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.error
        setError(typeof msg === 'string' ? msg : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}
