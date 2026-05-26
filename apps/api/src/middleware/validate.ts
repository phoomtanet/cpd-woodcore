import type { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body)
      next()
    } catch (err) {
      next(err)
    }
  }
}

export default validate
