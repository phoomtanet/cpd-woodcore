export type TxType = 'in' | 'out' | 'adjust' | 'transfer'

export interface StockTransaction {
  id: number
  productId: number
  type: TxType
  quantity: number
  fromLocation?: string
  toLocation?: string
  reason?: string
  note?: string
  userId: number
  createdAt: string
}

export interface StockInDto {
  productId: number
  quantity: number
  warehouseId?: number
  binId?: number
  note?: string
}

export interface StockOutDto {
  productId: number
  quantity: number
  warehouseId?: number
  binId?: number
  note?: string
}

export interface StockAdjustDto {
  productId: number
  quantity: number
  warehouseId?: number
  reason?: string
  note?: string
}

export interface StockTransferDto {
  productId: number
  quantity: number
  fromLocation: string
  toLocation: string
  fromWarehouseId?: number
  toWarehouseId?: number
  binId?: number
  toBinId?: number
  note?: string
}

export interface StockCardWarehouse {
  id: number
  name: string
  shortName?: string | null
}

export interface StockCardBin {
  id: number
  code: string
  name?: string | null
}

export interface StockCardRow extends StockTransaction {
  balance: number
  costValue: number
  saleValue: number
  createdBy: { id: number; name: string }
  warehouse?: StockCardWarehouse | null
  toWarehouse?: StockCardWarehouse | null
  bin?: StockCardBin | null
  tobin?: StockCardBin | null
}

export interface LowStockProduct {
  id: number
  name: string
  sku: string
  productType: string
  unit: string
  currentStock: number
  minStock: number
  barcode?: string | null
  category?: string | null
}

export interface StockCardData {
  product: {
    id: number
    name: string
    sku: string
    unit: string
    costPrice: number
    salePrice: number
    currentStock: number
    minStock: number
    totalCostValue: number
    totalSaleValue: number
  }
  transactions: StockCardRow[]
}
