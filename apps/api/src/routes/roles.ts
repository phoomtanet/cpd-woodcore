import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate'
import { authenticate, requireRole } from '../middleware/auth'
import { RoleController } from '../controllers/role.controller'

const router = Router()

const createRoleSchema = z.object({
  name: z.string({ error: 'Required' }).min(1),
  label: z.string({ error: 'Required' }).min(1),
})

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
})

// GET /api/roles — any authenticated user
router.get('/', authenticate, RoleController.list)

// POST /api/roles — admin only
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  validate(createRoleSchema),
  RoleController.create
)

// PUT /api/roles/:id — admin only
router.put(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate(updateRoleSchema),
  RoleController.update
)

// DELETE /api/roles/:id — admin only
router.delete('/:id', authenticate, requireRole('admin'), RoleController.remove)

export default router
