import type { Role } from '@/types'

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: Role
}

export interface UpdateUserDto {
  name?: string
  role?: Role
  isActive?: boolean
}
