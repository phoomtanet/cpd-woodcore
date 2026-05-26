import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate'
import { authenticate, requireRole } from '../middleware/auth'
import { UserController } from '../controllers/user.controller'

const router = Router()

const createUserSchema = z.object({
  name: z.string({ error: 'Required' }).min(1),
  email: z.string({ error: 'Required' }).email('Invalid email'),
  password: z.string({ error: 'Required' }).min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'staff']).default('staff'),
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'manager', 'staff']).optional(),
  isActive: z.boolean().optional(),
})

router.use(authenticate, requireRole('admin'))

router.get('/', UserController.list)
router.post('/', validate(createUserSchema), UserController.create)
router.put('/:id', validate(updateUserSchema), UserController.update)
router.delete('/:id', UserController.remove)

export default router
