import { Router } from 'express'
import { z } from 'zod'
import validate from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { AuthController } from '../controllers/auth.controller'

const router = Router()

const loginSchema = z.object({
  email: z.string({ error: 'Required' }).email('Invalid email format'),
  password: z.string({ error: 'Required' }).min(1),
})

router.post('/login', validate(loginSchema), AuthController.login)
router.get('/me', authenticate, AuthController.me)

export default router
