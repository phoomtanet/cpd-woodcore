import type { Request, Response, NextFunction } from 'express'
import { StockService } from '../services/stock.service'

export const StockController = {
  async stockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, note } = req.body as {
        productId: number
        quantity: number
        note?: string
      }
      const transaction = await StockService.stockIn(productId, quantity, req.user!.userId, note)
      res.status(201).json({ data: transaction, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async stockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, note } = req.body as {
        productId: number
        quantity: number
        note?: string
      }
      const transaction = await StockService.stockOut(productId, quantity, req.user!.userId, note)
      res.status(201).json({ data: transaction, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async stockAdjust(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, reason, note } = req.body as {
        productId: number
        quantity: number
        reason?: string
        note?: string
      }
      const transaction = await StockService.stockAdjust(
        productId,
        quantity,
        req.user!.userId,
        reason,
        note
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
      const result = await StockService.getStockCard(Number(req.params.productId))
      res.json({ data: result, message: 'ok' })
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
      const { productId, quantity, fromLocation, toLocation, note } = req.body as {
        productId: number
        quantity: number
        fromLocation: string
        toLocation: string
        note?: string
      }
      const transaction = await StockService.stockTransfer(
        productId,
        quantity,
        fromLocation,
        toLocation,
        req.user!.userId,
        note
      )
      res.status(201).json({ data: transaction, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
