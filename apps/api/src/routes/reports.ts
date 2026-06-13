import { Router } from 'express'
import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/auth'
import { ReportController } from '../controllers/report.controller'

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

const balanceQuerySchema = z.object({
  search: z.string().optional(),
  productType: z.string().optional(),
  categoryId: z.string().regex(/^\d+$/, 'categoryId must be a positive integer').optional(),
  warehouseId: z.string().regex(/^\d+$/, 'warehouseId must be a positive integer').optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  asOf: z.string().datetime({ offset: true }).optional(),
})

router.get('/balance', authenticate, validateQuery(balanceQuerySchema), ReportController.balance)

export default router
