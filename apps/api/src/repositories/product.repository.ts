import prisma from '@cpd/db'
import type { Prisma } from '@prisma/client'

export interface ProductFilter {
  search?: string
  productType?: string
  categoryId?: number
  status?: 'active' | 'inactive' | 'all'
}

export const ProductRepository = {
  findAll({ search, productType, categoryId, status = 'active' }: ProductFilter = {}) {
    const isActiveFilter = status === 'active' ? true : status === 'inactive' ? false : undefined
    return prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(isActiveFilter !== undefined && { isActive: isActiveFilter }),
        ...(productType && { productType }),
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findById(id: number) {
    return prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    })
  },

  findBySku(sku: string) {
    return prisma.product.findFirst({ where: { sku, deletedAt: null } })
  },

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data })
  },

  update(id: number, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data })
  },

  updateStatus(id: number, isActive: boolean) {
    return prisma.product.update({ where: { id }, data: { isActive } })
  },

  deleteById(id: number) {
    return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } })
  },
}
