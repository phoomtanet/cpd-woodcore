import type { Request, Response, NextFunction } from 'express'
import { RolePermissionService } from '../services/role-permission.service'

export const RolePermissionController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await RolePermissionService.getAll()
      res.json({ data: permissions, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async listByRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await RolePermissionService.getByRole(req.params.role)
      res.json({ data: permissions, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permission = await RolePermissionService.updatePermission(
        req.params.role,
        req.params.menuKey,
        req.body
      )
      res.json({ data: permission, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
