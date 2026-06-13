// ---- Stock Balance report ----
export interface BalanceItem {
  productId: number
  sku: string
  name: string
  productType: string
  unit: string
  category: string | null
  costPrice: number
  salePrice: number
  quantity: number
  costValue: number
  saleValue: number
}

export interface BalanceSummary {
  totalProducts: number
  totalQuantity: number
  totalCostValue: number
  totalSaleValue: number
}

export interface BalanceReport {
  asOf: string | null
  warehouseId: number | null
  items: BalanceItem[]
  summary: BalanceSummary
}

export interface BalanceFilter {
  search?: string
  productType?: string
  categoryId?: number
  warehouseId?: number
  binId?: number
  status?: 'active' | 'inactive' | 'all'
  asOf?: string
}

// ---- Inbound/Outbound Movement report ----
export interface MovementItem {
  id: number
  productId: number
  type: 'in' | 'out' | 'adjust' | 'transfer'
  quantity: number
  fromLocation: string | null
  toLocation: string | null
  reason: string | null
  note: string | null
  warehouseId: number | null
  toWarehouseId: number | null
  createdAt: string
  product: { id: number; name: string; sku: string; unit: string }
  createdBy: { id: number; name: string } | null
  warehouse: { id: number; name: string; shortName: string | null } | null
  toWarehouse: { id: number; name: string; shortName: string | null } | null
  bin: { id: number; code: string; name: string | null } | null
  tobin: { id: number; code: string; name: string | null } | null
}

export interface MovementSummary {
  totalRecords: number
  totalIn: number
  totalOut: number
  totalAdjust: number
  totalTransfer: number
  netChange: number
}

export interface MovementReport {
  items: MovementItem[]
  summary: MovementSummary
}

export interface MovementFilter {
  type?: 'in' | 'out' | 'adjust' | 'transfer'
  productId?: number
  warehouseId?: number
  binId?: number
  from?: string
  to?: string
}

export type ExportFormat = 'xlsx' | 'csv'
