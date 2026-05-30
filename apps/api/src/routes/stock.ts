import { Router } from 'express'
import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import validate from '../middleware/validate'
import { StockController } from '../controllers/stock.controller'

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

const historyQuerySchema = z.object({
  type: z.enum(['in', 'out', 'adjust', 'transfer']).optional(),
  productId: z.string().regex(/^\d+$/, 'productId must be a positive integer').optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
})

const stockCardQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  warehouseId: z.string().regex(/^\d+$/, 'warehouseId must be a positive integer').optional(),
})

const binStockQuerySchema = z.object({
  productId: z.string().regex(/^\d+$/, 'productId must be a positive integer'),
  binId: z.string().regex(/^\d+$/, 'binId must be a positive integer'),
})

const stockInSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  warehouseId: z.number().int().positive().optional(),
  binId: z.number().int().positive().optional(),
})

const stockOutSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  warehouseId: z.number().int().positive().optional(),
  binId: z.number().int().positive().optional(),
})

router.post(
  '/in',
  authenticate,
  requireRole('staff', 'manager', 'admin'),
  validate(stockInSchema),
  StockController.stockIn
)

const stockAdjustSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(0),
  reason: z.string().optional(),
  note: z.string().optional(),
  warehouseId: z.number().int().positive().optional(),
})

const stockTransferSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  fromLocation: z.string().min(1),
  toLocation: z.string().min(1),
  note: z.string().optional(),
  fromWarehouseId: z.number().int().positive().optional(),
  toWarehouseId: z.number().int().positive().optional(),
  binId: z.number().int().positive().optional(),
  toBinId: z.number().int().positive().optional(),
})

router.post(
  '/out',
  authenticate,
  requireRole('staff', 'manager', 'admin'),
  validate(stockOutSchema),
  StockController.stockOut
)

router.get(
  '/history',
  authenticate,
  validateQuery(historyQuerySchema),
  StockController.stockHistory
)
router.get(
  '/card/:productId',
  authenticate,
  validateQuery(stockCardQuerySchema),
  StockController.stockCard
)
router.get('/low-alert', authenticate, StockController.stockLowAlert)
router.get(
  '/bin-stock',
  authenticate,
  validateQuery(binStockQuerySchema),
  StockController.stockBinStock
)

router.post(
  '/adjust',
  authenticate,
  requireRole('manager', 'admin'),
  validate(stockAdjustSchema),
  StockController.stockAdjust
)

router.post(
  '/transfer',
  authenticate,
  requireRole('manager', 'admin'),
  validate(stockTransferSchema),
  StockController.stockTransfer
)

export default router
