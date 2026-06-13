import type { Request, Response, NextFunction } from 'express'
import { DashboardService } from '../services/dashboard.service'

function toNumber(value: unknown): number | undefined {
  return typeof value === 'string' ? Number(value) : undefined
}

export const DashboardController = {
  async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId, binId } = req.query
      const result = await DashboardService.getSummary({
        warehouseId: toNumber(warehouseId),
        binId: toNumber(binId),
      })
      res.json({ data: result, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async recentTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId, binId, limit } = req.query
      const result = await DashboardService.getRecentTransactions(
        { warehouseId: toNumber(warehouseId), binId: toNumber(binId) },
        toNumber(limit) ?? 10
      )
      res.json({ data: result, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
