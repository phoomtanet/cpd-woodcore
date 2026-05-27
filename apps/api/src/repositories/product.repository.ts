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
    return prisma.product.findUnique({ where: { id } })
  },

  findBySku(sku: string) {
    return prisma.product.findUnique({ where: { sku } })
  },

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data })
  },

  update(id: number, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data })
  },

  deleteById(id: number) {
    return prisma.product.delete({ where: { id } })
  },
}
