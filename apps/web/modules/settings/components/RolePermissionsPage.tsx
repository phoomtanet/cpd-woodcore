'use client'

import { Alert, Tabs, App, Spin } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import RoleGuard from '@/shared/guards/RoleGuard'
import RolePermissionsTable from './RolePermissionsTable'
import { useRolePermissions } from '../hooks/useRolePermissions'
import { ROLE_LABELS } from '@/constants'

export default function RolePermissionsPage() {
  const { permissions, roles, loading, error, updatePermission } = useRolePermissions()

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
          <Tabs
            defaultActiveKey="manager"
            items={roles.map((role) => ({
              key: role,
              label: ROLE_LABELS[role] ?? role,
              children: (
                <RolePermissionsTable
                  role={role}
                  data={permissions[role]}
                  onUpdate={updatePermission}
                />
              ),
            }))}
          />
        )}
      </App>
    </RoleGuard>
  )
}
