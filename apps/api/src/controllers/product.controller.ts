import type { Request, Response, NextFunction } from 'express'
import { ProductService } from '../services/product.service'
import { saveResizedImage } from '../middleware/upload'

export const ProductController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, productType, categoryId, status } = req.query
      const statusVal =
        status === 'active' || status === 'inactive' || status === 'all'
          ? (status as 'active' | 'inactive' | 'all')
          : undefined
      const products = await ProductService.findAll({
        search: typeof search === 'string' ? search : undefined,
        productType: typeof productType === 'string' ? productType : undefined,
        categoryId: typeof categoryId === 'string' ? Number(categoryId) : undefined,
        status: statusVal,
      })
      res.json({ data: products, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.findById(Number(req.params.id))
      res.json({ data: product, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.create(req.body)
      res.status(201).json({ data: product, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.update(Number(req.params.id), req.body)
      res.json({ data: product, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' })
        return
      }
      const imageUrl = await saveResizedImage(req.file.buffer)
      const product = await ProductService.updateImage(Number(req.params.id), imageUrl)
      res.json({ data: product, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.toggleStatus(Number(req.params.id), req.body.isActive)
      res.json({ data: product, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProductService.deleteById(Number(req.params.id))
      res.json({ data: null, message: 'ok' })
    } catch (err) {
      next(err)
    }
  },
}
