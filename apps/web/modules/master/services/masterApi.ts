import api from '@/services/api'
import type {
  ApiResponse,
  ProductTypeItem,
  UnitItem,
  CategoryItem,
  WarehouseItem,
  BinLocationItem,
} from '@/types'

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

  getWarehouses: (status: 'active' | 'all' = 'active') =>
    api
      .get<ApiResponse<WarehouseItem[]>>(`/master/warehouses?status=${status}`)
      .then((r) => r.data.data),

  createWarehouse: (dto: { code: string; name: string; shortName?: string; address?: string }) =>
    api.post<ApiResponse<WarehouseItem>>('/master/warehouses', dto).then((r) => r.data.data),

  updateWarehouse: (
    id: number,
    dto: { code?: string; name?: string; shortName?: string; address?: string }
  ) =>
    api.put<ApiResponse<WarehouseItem>>(`/master/warehouses/${id}`, dto).then((r) => r.data.data),

  toggleWarehouseStatus: (id: number, isActive: boolean) =>
    api
      .patch<ApiResponse<WarehouseItem>>(`/master/warehouses/${id}/status`, { isActive })
      .then((r) => r.data.data),

  deleteWarehouse: (id: number) => api.delete(`/master/warehouses/${id}`),

  getBinsByWarehouse: (warehouseId: number, status: 'active' | 'all' = 'all') =>
    api
      .get<
        ApiResponse<BinLocationItem[]>
      >(`/master/warehouses/${warehouseId}/bins?status=${status}`)
      .then((r) => r.data.data),

  createBin: (dto: { warehouseId: number; code: string; name?: string }) =>
    api.post<ApiResponse<BinLocationItem>>('/master/bin-locations', dto).then((r) => r.data.data),

  updateBin: (id: number, dto: { code?: string; name?: string }) =>
    api
      .put<ApiResponse<BinLocationItem>>(`/master/bin-locations/${id}`, dto)
      .then((r) => r.data.data),

  toggleBinStatus: (id: number, isActive: boolean) =>
    api
      .patch<ApiResponse<BinLocationItem>>(`/master/bin-locations/${id}/status`, { isActive })
      .then((r) => r.data.data),

  deleteBin: (id: number) => api.delete(`/master/bin-locations/${id}`),
}
