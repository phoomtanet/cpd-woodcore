import type { Request, Response, NextFunction } from 'express'
import { MasterService } from '../services/master.service'

export const MasterController = {
  // Product Types
  async listProductTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MasterService.findAllProductTypes()
      res.json({ data, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async createProductType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.createProductType(req.body)
      res.status(201).json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateProductType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.updateProductType(Number(req.params.id), req.body)
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async removeProductType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MasterService.deleteProductTypeById(Number(req.params.id))
      res.json({ data: null, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  // Units
  async listUnits(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await MasterService.findAllUnits()
      res.json({ data, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async createUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.createUnit(req.body)
      res.status(201).json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.updateUnit(Number(req.params.id), req.body)
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async removeUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MasterService.deleteUnitById(Number(req.params.id))
      res.json({ data: null, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
