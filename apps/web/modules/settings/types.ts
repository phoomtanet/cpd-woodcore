import type { Role, RolePermission } from '@/types'

export type { RolePermission }

export interface UpdatePermissionDto {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export type PermissionsByRole = Record<Role, RolePermission[]>
