export interface DashboardSummary {
  warehouseId: number | null
  binId: number | null
  totalProducts: number
  totalStockQuantity: number
  totalCostValue: number
  totalSaleValue: number
  lowStockCount: number
  warehouseCount: number
}

export interface RecentTransaction {
  id: number
  productId: number
  type: 'in' | 'out' | 'adjust' | 'transfer'
  quantity: number
  note: string | null
  createdAt: string
  product: { id: number; name: string; sku: string; unit: string }
  createdBy: { id: number; name: string } | null
  warehouse: { id: number; name: string; shortName: string | null } | null
  toWarehouse: { id: number; name: string; shortName: string | null } | null
  bin: { id: number; code: string; name: string | null } | null
  tobin: { id: number; code: string; name: string | null } | null
}

export interface DashboardFilter {
  warehouseId?: number
  binId?: number
}
