import prisma from '@cpd/db'

const roleSelect = { select: { name: true } } as const

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: roleSelect,
  isActive: true,
  createdAt: true,
} as const

type RawPublicUser = {
  id: number
  name: string
  email: string
  role: { name: string }
  isActive: boolean
  createdAt: Date
}

function flattenRole(u: RawPublicUser) {
  return { ...u, role: u.role.name }
}

export const UserRepository = {
  findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: roleSelect },
    })
  },

  async findByIdPublic(id: number) {
    const u = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: publicSelect })
    return u ? flattenRole(u) : null
  },

  async findAll() {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: publicSelect,
      orderBy: { createdAt: 'asc' },
    })
    return users.map(flattenRole)
  },

  async create(data: { name: string; email: string; passwordHash: string; role: string }) {
    const { role, ...rest } = data
    const u = await prisma.user.create({
      data: { ...rest, role: { connect: { name: role } } },
      select: publicSelect,
    })
    return flattenRole(u)
  },

  async update(id: number, data: { name?: string; role?: string; isActive?: boolean }) {
    const { role, ...rest } = data
    const u = await prisma.user.update({
      where: { id },
      data: { ...rest, ...(role !== undefined ? { role: { connect: { name: role } } } : {}) },
      select: publicSelect,
    })
    return flattenRole(u)
  },

  deleteById(id: number) {
    return prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
  },
}
