'use client'

import { useEffect, useState } from 'react'
import { Button, Spin, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { usePermissionStore } from '@/store/permissionStore'
import { ROUTES } from '@/constants'

interface PermissionGuardProps {
  children: React.ReactNode
  menuKey: string
}

export default function PermissionGuard({ children, menuKey }: PermissionGuardProps) {
  const router = useRouter()
  const canView = usePermissionStore((s) => s.canView(menuKey))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
      >
        <Spin size="large" />
      </div>
    )
  }

  if (!canView) {
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
