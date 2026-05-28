import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductTypeItem, UnitItem, CategoryItem } from '@/types'

interface MasterState {
  productTypes: ProductTypeItem[]
  units: UnitItem[]
  categories: CategoryItem[]
  setProductTypes: (items: ProductTypeItem[]) => void
  setUnits: (items: UnitItem[]) => void
  setCategories: (items: CategoryItem[]) => void
  clearMaster: () => void
}

export const useMasterStore = create<MasterState>()(
  persist(
    (set) => ({
      productTypes: [],
      units: [],
      categories: [],
      setProductTypes: (productTypes) => set({ productTypes }),
      setUnits: (units) => set({ units }),
      setCategories: (categories) => set({ categories }),
      clearMaster: () => set({ productTypes: [], units: [], categories: [] }),
    }),
    { name: 'cpd-master' }
  )
)
