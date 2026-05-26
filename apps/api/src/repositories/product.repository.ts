import prisma from '@cpd/db'
import type { Prisma } from '@prisma/client'

export const ProductRepository = {
  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data })
  },
}
