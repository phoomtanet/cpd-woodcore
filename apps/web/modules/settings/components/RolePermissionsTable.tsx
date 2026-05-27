'use client'

import { useState } from 'react'
import React from 'react'
import { Table, Checkbox, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { RolePermission, Role } from '@/types'
import type { UpdatePermissionDto } from '../types'

const MENU_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'สินค้า',
  'stock-in': 'รับสินค้าเข้า',
  'stock-out': 'เบิกสินค้าออก',
  'stock-adjust': 'ปรับสต๊อก',
  'stock-transfer': 'โอนย้าย',
  'stock-card': 'Stock Card',
  alerts: 'Low Stock Alert',
  reports: 'รายงาน',
  users: 'จัดการผู้ใช้',
  settings: 'ตั้งค่า',
}

const PERM_FIELDS: { key: keyof UpdatePermissionDto; label: string }[] = [
  { key: 'canView', label: 'ดู' },
  { key: 'canCreate', label: 'เพิ่ม' },
  { key: 'canUpdate', label: 'แก้ไข' },
  { key: 'canDelete', label: 'ลบ' },
]

interface Props {
  role: Role
  data: RolePermission[]
  onUpdate: (role: Role, menuKey: string, dto: UpdatePermissionDto) => Promise<RolePermission>
}

export default function RolePermissionsTable({ role, data, onUpdate }: Props) {
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())
  const { message } = App.useApp()

  const handleChange = async (
    record: RolePermission,
    field: keyof UpdatePermissionDto,
    value: boolean
  ) => {
    const loadingKey = `${record.menuKey}:${field}`
    setLoadingKeys((prev) => new Set(prev).add(loadingKey))
    try {
      const dto: UpdatePermissionDto = {
        canView: record.canView,
        canCreate: record.canCreate,
        canUpdate: record.canUpdate,
        canDelete: record.canDelete,
        [field]: value,
      }
      await onUpdate(role, record.menuKey, dto)
      message.success('บันทึกสำเร็จ')
    } catch {
      message.error('บันทึกไม่สำเร็จ')
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev)
        next.delete(loadingKey)
        return next
      })
    }
  }

  const columns: ColumnsType<RolePermission> = [
    {
      title: 'เมนู',
      dataIndex: 'menuKey',
      key: 'menuKey',
      width: 180,
      render: (key: string) => MENU_LABELS[key] ?? key,
    },
    ...PERM_FIELDS.map(({ key, label }) => ({
      title: label,
      key,
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: RolePermission) => {
        const loadingKey = `${record.menuKey}:${key}`
        return (
          <Checkbox
            checked={record[key]}
            disabled={loadingKeys.has(loadingKey)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange(record, key, e.target.checked)
            }
          />
        )
      },
    })),
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="menuKey"
      pagination={false}
      size="small"
      loading={false}
    />
  )
}
