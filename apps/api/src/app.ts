import express from 'express'
import cors from 'cors'
import prisma from '@cpd/db'
import errorHandler from './middleware/errorHandler'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected', uptime: process.uptime() })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected', uptime: process.uptime() })
  }
})

// Global error handler — must be registered last
app.use(errorHandler)

export default app
