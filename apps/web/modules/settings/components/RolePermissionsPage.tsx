'use client'

import { useState } from 'react'
import { Table, Tag, Button, App, Spin, Alert } from 'antd'
import { EditOutlined, SettingOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import RoleGuard from '@/shared/guards/RoleGuard'
import RoleEditModal from './RoleEditModal'
import { useRolePermissions } from '../hooks/useRolePermissions'
import { ROLE_LABELS } from '@/constants'
import type { Role, RolePermission } from '@/types'

type RoleRow = { role: Role; data: RolePermission[] }

export default function RolePermissionsPage() {
  const { permissions, roles, loading, error, updatePermission } = useRolePermissions()
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  const tableData: RoleRow[] = roles.map((role) => ({
    role,
    data: permissions[role] ?? [],
  }))

  const columns = [
    {
      title: 'Role',
      key: 'role',
      render: (_: unknown, record: RoleRow) => ROLE_LABELS[record.role] ?? record.role,
    },
    {
      title: 'สถานะ',
      key: 'status',
      render: () => <Tag color="success">ใช้งาน</Tag>,
    },
    {
      title: 'จัดการ',
      key: 'actions',
      render: (_: unknown, record: RoleRow) => (
        <Button type="text" icon={<EditOutlined />} onClick={() => setEditingRole(record.role)} />
      ),
    },
  ]

  return (
    <RoleGuard roles={['admin']}>
      <App>
        <PageHeader
          title="ตั้งค่าสิทธิ์การใช้งาน"
          subtitle="กำหนดสิทธิ์การเข้าถึงเมนูและการดำเนินการแต่ละ Role"
          extra={<SettingOutlined style={{ fontSize: 20, color: '#888' }} />}
        />

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey="role"
            pagination={false}
            size="small"
          />
        )}

        {editingRole && (
          <RoleEditModal
            open={!!editingRole}
            role={editingRole}
            data={permissions[editingRole] ?? []}
            onClose={() => setEditingRole(null)}
            onUpdate={updatePermission}
          />
        )}
      </App>
    </RoleGuard>
  )
}
