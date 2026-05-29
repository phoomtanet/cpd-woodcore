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

const categorySchema = z.object({
  name: z.string({ error: 'Required' }).min(1),
})

// Categories
router.get('/categories', authenticate, MasterController.listCategories)
router.post(
  '/categories',
  authenticate,
  requireRole('admin'),
  validate(categorySchema),
  MasterController.createCategory
)
router.put(
  '/categories/:id',
  authenticate,
  requireRole('admin'),
  validate(categorySchema),
  MasterController.updateCategory
)
router.patch(
  '/categories/:id/status',
  authenticate,
  requireRole('admin'),
  validate(statusSchema),
  MasterController.updateCategoryStatus
)
router.delete(
  '/categories/:id',
  authenticate,
  requireRole('admin'),
  MasterController.removeCategory
)

const warehouseSchema = z.object({
  code: z.string({ error: 'Required' }).min(1),
  name: z.string({ error: 'Required' }).min(1),
  shortName: z.string().optional(),
  address: z.string().optional(),
})

const warehouseUpdateSchema = warehouseSchema.partial()

const binSchema = z.object({
  warehouseId: z.number({ error: 'Required' }).int().positive(),
  code: z.string({ error: 'Required' }).min(1),
  name: z.string().optional(),
})

const binUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().optional(),
})

// Warehouses
router.get('/warehouses', authenticate, MasterController.listWarehouses)
router.post(
  '/warehouses',
  authenticate,
  requireRole('admin'),
  validate(warehouseSchema),
  MasterController.createWarehouse
)
router.put(
  '/warehouses/:id',
  authenticate,
  requireRole('admin'),
  validate(warehouseUpdateSchema),
  MasterController.updateWarehouse
)
router.patch(
  '/warehouses/:id/status',
  authenticate,
  requireRole('admin'),
  validate(statusSchema),
  MasterController.updateWarehouseStatus
)
router.delete(
  '/warehouses/:id',
  authenticate,
  requireRole('admin'),
  MasterController.removeWarehouse
)

// Bin Locations — list nested under warehouse, CRUD standalone
router.get('/warehouses/:id/bins', authenticate, MasterController.listBins)
router.post(
  '/bin-locations',
  authenticate,
  requireRole('admin'),
  validate(binSchema),
  MasterController.createBin
)
router.put(
  '/bin-locations/:id',
  authenticate,
  requireRole('admin'),
  validate(binUpdateSchema),
  MasterController.updateBin
)
router.patch(
  '/bin-locations/:id/status',
  authenticate,
  requireRole('admin'),
  validate(statusSchema),
  MasterController.updateBinStatus
)
router.delete('/bin-locations/:id', authenticate, requireRole('admin'), MasterController.removeBin)

export default router
