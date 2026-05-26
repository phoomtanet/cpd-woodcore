import type { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

type ZodIssue = { path: (string | number)[]; message: string }
type ZodLikeError = Error & { issues: ZodIssue[] }

function isZodError(err: unknown): err is ZodLikeError {
  return err instanceof Error && err.name === 'ZodError' && 'issues' in err
}

function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // ZodError — validation failures from task 1.10 onwards
  if (isZodError(err)) {
    res
      .status(400)
      .json({ error: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) })
    return
  }

  // Malformed JSON body (Express built-in SyntaxError)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON body' })
    return
  }

  // Prisma: unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ error: 'Duplicate entry: value already exists' })
    return
  }

  // Prisma: record not found
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json({ error: 'Record not found' })
    return
  }

  if (err instanceof Error) {
    console.error('[API Error]', err.message)
  }
  res.status(500).json({ error: 'Internal server error' })
}

export default errorHandler
