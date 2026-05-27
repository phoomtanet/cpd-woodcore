import prisma from '@cpd/db'
import type { Prisma } from '@prisma/client'

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const

export const UserRepository = {
  findByEmail(email: string) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } })
  },

  findByIdPublic(id: number) {
    return prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSelect })
  },

  findAll() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: userSelect,
      orderBy: { createdAt: 'asc' },
    })
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, select: userSelect })
  },

  update(id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, select: userSelect })
  },

  deleteById(id: number) {
    return prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
  },
}
