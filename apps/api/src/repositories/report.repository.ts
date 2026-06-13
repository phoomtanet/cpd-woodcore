import prisma from '@cpd/db'
import type { TxType } from '@prisma/client'

export interface MovementFilter {
  type?: TxType
  productId?: number
  warehouseId?: number
  binId?: number
  from?: Date
  to?: Date
}

export const ReportRepository = {
  // Pure query: movement transactions (in/out/adjust/transfer) with filters.
  findMovements({ type, productId, warehouseId, binId, from, to }: MovementFilter) {
    // binId takes precedence over warehouseId for the OR location filter.
    const locationOr = binId
      ? [{ binId }, { toBinId: binId }]
      : warehouseId
        ? [{ warehouseId }, { toWarehouseId: warehouseId }]
        : undefined
    return prisma.stockTransaction.findMany({
      where: {
        ...(type && { type }),
        ...(productId && { productId }),
        ...(locationOr && { OR: locationOr }),
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
        bin: { select: { id: true, code: true, name: true } },
        tobin: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  // Pure query: transactions up to (and including) a given date — or all
  // transactions when asOf is omitted. Used by the service to reconstruct
  // per-warehouse / per-bin balances.
  findTransactionsUpTo(asOf: Date | undefined, productIds?: number[]) {
    return prisma.stockTransaction.findMany({
      where: {
        ...(asOf && { createdAt: { lte: asOf } }),
        ...(productIds && productIds.length > 0 && { productId: { in: productIds } }),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        productId: true,
        type: true,
        quantity: true,
        warehouseId: true,
        toWarehouseId: true,
        binId: true,
        toBinId: true,
      },
    })
  },
}
