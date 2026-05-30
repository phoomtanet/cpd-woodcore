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
      const item = await MasterService.createProductType(req.body, req.user!.userId)
      res.status(201).json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateProductType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.updateProductType(
        Number(req.params.id),
        req.body,
        req.user!.userId
      )
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateProductTypeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.toggleProductTypeStatus(
        Number(req.params.id),
        req.body.isActive,
        req.user!.userId
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
      const item = await MasterService.createUnit(req.body, req.user!.userId)
      res.status(201).json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateUnit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.updateUnit(Number(req.params.id), req.body, req.user!.userId)
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateUnitStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.toggleUnitStatus(
        Number(req.params.id),
        req.body.isActive,
        req.user!.userId
      )
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
      const item = await MasterService.createCategory(req.body, req.user!.userId)
      res.status(201).json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.updateCategory(
        Number(req.params.id),
        req.body,
        req.user!.userId
      )
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateCategoryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.toggleCategoryStatus(
        Number(req.params.id),
        req.body.isActive,
        req.user!.userId
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

  // Warehouses
  async listWarehouses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status === 'all' ? 'all' : 'active'
      const data = await MasterService.findAllWarehouses(status)
      res.json({ data, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async createWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.createWarehouse(req.body, req.user!.userId)
      res.status(201).json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.updateWarehouse(
        Number(req.params.id),
        req.body,
        req.user!.userId
      )
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateWarehouseStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.toggleWarehouseStatus(
        Number(req.params.id),
        req.body.isActive,
        req.user!.userId
      )
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async removeWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MasterService.deleteWarehouseById(Number(req.params.id))
      res.json({ data: null, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  // Bin Locations
  async listBins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status === 'all' ? 'all' : 'active'
      const data = await MasterService.findBinsByWarehouse(Number(req.params.id), status)
      res.json({ data, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async createBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.createBin(req.body, req.user!.userId)
      res.status(201).json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.updateBin(Number(req.params.id), req.body, req.user!.userId)
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateBinStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await MasterService.toggleBinStatus(
        Number(req.params.id),
        req.body.isActive,
        req.user!.userId
      )
      res.json({ data: item, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async removeBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MasterService.deleteBinById(Number(req.params.id))
      res.json({ data: null, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
