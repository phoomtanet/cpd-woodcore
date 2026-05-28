import prisma from '@cpd/db'

const auditInclude = {
  createdBy: { select: { name: true } },
  updatedBy: { select: { name: true } },
} as const

export const MasterRepository = {
  // Product Types
  findAllProductTypes(status: 'active' | 'all' = 'active') {
    return prisma.productTypeItem.findMany({
      where: status === 'active' ? { isActive: true, deletedAt: null } : { deletedAt: null },
      orderBy: { id: 'asc' },
      include: auditInclude,
    })
  },

  findProductTypeById(id: number) {
    return prisma.productTypeItem.findFirst({
      where: { id, deletedAt: null },
      include: auditInclude,
    })
  },

  findProductTypeByName(name: string) {
    return prisma.productTypeItem.findUnique({ where: { name } })
  },

  createProductType(data: { name: string; label: string; createdById?: number }) {
    return prisma.productTypeItem.create({ data })
  },

  updateProductType(id: number, data: { name?: string; label?: string; updatedById?: number }) {
    return prisma.productTypeItem.update({ where: { id }, data })
  },

  updateProductTypeStatus(id: number, isActive: boolean, updatedById?: number) {
    return prisma.productTypeItem.update({ where: { id }, data: { isActive, updatedById } })
  },

  deleteProductTypeById(id: number) {
    return prisma.productTypeItem.update({ where: { id }, data: { deletedAt: new Date() } })
  },

  // Units
  findAllUnits(status: 'active' | 'all' = 'active') {
    return prisma.unit.findMany({
      where: status === 'active' ? { isActive: true, deletedAt: null } : { deletedAt: null },
      orderBy: { id: 'asc' },
      include: auditInclude,
    })
  },

  findUnitById(id: number) {
    return prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: auditInclude,
    })
  },

  findUnitByName(name: string) {
    return prisma.unit.findUnique({ where: { name } })
  },

  createUnit(data: { name: string; createdById?: number }) {
    return prisma.unit.create({ data })
  },

  updateUnit(id: number, data: { name: string; updatedById?: number }) {
    return prisma.unit.update({ where: { id }, data })
  },

  updateUnitStatus(id: number, isActive: boolean, updatedById?: number) {
    return prisma.unit.update({ where: { id }, data: { isActive, updatedById } })
  },

  deleteUnitById(id: number) {
    return prisma.unit.update({ where: { id }, data: { deletedAt: new Date() } })
  },

  // Categories
  findAllCategories(status: 'active' | 'all' = 'active') {
    return prisma.category.findMany({
      where: status === 'active' ? { isActive: true, deletedAt: null } : { deletedAt: null },
      orderBy: { id: 'asc' },
      include: auditInclude,
    })
  },

  findCategoryById(id: number) {
    return prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: auditInclude,
    })
  },

  findCategoryByName(name: string) {
    return prisma.category.findUnique({ where: { name } })
  },

  createCategory(data: { name: string; createdById?: number }) {
    return prisma.category.create({ data })
  },

  updateCategory(id: number, data: { name: string; updatedById?: number }) {
    return prisma.category.update({ where: { id }, data })
  },

  updateCategoryStatus(id: number, isActive: boolean, updatedById?: number) {
    return prisma.category.update({ where: { id }, data: { isActive, updatedById } })
  },

  deleteCategoryById(id: number) {
    return prisma.category.update({ where: { id }, data: { deletedAt: new Date() } })
  },
}
