import prisma from '@cpd/db'
import type { TxType } from '@prisma/client'

export interface MovementFilter {
  type?: TxType
  productId?: number
  warehouseId?: number
  from?: Date
  to?: Date
}

export const ReportRepository = {
  // Pure query: movement transactions (in/out/adjust/transfer) with filters.
  findMovements({ type, productId, warehouseId, from, to }: MovementFilter) {
    return prisma.stockTransaction.findMany({
      where: {
        ...(type && { type }),
        ...(productId && { productId }),
        ...(warehouseId && { OR: [{ warehouseId }, { toWarehouseId: warehouseId }] }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }),
      },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        createdBy: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true, shortName: true } },
        toWarehouse: { select: { id: true, name: true, shortName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  // Pure query: all transactions up to (and including) a given date.
  // Used by the service to reconstruct per-warehouse balances as of that date.
  findTransactionsUpTo(asOf: Date, productIds?: number[]) {
    return prisma.stockTransaction.findMany({
      where: {
        createdAt: { lte: asOf },
        ...(productIds && productIds.length > 0 && { productId: { in: productIds } }),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        productId: true,
        type: true,
        quantity: true,
        warehouseId: true,
        toWarehouseId: true,
      },
    })
  },
}
