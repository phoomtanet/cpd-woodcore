import { StockRepository } from '../repositories/stock.repository'
import { ProductRepository } from '../repositories/product.repository'
import { NotFoundError, BadRequestError } from '../utils/errors'
import type { TxType } from '@prisma/client'

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

  async stockAdjust(
    productId: number,
    newQuantity: number,
    userId: number,
    reason?: string,
    note?: string
  ) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    const [, transaction] = await StockRepository.stockAdjust(
      productId,
      newQuantity,
      userId,
      reason,
      note
    )
    return transaction
  },

  async stockTransfer(
    productId: number,
    quantity: number,
    fromLocation: string,
    toLocation: string,
    userId: number,
    note?: string
  ) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    if (product.currentStock < quantity)
      throw new BadRequestError(
        `Insufficient stock: available ${product.currentStock}, requested ${quantity}`
      )
    const [transaction] = await StockRepository.stockTransfer(
      productId,
      quantity,
      fromLocation,
      toLocation,
      userId,
      note
    )
    return transaction
  },

  async getHistory(params: { type?: TxType; productId?: number; from?: string; to?: string }) {
    return StockRepository.findHistory({
      type: params.type,
      productId: params.productId,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
    })
  },

  async getStockCard(productId: number) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')

    const transactions = await StockRepository.findTransactionsByProduct(productId)

    let balance = 0
    const rows = transactions.map((tx) => {
      if (tx.type === 'in') balance += tx.quantity
      else if (tx.type === 'out') balance -= tx.quantity
      else if (tx.type === 'adjust') balance = tx.quantity
      // transfer: balance unchanged
      return { ...tx, balance }
    })

    return { product, transactions: rows }
  },
}
