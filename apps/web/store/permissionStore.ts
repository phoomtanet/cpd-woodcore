import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RolePermission } from '@/types'

interface PermissionState {
  permissions: RolePermission[]
  setPermissions: (permissions: RolePermission[]) => void
  clearPermissions: () => void
  canView: (menuKey: string) => boolean
  canCreate: (menuKey: string) => boolean
  canUpdate: (menuKey: string) => boolean
  canDelete: (menuKey: string) => boolean
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: [],
      setPermissions: (permissions) => set({ permissions }),
      clearPermissions: () => set({ permissions: [] }),
      canView: (menuKey) => {
        const perm = get().permissions.find((p) => p.menuKey === menuKey)
        return perm ? perm.canView : true
      },
      canCreate: (menuKey) => {
        const perm = get().permissions.find((p) => p.menuKey === menuKey)
        return perm ? perm.canCreate : false
      },
      canUpdate: (menuKey) => {
        const perm = get().permissions.find((p) => p.menuKey === menuKey)
        return perm ? perm.canUpdate : false
      },
      canDelete: (menuKey) => {
        const perm = get().permissions.find((p) => p.menuKey === menuKey)
        return perm ? perm.canDelete : false
      },
    }),
    { name: 'cpd-permissions' }
  )
)
