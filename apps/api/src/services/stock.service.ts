import { StockRepository } from '../repositories/stock.repository'
import { ProductRepository } from '../repositories/product.repository'
import { NotFoundError } from '../utils/errors'

export const StockService = {
  async stockIn(productId: number, quantity: number, userId: number, note?: string) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    const [, transaction] = await StockRepository.stockIn(productId, quantity, userId, note)
    return transaction
  },
}
