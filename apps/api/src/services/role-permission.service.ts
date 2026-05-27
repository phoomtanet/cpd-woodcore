import { RolePermissionRepository } from '../repositories/role-permission.repository'

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

  getByRole(roleName: string) {
    return RolePermissionRepository.findByRole(roleName)
  },

  updatePermission(roleName: string, menuKey: string, dto: UpdatePermissionDto) {
    return RolePermissionRepository.upsert(roleName, menuKey, dto)
  },
}
