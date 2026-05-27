import { RolePermissionRepository } from '../repositories/role-permission.repository'
import type { Role } from '@prisma/client'

export interface UpdatePermissionDto {
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export const RolePermissionService = {
  getAll() {
    return RolePermissionRepository.findAll()
  },

  getByRole(role: Role) {
    return RolePermissionRepository.findByRole(role)
  },

  updatePermission(role: Role, menuKey: string, dto: UpdatePermissionDto) {
    return RolePermissionRepository.upsert(role, menuKey, dto)
  },
}
