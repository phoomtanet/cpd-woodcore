import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth'
import validate from '../middleware/validate'
import { StockController } from '../controllers/stock.controller'

const router = Router()

const stockInSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
})

router.post(
  '/in',
  authenticate,
  requireRole('staff', 'manager', 'admin'),
  validate(stockInSchema),
  StockController.stockIn
)

export default router
