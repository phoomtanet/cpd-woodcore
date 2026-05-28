import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate'
import { authenticate, requireRole } from '../middleware/auth'
import { uploadProductImage } from '../middleware/upload'
import { ProductController } from '../controllers/product.controller'

const router = Router()

const createProductSchema = z.object({
  name: z.string({ error: 'Required' }).min(1),
  sku: z.string({ error: 'Required' }).min(1),
  unit: z.string({ error: 'Required' }).min(1),
  productType: z.string().min(1).default('raw'),
  costPrice: z.number({ error: 'Required' }).nonnegative(),
  salePrice: z.number({ error: 'Required' }).nonnegative(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  minStock: z.number().int().nonnegative().default(0),
})

const updateProductSchema = createProductSchema.partial()
const statusSchema = z.object({ isActive: z.boolean({ error: 'Required' }) })

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
router.patch(
  '/:id/status',
  authenticate,
  requireRole('manager', 'admin'),
  validate(statusSchema),
  ProductController.updateStatus
)
router.delete('/:id', authenticate, requireRole('admin'), ProductController.remove)

router.post(
  '/:id/image',
  authenticate,
  requireRole('manager', 'admin'),
  (req: Request, res: Response, next: NextFunction) =>
    uploadProductImage(req, res, (err) => {
      if (err instanceof Error) {
        if (err.message === 'Only image files are allowed')
          return res.status(400).json({ error: err.message })
        if ((err as NodeJS.ErrnoException).code === 'LIMIT_FILE_SIZE')
          return res.status(400).json({ error: 'File too large (max 5MB)' })
        return next(err)
      }
      next()
    }),
  ProductController.uploadImage
)

export default router
