import api from '@/services/api'
import type { ApiResponse, User } from '@/types'
import type { CreateUserDto, UpdateUserDto } from '../types'

export const usersApi = {
  getAll: () => api.get<ApiResponse<User[]>>('/users').then((r) => r.data.data),

  create: (dto: CreateUserDto) =>
    api.post<ApiResponse<User>>('/users', dto).then((r) => r.data.data),

  update: (id: number, dto: UpdateUserDto) =>
    api.put<ApiResponse<User>>(`/users/${id}`, dto).then((r) => r.data.data),

  remove: (id: number) => api.delete(`/users/${id}`),
}
