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
  note?: string
}

export interface StockOutDto {
  productId: number
  quantity: number
  note?: string
}

export interface StockAdjustDto {
  productId: number
  quantity: number
  reason?: string
  note?: string
}

export interface StockTransferDto {
  productId: number
  quantity: number
  fromLocation: string
  toLocation: string
  note?: string
}

export interface StockCardRow extends StockTransaction {
  balance: number
  createdBy: { id: number; name: string }
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
    currentStock: number
    minStock: number
  }
  transactions: StockCardRow[]
}
