import prisma from '@cpd/db'

export const MasterRepository = {
  // Product Types
  findAllProductTypes() {
    return prisma.productTypeItem.findMany({ orderBy: { id: 'asc' } })
  },

  findProductTypeById(id: number) {
    return prisma.productTypeItem.findUnique({ where: { id } })
  },

  findProductTypeByName(name: string) {
    return prisma.productTypeItem.findUnique({ where: { name } })
  },

  createProductType(data: { name: string; label: string }) {
    return prisma.productTypeItem.create({ data })
  },

  updateProductType(id: number, data: { name?: string; label?: string }) {
    return prisma.productTypeItem.update({ where: { id }, data })
  },

  deleteProductTypeById(id: number) {
    return prisma.productTypeItem.delete({ where: { id } })
  },

  // Units
  findAllUnits() {
    return prisma.unit.findMany({ orderBy: { id: 'asc' } })
  },

  findUnitById(id: number) {
    return prisma.unit.findUnique({ where: { id } })
  },

  findUnitByName(name: string) {
    return prisma.unit.findUnique({ where: { name } })
  },

  createUnit(data: { name: string }) {
    return prisma.unit.create({ data })
  },

  updateUnit(id: number, data: { name: string }) {
    return prisma.unit.update({ where: { id }, data })
  },

  deleteUnitById(id: number) {
    return prisma.unit.delete({ where: { id } })
  },
}
