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

const formatSchema = z.enum(['json', 'xlsx', 'csv']).optional()

const balanceQuerySchema = z.object({
  search: z.string().optional(),
  productType: z.string().optional(),
  categoryId: z.string().regex(/^\d+$/, 'categoryId must be a positive integer').optional(),
  warehouseId: z.string().regex(/^\d+$/, 'warehouseId must be a positive integer').optional(),
  binId: z.string().regex(/^\d+$/, 'binId must be a positive integer').optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  asOf: z.string().datetime({ offset: true }).optional(),
  format: formatSchema,
})

const movementQuerySchema = z.object({
  type: z.enum(['in', 'out', 'adjust', 'transfer']).optional(),
  productId: z.string().regex(/^\d+$/, 'productId must be a positive integer').optional(),
  warehouseId: z.string().regex(/^\d+$/, 'warehouseId must be a positive integer').optional(),
  binId: z.string().regex(/^\d+$/, 'binId must be a positive integer').optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  format: formatSchema,
})

router.get('/balance', authenticate, validateQuery(balanceQuerySchema), ReportController.balance)
router.get('/movement', authenticate, validateQuery(movementQuerySchema), ReportController.movement)

export default router
