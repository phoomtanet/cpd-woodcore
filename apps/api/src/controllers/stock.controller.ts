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
