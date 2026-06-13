import { Router } from 'express'
import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/auth'
import { DashboardController } from '../controllers/dashboard.controller'

const router = Router()

function validateQuery(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query)
      next()
    } catch (err) {
      next(err)
    }
  }
}

const intParam = (label: string) =>
  z.string().regex(/^\d+$/, `${label} must be a positive integer`).optional()

const summaryQuerySchema = z.object({
  warehouseId: intParam('warehouseId'),
  binId: intParam('binId'),
})

const recentQuerySchema = z.object({
  warehouseId: intParam('warehouseId'),
  binId: intParam('binId'),
  limit: intParam('limit'),
})

const trendQuerySchema = z.object({
  warehouseId: intParam('warehouseId'),
  binId: intParam('binId'),
  days: intParam('days'),
})

const breakdownQuerySchema = z.object({
  warehouseId: intParam('warehouseId'),
  binId: intParam('binId'),
  by: z.enum(['type', 'category']).optional(),
})

router.get('/summary', authenticate, validateQuery(summaryQuerySchema), DashboardController.summary)
router.get(
  '/recent-transactions',
  authenticate,
  validateQuery(recentQuerySchema),
  DashboardController.recentTransactions
)
router.get(
  '/movement-trend',
  authenticate,
  validateQuery(trendQuerySchema),
  DashboardController.movementTrend
)
router.get(
  '/value-breakdown',
  authenticate,
  validateQuery(breakdownQuerySchema),
  DashboardController.valueBreakdown
)

export default router
