import prisma from '@cpd/db'
import type { Prisma, ProductType } from '@prisma/client'

export interface ProductFilter {
  search?: string
  productType?: ProductType
}

export const ProductRepository = {
  findAll({ search, productType }: ProductFilter = {}) {
    return prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(productType && { productType }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  findById(id: number) {
    return prisma.product.findFirst({ where: { id, deletedAt: null } })
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

  deleteById(id: number) {
    return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } })
  },
}
