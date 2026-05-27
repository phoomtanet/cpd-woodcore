import api from '@/services/api'
import type { ApiResponse, RolePermission, Role } from '@/types'
import type { UpdatePermissionDto } from '../types'

export const settingsApi = {
  getAllPermissions: () =>
    api.get<ApiResponse<RolePermission[]>>('/role-permissions').then((r) => r.data.data),

  updatePermission: (role: Role, menuKey: string, dto: UpdatePermissionDto) =>
    api
      .put<ApiResponse<RolePermission>>(`/role-permissions/${role}/${menuKey}`, dto)
      .then((r) => r.data.data),
}
