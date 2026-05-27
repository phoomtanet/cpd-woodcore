import api from '@/services/api'
import type { ApiResponse, User, RolePermission, RoleItem } from '@/types'
import type { LoginDto, LoginResponse } from '../types'

export const authApi = {
  login: (dto: LoginDto) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', dto).then((r) => r.data.data),

  me: () => api.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),

  getPermissionsByRole: (role: string) =>
    api.get<ApiResponse<RolePermission[]>>(`/role-permissions/${role}`).then((r) => r.data.data),

  getRoles: () => api.get<ApiResponse<RoleItem[]>>('/roles').then((r) => r.data.data),
}
