import type { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/user.service'

export const UserController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.findAll()
      res.json({ data: users, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.create(req.body)
      res.status(201).json({ data: user, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.update(Number(req.params.id), req.body)
      res.json({ data: user, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await UserService.deleteById(Number(req.params.id))
      res.json({ data: null, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
