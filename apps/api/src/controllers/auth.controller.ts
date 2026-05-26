import type { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string }
      const data = await AuthService.login(email, password)
      res.json({ data, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getMe(req.user!.userId)
      res.json({ data: user, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
