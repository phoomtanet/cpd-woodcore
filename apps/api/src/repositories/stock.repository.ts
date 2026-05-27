import prisma from '@cpd/db'
import type { TxType } from '@prisma/client'

export interface CreateStockTxInput {
  productId: number
  type: TxType
  quantity: number
  fromLocation?: string
  toLocation?: string
  reason?: string
  note?: string
  userId: number
}

export const StockRepository = {
  async stockIn(productId: number, quantity: number, userId: number, note?: string) {
    return prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { currentStock: { increment: quantity } },
      }),
      prisma.stockTransaction.create({
        data: { productId, type: 'in', quantity, note, userId },
        include: { product: true },
      }),
    ])
  },

  async stockOut(productId: number, quantity: number, userId: number, note?: string) {
    return prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { currentStock: { decrement: quantity } },
      }),
      prisma.stockTransaction.create({
        data: { productId, type: 'out', quantity, note, userId },
        include: { product: true },
      }),
    ])
  },

  findTransactionsByProduct(productId: number) {
    return prisma.stockTransaction.findMany({
      where: { productId },
      include: { product: true, createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    })
  },
}
