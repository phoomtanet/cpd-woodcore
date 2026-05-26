'use client'

import { Button, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'
import { ROUTES } from '@/constants'

interface RoleGuardProps {
  children: React.ReactNode
  roles: Role[]
}

export default function RoleGuard({ children, roles }: RoleGuardProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  if (!user || !roles.includes(user.role)) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Typography.Title level={1} type="danger">
          403
        </Typography.Title>
        <Typography.Paragraph type="secondary">ไม่มีสิทธิ์เข้าถึงหน้านี้</Typography.Paragraph>
        <Button type="primary" onClick={() => router.push(ROUTES.DASHBOARD)}>
          กลับหน้าหลัก
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
