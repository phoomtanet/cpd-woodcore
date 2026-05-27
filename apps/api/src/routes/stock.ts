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

const stockOutSchema = z.object({
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

const stockAdjustSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(0),
  reason: z.string().optional(),
  note: z.string().optional(),
})

const stockTransferSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  fromLocation: z.string().min(1),
  toLocation: z.string().min(1),
  note: z.string().optional(),
})

router.post(
  '/out',
  authenticate,
  requireRole('staff', 'manager', 'admin'),
  validate(stockOutSchema),
  StockController.stockOut
)

router.get('/card/:productId', authenticate, StockController.stockCard)

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
