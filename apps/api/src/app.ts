import express from 'express'
import cors from 'cors'
import path from 'path'
import prisma from '@cpd/db'
import errorHandler from './middleware/errorHandler'
import authRouter from './routes/auth'
import productsRouter from './routes/products'
import usersRouter from './routes/users'
import rolePermissionsRouter from './routes/role-permissions'
import rolesRouter from './routes/roles'
import masterRouter from './routes/master'
import stockRouter from './routes/stock'
import reportsRouter from './routes/reports'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/', (_req, res) => {
  res.json({
    name: 'CPD Woodcore API',
    description: 'ระบบจัดการสต๊อกสินค้า — Phoomtanet',
    version: '1.0.0',
    status: 'running',
    developer: {
      name: 'Phoomtanet',
      email: 'phoomtanet.in@gmail.com',
    },
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/login · GET /api/auth/me',
      products: 'GET|POST /api/products · GET|PUT|DELETE /api/products/:id',
      stock:
        'POST /api/stock/in|out|adjust|transfer · GET /api/stock/card/:id · GET /api/stock/history · GET /api/stock/low-alert',
      master: 'GET|POST|PUT|DELETE|PATCH /api/master/product-types|units|categories',
      reports: 'GET /api/reports/balance · GET /api/reports/movement',
      users: 'GET|POST /api/users · PUT|DELETE /api/users/:id',
      roles: 'GET|POST|PUT|DELETE /api/roles',
      permissions: 'GET /api/role-permissions · PUT /api/role-permissions/:role/:menuKey',
    },
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected', uptime: process.uptime() })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected', uptime: process.uptime() })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)
app.use('/api/role-permissions', rolePermissionsRouter)
app.use('/api/roles', rolesRouter)
app.use('/api/master', masterRouter)
app.use('/api/stock', stockRouter)
app.use('/api/reports', reportsRouter)

// Global error handler — must be registered last
app.use(errorHandler)

export default app
