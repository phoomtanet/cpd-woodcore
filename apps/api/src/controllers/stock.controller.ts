import type { Request, Response, NextFunction } from 'express'
import { StockService } from '../services/stock.service'

export const StockController = {
  async stockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, note, warehouseId, binId } = req.body as {
        productId: number
        quantity: number
        note?: string
        warehouseId?: number
        binId?: number
      }
      const transaction = await StockService.stockIn(
        productId,
        quantity,
        req.user!.userId,
        note,
        warehouseId,
        binId
      )
      res.status(201).json({ data: transaction, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async stockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, note, warehouseId, binId } = req.body as {
        productId: number
        quantity: number
        note?: string
        warehouseId?: number
        binId?: number
      }
      const transaction = await StockService.stockOut(
        productId,
        quantity,
        req.user!.userId,
        note,
        warehouseId,
        binId
      )
      res.status(201).json({ data: transaction, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async stockAdjust(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, reason, note, warehouseId } = req.body as {
        productId: number
        quantity: number
        reason?: string
        note?: string
        warehouseId?: number
      }
      const transaction = await StockService.stockAdjust(
        productId,
        quantity,
        req.user!.userId,
        reason,
        note,
        warehouseId
      )
      res.status(201).json({ data: transaction, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async stockHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, productId, from, to } = req.query
      const transactions = await StockService.getHistory({
        type:
          typeof type === 'string'
            ? (type as Parameters<typeof StockService.getHistory>[0]['type'])
            : undefined,
        productId: typeof productId === 'string' ? Number(productId) : undefined,
        from: typeof from === 'string' ? from : undefined,
        to: typeof to === 'string' ? to : undefined,
      })
      res.json({ data: transactions, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async stockCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, order, warehouseId, binId } = req.query
      const result = await StockService.getStockCard(
        Number(req.params.productId),
        typeof from === 'string' ? from : undefined,
        typeof to === 'string' ? to : undefined,
        order === 'asc' ? 'asc' : 'desc',
        typeof warehouseId === 'string' ? Number(warehouseId) : undefined,
        typeof binId === 'string' ? Number(binId) : undefined
      )
      res.json({ data: result, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async stockBinStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, binId } = req.query
      const quantity = await StockService.getBinStock(Number(productId), Number(binId))
      res.json({ data: quantity, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async stockLowAlert(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await StockService.getLowAlert()
      res.json({ data: products, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async stockTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        productId,
        quantity,
        fromLocation,
        toLocation,
        note,
        fromWarehouseId,
        toWarehouseId,
        binId,
        toBinId,
      } = req.body as {
        productId: number
        quantity: number
        fromLocation: string
        toLocation: string
        note?: string
        fromWarehouseId?: number
        toWarehouseId?: number
        binId?: number
        toBinId?: number
      }
      const transaction = await StockService.stockTransfer(
        productId,
        quantity,
        fromLocation,
        toLocation,
        req.user!.userId,
        note,
        fromWarehouseId,
        toWarehouseId,
        binId,
        toBinId
      )
      res.status(201).json({ data: transaction, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
