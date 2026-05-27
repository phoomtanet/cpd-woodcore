'use client'

import { Table, Tag, Button, Space, Popconfirm, App } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { User } from '@/types'
import { useRolesStore } from '@/store/rolesStore'

const ROLE_COLORS: Record<string, string> = {
  admin: 'red',
  manager: 'blue',
  staff: 'green',
}

interface UserTableProps {
  users: User[]
  loading: boolean
  onEdit: (user: User) => void
  onDelete: (id: number) => Promise<void>
}

export default function UserTable({ users, loading, onEdit, onDelete }: UserTableProps) {
  const { message } = App.useApp()
  const getLabelByName = useRolesStore((s) => s.getLabelByName)

  const handleDelete = async (id: number) => {
    try {
      await onDelete(id)
      message.success('ลบผู้ใช้สำเร็จ')
    } catch {
      message.error('ลบผู้ใช้ไม่สำเร็จ')
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: 'ชื่อ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={ROLE_COLORS[role] ?? 'default'}>{getLabelByName(role)}</Tag>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>{isActive ? 'ใช้งาน' : 'ปิดการใช้งาน'}</Tag>
      ),
    },
    {
      title: 'จัดการ',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm
            title="ยืนยันการลบ"
            description={`ลบผู้ใช้ "${record.name}" ออกจากระบบ?`}
            onConfirm={() => handleDelete(record.id)}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={users}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  )
}
