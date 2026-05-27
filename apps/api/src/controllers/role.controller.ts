import type { Request, Response, NextFunction } from 'express'
import { RoleService } from '../services/role.service'

export const RoleController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await RoleService.findAll()
      res.json({ data: roles, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await RoleService.create(req.body)
      res.status(201).json({ data: role, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await RoleService.update(Number(req.params.id), req.body)
      res.json({ data: role, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await RoleService.deleteById(Number(req.params.id))
      res.json({ data: null, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
