import { StockRepository } from '../repositories/stock.repository'
import { ProductRepository } from '../repositories/product.repository'
import { NotFoundError, BadRequestError } from '../utils/errors'

export const StockService = {
  async stockIn(productId: number, quantity: number, userId: number, note?: string) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    const [, transaction] = await StockRepository.stockIn(productId, quantity, userId, note)
    return transaction
  },

  async stockOut(productId: number, quantity: number, userId: number, note?: string) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    if (product.currentStock < quantity)
      throw new BadRequestError(
        `Insufficient stock: available ${product.currentStock}, requested ${quantity}`
      )
    const [, transaction] = await StockRepository.stockOut(productId, quantity, userId, note)
    return transaction
  },
}
