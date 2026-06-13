import { ReportService } from './report.service'
import { DashboardRepository } from '../repositories/dashboard.repository'

export interface DashboardFilter {
  warehouseId?: number
  binId?: number
}

export const DashboardService = {
  // Headline stats. Reuses ReportService.getBalance so warehouse / bin filtering
  // (including bin-level transaction replay) stays in one place.
  async getSummary({ warehouseId, binId }: DashboardFilter) {
    const balance = await ReportService.getBalance({ warehouseId, binId, status: 'active' })
    const warehouseCount = await DashboardRepository.countActiveWarehouses()

    const lowStockCount = balance.items.filter((i) => i.quantity < i.minStock).length

    return {
      warehouseId: warehouseId ?? null,
      binId: binId ?? null,
      totalProducts: balance.summary.totalProducts,
      totalStockQuantity: balance.summary.totalQuantity,
      totalCostValue: balance.summary.totalCostValue,
      totalSaleValue: balance.summary.totalSaleValue,
      lowStockCount,
      warehouseCount,
    }
  },

  getRecentTransactions({ warehouseId, binId }: DashboardFilter, limit: number) {
    return DashboardRepository.findRecentTransactions({ warehouseId, binId, limit })
  },
}
