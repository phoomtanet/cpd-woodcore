import { ProductRepository } from '../repositories/product.repository'
import type { Prisma } from '@prisma/client'

export const ProductService = {
  create(data: Prisma.ProductCreateInput) {
    return ProductRepository.create(data)
  },
}
