import api from '@/services/api'
import type { ApiResponse, ProductTypeItem, UnitItem, CategoryItem, SkuPrefixItem } from '@/types'

export const masterApi = {
  getProductTypes: (status: 'active' | 'all' = 'active') =>
    api
      .get<ApiResponse<ProductTypeItem[]>>(`/master/product-types?status=${status}`)
      .then((r) => r.data.data),

  createProductType: (dto: { name: string; label: string }) =>
    api.post<ApiResponse<ProductTypeItem>>('/master/product-types', dto).then((r) => r.data.data),

  updateProductType: (id: number, dto: { name?: string; label?: string }) =>
    api
      .put<ApiResponse<ProductTypeItem>>(`/master/product-types/${id}`, dto)
      .then((r) => r.data.data),

  toggleProductTypeStatus: (id: number, isActive: boolean) =>
    api
      .patch<ApiResponse<ProductTypeItem>>(`/master/product-types/${id}/status`, { isActive })
      .then((r) => r.data.data),

  deleteProductType: (id: number) => api.delete(`/master/product-types/${id}`),

  getUnits: (status: 'active' | 'all' = 'active') =>
    api.get<ApiResponse<UnitItem[]>>(`/master/units?status=${status}`).then((r) => r.data.data),

  createUnit: (dto: { name: string }) =>
    api.post<ApiResponse<UnitItem>>('/master/units', dto).then((r) => r.data.data),

  updateUnit: (id: number, dto: { name: string }) =>
    api.put<ApiResponse<UnitItem>>(`/master/units/${id}`, dto).then((r) => r.data.data),

  toggleUnitStatus: (id: number, isActive: boolean) =>
    api
      .patch<ApiResponse<UnitItem>>(`/master/units/${id}/status`, { isActive })
      .then((r) => r.data.data),

  deleteUnit: (id: number) => api.delete(`/master/units/${id}`),

  getCategories: (status: 'active' | 'all' = 'active') =>
    api
      .get<ApiResponse<CategoryItem[]>>(`/master/categories?status=${status}`)
      .then((r) => r.data.data),

  createCategory: (dto: { name: string }) =>
    api.post<ApiResponse<CategoryItem>>('/master/categories', dto).then((r) => r.data.data),

  updateCategory: (id: number, dto: { name: string }) =>
    api.put<ApiResponse<CategoryItem>>(`/master/categories/${id}`, dto).then((r) => r.data.data),

  toggleCategoryStatus: (id: number, isActive: boolean) =>
    api
      .patch<ApiResponse<CategoryItem>>(`/master/categories/${id}/status`, { isActive })
      .then((r) => r.data.data),

  deleteCategory: (id: number) => api.delete(`/master/categories/${id}`),

  getSkuPrefixes: (status: 'active' | 'all' = 'active') =>
    api
      .get<ApiResponse<SkuPrefixItem[]>>(`/master/sku-prefixes?status=${status}`)
      .then((r) => r.data.data),

  createSkuPrefix: (dto: { prefix: string; label: string }) =>
    api.post<ApiResponse<SkuPrefixItem>>('/master/sku-prefixes', dto).then((r) => r.data.data),

  updateSkuPrefix: (id: number, dto: { prefix?: string; label?: string }) =>
    api.put<ApiResponse<SkuPrefixItem>>(`/master/sku-prefixes/${id}`, dto).then((r) => r.data.data),

  toggleSkuPrefixStatus: (id: number, isActive: boolean) =>
    api
      .patch<ApiResponse<SkuPrefixItem>>(`/master/sku-prefixes/${id}/status`, { isActive })
      .then((r) => r.data.data),

  deleteSkuPrefix: (id: number) => api.delete(`/master/sku-prefixes/${id}`),
}
