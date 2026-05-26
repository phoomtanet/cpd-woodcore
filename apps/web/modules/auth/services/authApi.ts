import api from '@/services/api'
import type { ApiResponse, User } from '@/types'
import type { LoginDto, LoginResponse } from '../types'

export const authApi = {
  login: (dto: LoginDto) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', dto).then((r) => r.data.data),

  me: () => api.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),
}
