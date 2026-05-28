export type Role = 'admin' | 'manager' | 'staff'

export interface RoleItem {
  id: number
  name: string
  label: string
  createdAt: string
}

export interface User {
  id: number
  name: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
}

export interface ApiResponse<T> {
  data: T
  message: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  message: string
}

export interface ApiError {
  error: string | { field: string; message: string }[]
}

export interface ProductTypeItem {
  id: number
  name: string
  label: string
  isActive: boolean
}

export interface UnitItem {
  id: number
  name: string
  isActive: boolean
}

export interface CategoryItem {
  id: number
  name: string
  isActive: boolean
}

export interface RolePermission {
  id: number
  role: Role
  menuKey: string
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  updatedAt: string
}
