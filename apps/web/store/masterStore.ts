import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductTypeItem, UnitItem, CategoryItem, WarehouseItem } from '@/types'

interface MasterState {
  productTypes: ProductTypeItem[]
  units: UnitItem[]
  categories: CategoryItem[]
  warehouses: WarehouseItem[]
  setProductTypes: (items: ProductTypeItem[]) => void
  setUnits: (items: UnitItem[]) => void
  setCategories: (items: CategoryItem[]) => void
  setWarehouses: (items: WarehouseItem[]) => void
  clearMaster: () => void
}

export const useMasterStore = create<MasterState>()(
  persist(
    (set) => ({
      productTypes: [],
      units: [],
      categories: [],
      warehouses: [],
      setProductTypes: (productTypes) => set({ productTypes }),
      setUnits: (units) => set({ units }),
      setCategories: (categories) => set({ categories }),
      setWarehouses: (warehouses) => set({ warehouses }),
      clearMaster: () => set({ productTypes: [], units: [], categories: [], warehouses: [] }),
    }),
    { name: 'cpd-master' }
  )
)
