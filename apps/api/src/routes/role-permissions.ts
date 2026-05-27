import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate'
import { authenticate, requireRole } from '../middleware/auth'
import { RolePermissionController } from '../controllers/role-permission.controller'

const router = Router()

const updatePermissionSchema = z.object({
  canView: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
})

// GET /api/role-permissions — admin only (all roles)
router.get('/', authenticate, requireRole('admin'), RolePermissionController.list)

// GET /api/role-permissions/:role — any authenticated user (load own role's config)
router.get('/:role', authenticate, RolePermissionController.listByRole)

// PUT /api/role-permissions/:role/:menuKey — admin only
router.put(
  '/:role/:menuKey',
  authenticate,
  requireRole('admin'),
  validate(updatePermissionSchema),
  RolePermissionController.update
)

export default router
