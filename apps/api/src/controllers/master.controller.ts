import type { Request, Response, NextFunction } from 'express'
import { MasterService } from '../services/master.service'

export const MasterController = {
  // Product Types
  async listProductTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status === 'all' ? 'all' : 'active'
      const data = await MasterService.findAllProductTypes(status)
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

  async updateProductTypeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.toggleProductTypeStatus(
        Number(req.params.id),
        req.body.isActive
      )
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
  async listUnits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status === 'all' ? 'all' : 'active'
      const data = await MasterService.findAllUnits(status)
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

  async updateUnitStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.toggleUnitStatus(Number(req.params.id), req.body.isActive)
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

  // Categories
  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status === 'all' ? 'all' : 'active'
      const data = await MasterService.findAllCategories(status)
      res.json({ data, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.createCategory(req.body)
      res.status(201).json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.updateCategory(Number(req.params.id), req.body)
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateCategoryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.toggleCategoryStatus(
        Number(req.params.id),
        req.body.isActive
      )
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async removeCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MasterService.deleteCategoryById(Number(req.params.id))
      res.json({ data: null, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  // SKU Prefixes
  async listSkuPrefixes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status === 'all' ? 'all' : 'active'
      const data = await MasterService.findAllSkuPrefixes(status)
      res.json({ data, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async createSkuPrefix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.createSkuPrefix(req.body)
      res.status(201).json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateSkuPrefix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.updateSkuPrefix(Number(req.params.id), req.body)
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateSkuPrefixStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.toggleSkuPrefixStatus(
        Number(req.params.id),
        req.body.isActive
      )
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async removeSkuPrefix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MasterService.deleteSkuPrefixById(Number(req.params.id))
      res.json({ data: null, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
