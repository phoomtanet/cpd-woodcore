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
    const locationOr = binId
      ? [{ binId }, { toBinId: binId }]
      : warehouseId
        ? [{ warehouseId }, { toWarehouseId: warehouseId }]
        : undefined
    return prisma.stockTransaction.findMany({
      where: { ...(locationOr && { OR: locationOr }) },
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
}
