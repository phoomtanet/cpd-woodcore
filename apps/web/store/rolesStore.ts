import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RoleItem } from '@/types'

interface RolesState {
  roles: RoleItem[]
  setRoles: (roles: RoleItem[]) => void
  clearRoles: () => void
  getLabelByName: (name: string) => string
}

export const useRolesStore = create<RolesState>()(
  persist(
    (set, get) => ({
      roles: [],
      setRoles: (roles) => set({ roles }),
      clearRoles: () => set({ roles: [] }),
      getLabelByName: (name) => {
        const found = get().roles.find((r) => r.name === name)
        return found?.label ?? name
      },
    }),
    { name: 'cpd-roles' }
  )
)
