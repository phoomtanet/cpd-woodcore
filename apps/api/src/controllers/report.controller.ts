import type { Request, Response, NextFunction } from 'express'
import { ReportService } from '../services/report.service'
import { ExportService } from '../services/export.service'
import type { TxType } from '@prisma/client'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function sendXlsx(res: Response, buffer: Buffer, filename: string) {
  const stamp = new Date().toISOString().slice(0, 10)
  res.setHeader('Content-Type', XLSX_MIME)
  res.setHeader('Content-Disposition', `attachment; filename="${filename}-${stamp}.xlsx"`)
  res.send(buffer)
}

function sendCsv(res: Response, csv: string, filename: string) {
  const stamp = new Date().toISOString().slice(0, 10)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}-${stamp}.csv"`)
  res.send(csv)
}

export const ReportController = {
  async balance(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, productType, categoryId, warehouseId, binId, status, asOf, format } =
        req.query
      const result = await ReportService.getBalance({
        search: typeof search === 'string' ? search : undefined,
        productType: typeof productType === 'string' ? productType : undefined,
        categoryId: typeof categoryId === 'string' ? Number(categoryId) : undefined,
        warehouseId: typeof warehouseId === 'string' ? Number(warehouseId) : undefined,
        binId: typeof binId === 'string' ? Number(binId) : undefined,
        status:
          status === 'active' || status === 'inactive' || status === 'all' ? status : undefined,
        asOf: typeof asOf === 'string' ? asOf : undefined,
      })
      if (format === 'xlsx') {
        const buffer = await ExportService.balanceToXlsx(result)
        return sendXlsx(res, buffer, 'stock-balance')
      }
      if (format === 'csv') {
        return sendCsv(res, ExportService.balanceToCsv(result), 'stock-balance')
      }
      res.json({ data: result, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async movement(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, productId, warehouseId, binId, from, to, format } = req.query
      const result = await ReportService.getMovement({
        type: typeof type === 'string' ? (type as TxType) : undefined,
        productId: typeof productId === 'string' ? Number(productId) : undefined,
        warehouseId: typeof warehouseId === 'string' ? Number(warehouseId) : undefined,
        binId: typeof binId === 'string' ? Number(binId) : undefined,
        from: typeof from === 'string' ? from : undefined,
        to: typeof to === 'string' ? to : undefined,
      })
      if (format === 'xlsx') {
        const buffer = await ExportService.movementToXlsx(result)
        return sendXlsx(res, buffer, 'stock-movement')
      }
      if (format === 'csv') {
        return sendCsv(res, ExportService.movementToCsv(result), 'stock-movement')
      }
      res.json({ data: result, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
