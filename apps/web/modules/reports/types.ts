export interface StockBalanceItem {
  productId: number
  name: string
  sku: string
  unit: string
  currentStock: number
  costPrice: number
  totalValue: number
}

export interface MovementItem {
  date: string
  productId: number
  productName: string
  type: string
  quantity: number
  userId: number
  note?: string
}

export interface ReportFilter {
  from?: string
  to?: string
  productId?: number
  type?: string
}
