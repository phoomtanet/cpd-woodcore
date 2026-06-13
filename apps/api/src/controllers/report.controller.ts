import type { Request, Response, NextFunction } from 'express'
import { ReportService } from '../services/report.service'
import type { TxType } from '@prisma/client'

export const ReportController = {
  async balance(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, productType, categoryId, warehouseId, status, asOf } = req.query
      const result = await ReportService.getBalance({
        search: typeof search === 'string' ? search : undefined,
        productType: typeof productType === 'string' ? productType : undefined,
        categoryId: typeof categoryId === 'string' ? Number(categoryId) : undefined,
        warehouseId: typeof warehouseId === 'string' ? Number(warehouseId) : undefined,
        status:
          status === 'active' || status === 'inactive' || status === 'all' ? status : undefined,
        asOf: typeof asOf === 'string' ? asOf : undefined,
      })
      res.json({ data: result, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async movement(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, productId, warehouseId, from, to } = req.query
      const result = await ReportService.getMovement({
        type: typeof type === 'string' ? (type as TxType) : undefined,
        productId: typeof productId === 'string' ? Number(productId) : undefined,
        warehouseId: typeof warehouseId === 'string' ? Number(warehouseId) : undefined,
        from: typeof from === 'string' ? from : undefined,
        to: typeof to === 'string' ? to : undefined,
      })
      res.json({ data: result, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
