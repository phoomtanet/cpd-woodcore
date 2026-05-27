import prisma from '@cpd/db'

export const RoleRepository = {
  findAll() {
    return prisma.role.findMany({ orderBy: { id: 'asc' } })
  },

  findById(id: number) {
    return prisma.role.findUnique({ where: { id } })
  },

  findByName(name: string) {
    return prisma.role.findUnique({ where: { name } })
  },

  create(data: { name: string; label: string }) {
    return prisma.role.create({ data })
  },

  update(id: number, data: { name?: string; label?: string }) {
    return prisma.role.update({ where: { id }, data })
  },

  deleteById(id: number) {
    return prisma.role.delete({ where: { id } })
  },
}
