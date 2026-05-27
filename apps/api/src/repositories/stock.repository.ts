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

  async stockAdjust(
    productId: number,
    newQuantity: number,
    userId: number,
    reason?: string,
    note?: string
  ) {
    return prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { currentStock: newQuantity },
      }),
      prisma.stockTransaction.create({
        data: { productId, type: 'adjust', quantity: newQuantity, reason, note, userId },
        include: { product: true },
      }),
    ])
  },

  async stockTransfer(
    productId: number,
    quantity: number,
    fromLocation: string,
    toLocation: string,
    userId: number,
    note?: string
  ) {
    return prisma.$transaction([
      prisma.stockTransaction.create({
        data: { productId, type: 'transfer', quantity, fromLocation, toLocation, note, userId },
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

  findHistory({
    type,
    productId,
    from,
    to,
  }: {
    type?: TxType
    productId?: number
    from?: Date
    to?: Date
  }) {
    return prisma.stockTransaction.findMany({
      where: {
        ...(type && { type }),
        ...(productId && { productId }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }),
      },
      include: { product: true, createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  },
}
