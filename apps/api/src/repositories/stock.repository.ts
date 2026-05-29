import prisma from '@cpd/db'
import type { TxType, Product } from '@prisma/client'

export const StockRepository = {
  findProductStock(productId: number, warehouseId: number) {
    return prisma.productStock.findFirst({ where: { productId, warehouseId } })
  },

  async stockIn(
    productId: number,
    quantity: number,
    userId: number,
    note?: string,
    warehouseId = 1,
    binId?: number
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.productStock.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        update: { quantity: { increment: quantity } },
        create: { productId, warehouseId, quantity },
      })
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: quantity } },
      })
      return tx.stockTransaction.create({
        data: { productId, type: 'in', quantity, note, userId, warehouseId, binId },
        include: { product: true },
      })
    })
  },

  async stockOut(
    productId: number,
    quantity: number,
    userId: number,
    note?: string,
    warehouseId = 1,
    binId?: number
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.productStock.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data: { quantity: { decrement: quantity } },
      })
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { decrement: quantity } },
      })
      return tx.stockTransaction.create({
        data: { productId, type: 'out', quantity, note, userId, warehouseId, binId },
        include: { product: true },
      })
    })
  },

  async stockAdjust(
    productId: number,
    newQuantity: number,
    userId: number,
    reason?: string,
    note?: string,
    warehouseId = 1
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.productStock.findFirst({ where: { productId, warehouseId } })
      const delta = newQuantity - (current?.quantity ?? 0)
      await tx.productStock.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        update: { quantity: newQuantity },
        create: { productId, warehouseId, quantity: newQuantity },
      })
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: delta } },
      })
      return tx.stockTransaction.create({
        data: {
          productId,
          type: 'adjust',
          quantity: newQuantity,
          reason,
          note,
          userId,
          warehouseId,
        },
        include: { product: true },
      })
    })
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
    return prisma.$transaction(async (tx) => {
      if (fromWarehouseId !== toWarehouseId) {
        await tx.productStock.update({
          where: { productId_warehouseId: { productId, warehouseId: fromWarehouseId } },
          data: { quantity: { decrement: quantity } },
        })
        await tx.productStock.upsert({
          where: { productId_warehouseId: { productId, warehouseId: toWarehouseId } },
          update: { quantity: { increment: quantity } },
          create: { productId, warehouseId: toWarehouseId, quantity },
        })
      }
      return tx.stockTransaction.create({
        data: {
          productId,
          type: 'transfer',
          quantity,
          fromLocation,
          toLocation,
          note,
          userId,
          warehouseId: fromWarehouseId,
          toWarehouseId,
          binId,
          toBinId,
        },
        include: { product: true },
      })
    })
  },

  findTransactionsByProduct(productId: number, from?: Date, to?: Date, warehouseId?: number) {
    return prisma.stockTransaction.findMany({
      where: {
        productId,
        ...(warehouseId && { warehouseId }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }),
      },
      include: { product: true, createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    })
  },

  findLowStock(): Promise<Product[]> {
    return prisma.$queryRaw<Product[]>`
      SELECT p.id, p.name, p.sku, p.barcode, p.image,
             p."categoryId", p."productType", p.unit,
             p."costPrice", p."salePrice", p."minStock", p."isActive",
             p."createdAt", p."updatedAt", p."deletedAt",
             COALESCE(SUM(ps.quantity), 0)::integer AS "currentStock"
      FROM "Product" p
      LEFT JOIN "ProductStock" ps ON ps."productId" = p.id
      WHERE p."deletedAt" IS NULL AND p."isActive" = true
      GROUP BY p.id
      HAVING COALESCE(SUM(ps.quantity), 0) < p."minStock"
      ORDER BY (p."minStock" - COALESCE(SUM(ps.quantity), 0)) DESC
    `
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
