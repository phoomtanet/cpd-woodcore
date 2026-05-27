import express from 'express'
import cors from 'cors'
import prisma from '@cpd/db'
import errorHandler from './middleware/errorHandler'
import authRouter from './routes/auth'
import productsRouter from './routes/products'
import usersRouter from './routes/users'
import rolePermissionsRouter from './routes/role-permissions'
import rolesRouter from './routes/roles'

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

app.use('/api/auth', authRouter)
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)
app.use('/api/role-permissions', rolePermissionsRouter)
app.use('/api/roles', rolesRouter)

// Global error handler — must be registered last
app.use(errorHandler)

export default app
