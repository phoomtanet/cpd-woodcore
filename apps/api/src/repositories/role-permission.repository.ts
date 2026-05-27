import prisma from '@cpd/db'

type RawPerm = {
  id: number
  roleId: number
  role: { name: string }
  menuKey: string
  canView: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  updatedAt: Date
}

function flattenRole(p: RawPerm) {
  return { ...p, role: p.role.name }
}

const permInclude = { role: { select: { name: true } } } as const

export const RolePermissionRepository = {
  async findAll() {
    const perms = await prisma.rolePermission.findMany({
      include: permInclude,
      orderBy: [{ roleId: 'asc' }, { menuKey: 'asc' }],
    })
    return perms.map(flattenRole)
  },

  async findByRole(roleName: string) {
    const perms = await prisma.rolePermission.findMany({
      where: { role: { name: roleName } },
      include: permInclude,
      orderBy: { menuKey: 'asc' },
    })
    return perms.map(flattenRole)
  },

  async upsert(
    roleName: string,
    menuKey: string,
    data: { canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }
  ) {
    const roleRecord = await prisma.role.findUniqueOrThrow({ where: { name: roleName } })
    const p = await prisma.rolePermission.upsert({
      where: { roleId_menuKey: { roleId: roleRecord.id, menuKey } },
      update: data,
      create: { roleId: roleRecord.id, menuKey, ...data },
      include: permInclude,
    })
    return flattenRole(p)
  },
}
