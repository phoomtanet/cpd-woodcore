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

  async movementTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId, binId, days } = req.query
      const result = await DashboardService.getMovementTrend(
        { warehouseId: toNumber(warehouseId), binId: toNumber(binId) },
        toNumber(days) ?? 30
      )
      res.json({ data: result, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async valueBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId, binId, by } = req.query
      const result = await DashboardService.getValueBreakdown(
        { warehouseId: toNumber(warehouseId), binId: toNumber(binId) },
        by === 'category' ? 'category' : 'type'
      )
      res.json({ data: result, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
