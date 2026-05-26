import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate'
import { authenticate, requireRole } from '../middleware/auth'
import { ProductController } from '../controllers/product.controller'

const router = Router()

const createProductSchema = z.object({
  name: z.string({ error: 'Required' }).min(1),
  sku: z.string({ error: 'Required' }).min(1),
  unit: z.string({ error: 'Required' }).min(1),
  productType: z.enum(['raw', 'wip', 'finished']).default('raw'),
  costPrice: z.number({ error: 'Required' }).nonnegative(),
  salePrice: z.number({ error: 'Required' }).nonnegative(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  minStock: z.number().int().nonnegative().default(0),
})

router.post(
  '/',
  authenticate,
  requireRole('manager', 'admin'),
  validate(createProductSchema),
  ProductController.create
)

export default router
