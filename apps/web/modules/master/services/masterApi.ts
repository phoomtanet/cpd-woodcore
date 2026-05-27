import api from '@/services/api'
import type { ApiResponse, ProductTypeItem, UnitItem } from '@/types'

export const masterApi = {
  getProductTypes: () =>
    api.get<ApiResponse<ProductTypeItem[]>>('/master/product-types').then((r) => r.data.data),

  createProductType: (dto: { name: string; label: string }) =>
    api.post<ApiResponse<ProductTypeItem>>('/master/product-types', dto).then((r) => r.data.data),

  updateProductType: (id: number, dto: { name?: string; label?: string }) =>
    api
      .put<ApiResponse<ProductTypeItem>>(`/master/product-types/${id}`, dto)
      .then((r) => r.data.data),

  deleteProductType: (id: number) => api.delete(`/master/product-types/${id}`),

  getUnits: () => api.get<ApiResponse<UnitItem[]>>('/master/units').then((r) => r.data.data),

  createUnit: (dto: { name: string }) =>
    api.post<ApiResponse<UnitItem>>('/master/units', dto).then((r) => r.data.data),

  updateUnit: (id: number, dto: { name: string }) =>
    api.put<ApiResponse<UnitItem>>(`/master/units/${id}`, dto).then((r) => r.data.data),

  deleteUnit: (id: number) => api.delete(`/master/units/${id}`),
}
