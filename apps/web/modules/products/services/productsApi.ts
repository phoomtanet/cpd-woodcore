import api from '@/services/api'
import type { ApiResponse } from '@/types'
import type { Product, CreateProductDto } from '../types'

export interface ProductFilter {
  search?: string
  productType?: string
  categoryId?: number
  status?: 'active' | 'inactive' | 'all'
}

export const productsApi = {
  getAll: (filter: ProductFilter = {}) => {
    const params = new URLSearchParams()
    if (filter.search) params.set('search', filter.search)
    if (filter.productType) params.set('productType', filter.productType)
    if (filter.categoryId) params.set('categoryId', String(filter.categoryId))
    if (filter.status) params.set('status', filter.status)
    return api
      .get<ApiResponse<Product[]>>(`/products?${params.toString()}`)
      .then((r) => r.data.data)
  },

  getById: (id: number) =>
    api.get<ApiResponse<Product>>(`/products/${id}`).then((r) => r.data.data),

  create: (dto: CreateProductDto) =>
    api.post<ApiResponse<Product>>('/products', dto).then((r) => r.data.data),

  update: (id: number, dto: Partial<CreateProductDto>) =>
    api.put<ApiResponse<Product>>(`/products/${id}`, dto).then((r) => r.data.data),

  toggleStatus: (id: number, isActive: boolean) =>
    api
      .patch<ApiResponse<Product>>(`/products/${id}/status`, { isActive })
      .then((r) => r.data.data),

  remove: (id: number) => api.delete(`/products/${id}`),

  uploadImage: (id: number, file: File) => {
    const form = new FormData()
    form.append('image', file, file.name || 'product.jpg')
    return api
      .post<ApiResponse<Product>>(`/products/${id}/image`, form, {
        headers: { 'Content-Type': undefined },
      })
      .then((r) => r.data.data)
  },
}
