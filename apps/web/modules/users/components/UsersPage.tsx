'use client'

import { useState } from 'react'
import { Button, Alert, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import RoleGuard from '@/shared/guards/RoleGuard'
import UserTable from './UserTable'
import UserFormModal from './UserFormModal'
import { useUsers } from '../hooks/useUsers'
import type { User } from '@/types'

export default function UsersPage() {
  const { users, loading, error, createUser, updateUser, removeUser } = useUsers()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <RoleGuard roles={['admin']}>
      <App>
        <PageHeader
          title="จัดการผู้ใช้"
          subtitle="เพิ่ม แก้ไข หรือลบบัญชีผู้ใช้ในระบบ"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              เพิ่มผู้ใช้
            </Button>
          }
        />

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <UserTable users={users} loading={loading} onEdit={openEdit} onDelete={removeUser} />

        <UserFormModal
          open={modalOpen}
          editing={editing}
          onClose={closeModal}
          onCreate={createUser}
          onUpdate={updateUser}
        />
      </App>
    </RoleGuard>
  )
}
