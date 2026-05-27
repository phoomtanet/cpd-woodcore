import prisma from '@cpd/db'
import type { Role } from '@prisma/client'

export const RolePermissionRepository = {
  findAll() {
    return prisma.rolePermission.findMany({ orderBy: [{ role: 'asc' }, { menuKey: 'asc' }] })
  },

  findByRole(role: Role) {
    return prisma.rolePermission.findMany({
      where: { role },
      orderBy: { menuKey: 'asc' },
    })
  },

  findByRoleAndMenu(role: Role, menuKey: string) {
    return prisma.rolePermission.findUnique({ where: { role_menuKey: { role, menuKey } } })
  },

  upsert(
    role: Role,
    menuKey: string,
    data: { canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }
  ) {
    return prisma.rolePermission.upsert({
      where: { role_menuKey: { role, menuKey } },
      update: data,
      create: { role, menuKey, ...data },
    })
  },
}
