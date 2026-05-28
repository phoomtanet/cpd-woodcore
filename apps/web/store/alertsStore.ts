import { create } from 'zustand'

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
