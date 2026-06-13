import api from '@/services/api'
import type { ApiResponse } from '@/types'
import type { DashboardSummary, RecentTransaction, DashboardFilter } from '../types'

function buildParams(filter: DashboardFilter, extra?: Record<string, number>): URLSearchParams {
  const params = new URLSearchParams()
  if (filter.warehouseId) params.set('warehouseId', String(filter.warehouseId))
  if (filter.binId) params.set('binId', String(filter.binId))
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, String(v))
  }
  return params
}

export const dashboardApi = {
  getSummary: (filter: DashboardFilter = {}) =>
    api
      .get<ApiResponse<DashboardSummary>>(`/dashboard/summary?${buildParams(filter).toString()}`)
      .then((r) => r.data.data),

  getRecentTransactions: (filter: DashboardFilter = {}, limit = 10) =>
    api
      .get<
        ApiResponse<RecentTransaction[]>
      >(`/dashboard/recent-transactions?${buildParams(filter, { limit }).toString()}`)
      .then((r) => r.data.data),
}
