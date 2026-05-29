import api from '@/services/api'
import type { ApiResponse } from '@/types'
import type {
  StockTransaction,
  StockInDto,
  StockOutDto,
  StockAdjustDto,
  StockTransferDto,
  StockCardData,
  LowStockProduct,
} from '../types'

export const stockApi = {
  stockIn: (dto: StockInDto) =>
    api.post<ApiResponse<StockTransaction>>('/stock/in', dto).then((r) => r.data.data),

  stockOut: (dto: StockOutDto) =>
    api.post<ApiResponse<StockTransaction>>('/stock/out', dto).then((r) => r.data.data),

  stockAdjust: (dto: StockAdjustDto) =>
    api.post<ApiResponse<StockTransaction>>('/stock/adjust', dto).then((r) => r.data.data),

  stockTransfer: (dto: StockTransferDto) =>
    api.post<ApiResponse<StockTransaction>>('/stock/transfer', dto).then((r) => r.data.data),

  getHistory: (params?: { type?: string; productId?: number; from?: string; to?: string }) =>
    api.get<ApiResponse<StockTransaction[]>>('/stock/history', { params }).then((r) => r.data.data),

  getStockCard: (
    productId: number,
    from?: string,
    to?: string,
    order?: 'asc' | 'desc',
    warehouseId?: number
  ) =>
    api
      .get<ApiResponse<StockCardData>>(`/stock/card/${productId}`, {
        params: { from, to, order, warehouseId },
      })
      .then((r) => r.data.data),

  getLowAlert: () =>
    api.get<ApiResponse<LowStockProduct[]>>('/stock/low-alert').then((r) => r.data.data),
}
