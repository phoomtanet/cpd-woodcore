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
  reason?: string
  note?: string
}

export interface StockOutDto {
  productId: number
  quantity: number
  reason?: string
  note?: string
}

export interface StockAdjustDto {
  productId: number
  quantity: number
  reason: string
}

export interface StockTransferDto {
  productId: number
  quantity: number
  fromLocation: string
  toLocation: string
  note?: string
}
