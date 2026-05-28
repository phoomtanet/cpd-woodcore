import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProductTypeItem, UnitItem, CategoryItem, SkuPrefixItem } from '@/types'

interface MasterState {
  productTypes: ProductTypeItem[]
  units: UnitItem[]
  categories: CategoryItem[]
  skuPrefixes: SkuPrefixItem[]
  setProductTypes: (items: ProductTypeItem[]) => void
  setUnits: (items: UnitItem[]) => void
  setCategories: (items: CategoryItem[]) => void
  setSkuPrefixes: (items: SkuPrefixItem[]) => void
  clearMaster: () => void
}

export const useMasterStore = create<MasterState>()(
  persist(
    (set) => ({
      productTypes: [],
      units: [],
      categories: [],
      skuPrefixes: [],
      setProductTypes: (productTypes) => set({ productTypes }),
      setUnits: (units) => set({ units }),
      setCategories: (categories) => set({ categories }),
      setSkuPrefixes: (skuPrefixes) => set({ skuPrefixes }),
      clearMaster: () => set({ productTypes: [], units: [], categories: [], skuPrefixes: [] }),
    }),
    { name: 'cpd-master' }
  )
)
