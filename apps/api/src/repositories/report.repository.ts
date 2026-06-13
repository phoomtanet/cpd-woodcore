import prisma from '@cpd/db'

export const ReportRepository = {
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
