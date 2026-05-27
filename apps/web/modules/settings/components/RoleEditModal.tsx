'use client'

import { Modal } from 'antd'
import RolePermissionsTable from './RolePermissionsTable'
import type { Role, RolePermission } from '@/types'
import type { UpdatePermissionDto } from '../types'
import { useRolesStore } from '@/store/rolesStore'

interface Props {
  open: boolean
  role: Role
  data: RolePermission[]
  onClose: () => void
  onUpdate: (role: Role, menuKey: string, dto: UpdatePermissionDto) => Promise<RolePermission>
}

export default function RoleEditModal({ open, role, data, onClose, onUpdate }: Props) {
  const getLabelByName = useRolesStore((s) => s.getLabelByName)
  return (
    <Modal
      open={open}
      title={`สิทธิ์การใช้งาน — ${getLabelByName(role)}`}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <RolePermissionsTable role={role} data={data} onUpdate={onUpdate} />
    </Modal>
  )
}
