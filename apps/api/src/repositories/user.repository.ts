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
    return prisma.user.findUnique({ where: { email } })
  },

  findByIdPublic(id: number) {
    return prisma.user.findUnique({ where: { id }, select: userSelect })
  },

  findAll() {
    return prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } })
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, select: userSelect })
  },

  update(id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, select: userSelect })
  },

  deleteById(id: number) {
    return prisma.user.delete({ where: { id } })
  },
}
