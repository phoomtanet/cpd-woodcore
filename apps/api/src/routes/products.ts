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

const updateProductSchema = createProductSchema.partial()

router.get('/', authenticate, requireRole('manager', 'admin'), ProductController.list)
router.get('/:id', authenticate, requireRole('manager', 'admin'), ProductController.show)
router.post(
  '/',
  authenticate,
  requireRole('manager', 'admin'),
  validate(createProductSchema),
  ProductController.create
)
router.put(
  '/:id',
  authenticate,
  requireRole('manager', 'admin'),
  validate(updateProductSchema),
  ProductController.update
)
router.delete('/:id', authenticate, requireRole('admin'), ProductController.remove)

export default router
