import { create } from 'zustand'
import api from '@/services/api'
import type { ApiResponse } from '@/types'

interface AlertsState {
  lowStockCount: number
  setLowStockCount: (count: number) => void
  clearAlerts: () => void
}

export const useAlertsStore = create<AlertsState>((set) => ({
  lowStockCount: 0,
  setLowStockCount: (count) => set({ lowStockCount: count }),
  clearAlerts: () => set({ lowStockCount: 0 }),
}))

export function syncAlerts() {
  api
    .get<ApiResponse<unknown[]>>('/stock/low-alert')
    .then((r) => useAlertsStore.getState().setLowStockCount(r.data.data.length))
    .catch(() => {})
}
