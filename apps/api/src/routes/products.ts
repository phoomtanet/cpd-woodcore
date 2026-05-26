import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate'
import { authenticate, requireRole } from '../middleware/auth'

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

// POST /api/products — manager+ only (full CRUD in Phase 3)
router.post(
  '/',
  authenticate,
  requireRole('manager', 'admin'),
  validate(createProductSchema),
  (_req, res) => {
    res.status(201).json({ data: null, message: 'ok' })
  }
)

export default router
