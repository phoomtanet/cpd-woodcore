import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '@cpd/db'
import validate from '../middleware/validate'

const router = Router()

const loginSchema = z.object({
  email: z.string({ error: 'Required' }).email('Invalid email format'),
  password: z.string({ error: 'Required' }).min(1),
})

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET ?? '', {
      expiresIn: '7d',
    })

    res.json({
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      message: 'ok',
    })
  } catch (err) {
    next(err)
  }
})

export default router
