import type { Request, Response, NextFunction } from 'express'
import { ReportService } from '../services/report.service'

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
}
