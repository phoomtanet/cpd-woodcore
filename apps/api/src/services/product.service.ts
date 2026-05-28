import { ProductRepository, type ProductFilter } from '../repositories/product.repository'
import { NotFoundError, ConflictError } from '../utils/errors'
import type { Prisma } from '@prisma/client'

export interface CreateProductDto {
  name: string
  sku: string
  unit: string
  productType?: 'raw' | 'wip' | 'finished'
  costPrice: number
  salePrice: number
  barcode?: string
  category?: string
  minStock?: number
}

export type UpdateProductDto = Partial<CreateProductDto>

export const ProductService = {
  findAll(filter: ProductFilter = {}) {
    return ProductRepository.findAll(filter)
  },

  async findById(id: number) {
    const product = await ProductRepository.findById(id)
    if (!product) throw new NotFoundError('Product not found')
    return product
  },

  async create(dto: CreateProductDto) {
    const existing = await ProductRepository.findBySku(dto.sku)
    if (existing) throw new ConflictError('SKU already exists')
    return ProductRepository.create(dto as Prisma.ProductCreateInput)
  },

  async update(id: number, dto: UpdateProductDto) {
    const product = await ProductRepository.findById(id)
    if (!product) throw new NotFoundError('Product not found')
    if (dto.sku && dto.sku !== product.sku) {
      const existing = await ProductRepository.findBySku(dto.sku)
      if (existing) throw new ConflictError('SKU already exists')
    }
    return ProductRepository.update(id, dto as Prisma.ProductUpdateInput)
  },

  async updateImage(id: number, imageUrl: string) {
    const product = await ProductRepository.findById(id)
    if (!product) throw new NotFoundError('Product not found')
    return ProductRepository.update(id, { image: imageUrl })
  },

  async toggleStatus(id: number, isActive: boolean) {
    const product = await ProductRepository.findById(id)
    if (!product) throw new NotFoundError('Product not found')
    return ProductRepository.updateStatus(id, isActive)
  },

  async deleteById(id: number) {
    const product = await ProductRepository.findById(id)
    if (!product) throw new NotFoundError('Product not found')
    return ProductRepository.deleteById(id)
  },
}
