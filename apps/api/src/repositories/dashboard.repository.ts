import prisma from '@cpd/db'

export interface RecentTxFilter {
  warehouseId?: number
  binId?: number
  limit?: number
}

export const DashboardRepository = {
  // Count of active (non-deleted) warehouses.
  countActiveWarehouses(): Promise<number> {
    return prisma.warehouse.count({ where: { isActive: true, deletedAt: null } })
  },

  // Latest transactions, optionally scoped to a warehouse / bin. binId takes
  // precedence over warehouseId for the location filter (matches reports).
  findRecentTransactions({ warehouseId, binId, limit = 10 }: RecentTxFilter) {
    return prisma.stockTransaction.findMany({
      where: {
        ...(locationWhere(warehouseId, binId) && { OR: locationWhere(warehouseId, binId) }),
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
      take: limit,
    })
  },

  // Transactions from `from` onward, scoped to warehouse / bin — used to build
  // the daily movement trend (aggregated in the service).
  findTransactionsFrom(from: Date, { warehouseId, binId }: RecentTxFilter) {
    const or = locationWhere(warehouseId, binId)
    return prisma.stockTransaction.findMany({
      where: {
        createdAt: { gte: from },
        ...(or && { OR: or }),
      },
      select: { createdAt: true, type: true, quantity: true },
      orderBy: { createdAt: 'asc' },
    })
  },
}

// binId takes precedence over warehouseId for the location OR filter.
function locationWhere(warehouseId?: number, binId?: number) {
  if (binId) return [{ binId }, { toBinId: binId }]
  if (warehouseId) return [{ warehouseId }, { toWarehouseId: warehouseId }]
  return undefined
}
