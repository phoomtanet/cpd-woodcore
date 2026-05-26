import type { Request, Response, NextFunction } from 'express'

export const ProductController = {
  create(_req: Request, res: Response, _next: NextFunction): void {
    res.status(201).json({ data: null, message: 'ok' })
  },
}
