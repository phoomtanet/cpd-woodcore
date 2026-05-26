import prisma from '@cpd/db'

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
}
