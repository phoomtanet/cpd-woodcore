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
}
