import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate'
import { authenticate, requireRole } from '../middleware/auth'
import { MasterController } from '../controllers/master.controller'

const router = Router()

const productTypeSchema = z.object({
  name: z.string({ error: 'Required' }).min(1),
  label: z.string({ error: 'Required' }).min(1),
})

const productTypeUpdateSchema = productTypeSchema.partial()

const unitSchema = z.object({
  name: z.string({ error: 'Required' }).min(1),
})
const statusSchema = z.object({ isActive: z.boolean({ error: 'Required' }) })

// Product Types
router.get('/product-types', authenticate, MasterController.listProductTypes)
router.post(
  '/product-types',
  authenticate,
  requireRole('admin'),
  validate(productTypeSchema),
  MasterController.createProductType
)
router.put(
  '/product-types/:id',
  authenticate,
  requireRole('admin'),
  validate(productTypeUpdateSchema),
  MasterController.updateProductType
)
router.patch(
  '/product-types/:id/status',
  authenticate,
  requireRole('admin'),
  validate(statusSchema),
  MasterController.updateProductTypeStatus
)
router.delete(
  '/product-types/:id',
  authenticate,
  requireRole('admin'),
  MasterController.removeProductType
)

// Units
router.get('/units', authenticate, MasterController.listUnits)
router.post(
  '/units',
  authenticate,
  requireRole('admin'),
  validate(unitSchema),
  MasterController.createUnit
)
router.put(
  '/units/:id',
  authenticate,
  requireRole('admin'),
  validate(unitSchema),
  MasterController.updateUnit
)
router.patch(
  '/units/:id/status',
  authenticate,
  requireRole('admin'),
  validate(statusSchema),
  MasterController.updateUnitStatus
)
router.delete('/units/:id', authenticate, requireRole('admin'), MasterController.removeUnit)

export default router
