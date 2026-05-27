import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductTypeItem, UnitItem } from '@/types'

interface MasterState {
  productTypes: ProductTypeItem[]
  units: UnitItem[]
  setProductTypes: (items: ProductTypeItem[]) => void
  setUnits: (items: UnitItem[]) => void
  clearMaster: () => void
}

export const useMasterStore = create<MasterState>()(
  persist(
    (set) => ({
      productTypes: [],
      units: [],
      setProductTypes: (productTypes) => set({ productTypes }),
      setUnits: (units) => set({ units }),
      clearMaster: () => set({ productTypes: [], units: [] }),
    }),
    { name: 'cpd-master' }
  )
)
