'use client'

import { useState, useEffect, useCallback } from 'react'
import { settingsApi } from '../services/settingsApi'
import type { RolePermission, Role } from '@/types'
import type { UpdatePermissionDto } from '../types'

type PermissionsByRole = Record<string, RolePermission[]>

export function useRolePermissions() {
  const [permissions, setPermissions] = useState<PermissionsByRole>({})
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const data = await settingsApi.getAllPermissions()

      const grouped: PermissionsByRole = {}
      const roleOrder: Role[] = []

      data.forEach((p) => {
        if (!grouped[p.role]) {
          grouped[p.role] = []
          roleOrder.push(p.role)
        }
        grouped[p.role].push(p)
      })

      setPermissions(grouped)
      setRoles(roleOrder)
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const updatePermission = useCallback(
    async (role: Role, menuKey: string, dto: UpdatePermissionDto): Promise<RolePermission> => {
      const updated = await settingsApi.updatePermission(role, menuKey, dto)
      setPermissions((prev) => ({
        ...prev,
        [role]: prev[role].map((p) => (p.menuKey === menuKey ? updated : p)),
      }))
      return updated
    },
    []
  )

  return { permissions, roles, loading, error, updatePermission }
}
