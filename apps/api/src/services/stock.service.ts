import { StockRepository } from '../repositories/stock.repository'
import { ProductRepository } from '../repositories/product.repository'
import { NotFoundError, BadRequestError } from '../utils/errors'
import type { TxType } from '@prisma/client'

export const StockService = {
  async stockIn(
    productId: number,
    quantity: number,
    userId: number,
    note?: string,
    warehouseId = 1,
    binId?: number
  ) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    return StockRepository.stockIn(productId, quantity, userId, note, warehouseId, binId)
  },

  async stockOut(
    productId: number,
    quantity: number,
    userId: number,
    note?: string,
    warehouseId = 1,
    binId?: number
  ) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    const warehouseStock = await StockRepository.findProductStock(productId, warehouseId)
    const availableQty = warehouseStock ? warehouseStock.quantity : 0
    if (availableQty < quantity)
      throw new BadRequestError(
        `Insufficient stock: available ${availableQty}, requested ${quantity}`
      )
    return StockRepository.stockOut(productId, quantity, userId, note, warehouseId, binId)
  },

  async stockAdjust(
    productId: number,
    newQuantity: number,
    userId: number,
    reason?: string,
    note?: string,
    warehouseId = 1
  ) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    return StockRepository.stockAdjust(productId, newQuantity, userId, reason, note, warehouseId)
  },

  async stockTransfer(
    productId: number,
    quantity: number,
    fromLocation: string,
    toLocation: string,
    userId: number,
    note?: string,
    fromWarehouseId = 1,
    toWarehouseId = 1,
    binId?: number,
    toBinId?: number
  ) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    const warehouseStock = await StockRepository.findProductStock(productId, fromWarehouseId)
    const availableQty = warehouseStock ? warehouseStock.quantity : 0
    if (availableQty < quantity)
      throw new BadRequestError(
        `Insufficient stock: available ${availableQty}, requested ${quantity}`
      )
    return StockRepository.stockTransfer(
      productId,
      quantity,
      fromLocation,
      toLocation,
      userId,
      note,
      fromWarehouseId,
      toWarehouseId,
      binId,
      toBinId
    )
  },

  async getHistory(params: { type?: TxType; productId?: number; from?: string; to?: string }) {
    return StockRepository.findHistory({
      type: params.type,
      productId: params.productId,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
    })
  },

  async getLowAlert() {
    return StockRepository.findLowStock()
  },

  async getBinStock(productId: number, binId: number) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')
    return StockRepository.findBinStock(productId, binId)
  },

  async getStockCard(
    productId: number,
    from?: string,
    to?: string,
    order: 'asc' | 'desc' = 'desc',
    warehouseId?: number,
    binId?: number
  ) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Product not found')

    const transactions = await StockRepository.findTransactionsByProduct(
      productId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      warehouseId,
      binId
    )

    const costPrice = Number(product.costPrice)
    const salePrice = Number(product.salePrice)

    let balance = 0
    const rows = transactions.map((tx) => {
      if (tx.type === 'in') balance += tx.quantity
      else if (tx.type === 'out') balance -= tx.quantity
      else if (tx.type === 'adjust') balance = tx.quantity
      else if (tx.type === 'transfer') {
        if (binId != null) {
          // bin-scoped: out when leaving this bin, in when arriving
          if (tx.binId === binId) balance -= tx.quantity
          else if (tx.toBinId === binId) balance += tx.quantity
        } else if (warehouseId != null) {
          // warehouse-scoped: only count inter-warehouse moves
          if (tx.warehouseId === warehouseId && tx.toWarehouseId !== warehouseId)
            balance -= tx.quantity
          else if (tx.toWarehouseId === warehouseId && tx.warehouseId !== warehouseId)
            balance += tx.quantity
          // intra-warehouse bin transfer: unchanged
        }
        // no filter: total stock unchanged across all locations
      }
      return {
        ...tx,
        balance,
        costValue: tx.quantity * costPrice,
        saleValue: tx.quantity * salePrice,
      }
    })

    const totalCostValue = product.currentStock * costPrice
    const totalSaleValue = product.currentStock * salePrice

    return {
      product: { ...product, totalCostValue, totalSaleValue },
      transactions: order === 'desc' ? rows.reverse() : rows,
    }
  },
}
