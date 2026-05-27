import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/app'

const SECRET = process.env.JWT_SECRET ?? ''
const adminToken = jwt.sign({ userId: 1, role: 'admin' }, SECRET, { expiresIn: '1h' })
const managerToken = jwt.sign({ userId: 2, role: 'manager' }, SECRET, { expiresIn: '1h' })
const staffToken = jwt.sign({ userId: 3, role: 'staff' }, SECRET, { expiresIn: '1h' })

jest.mock('@cpd/db', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    product: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    stockTransaction: {
      create: jest.fn(),
    },
  },
}))

import prisma from '@cpd/db'
const mockFindFirst = prisma.product.findFirst as jest.Mock
const mockTransaction = prisma.$transaction as jest.Mock

const MOCK_PRODUCT = {
  id: 1,
  name: 'ไม้พาเลท',
  sku: 'PAL-001',
  productType: 'raw',
  unit: 'แผ่น',
  costPrice: '50.00',
  salePrice: '80.00',
  minStock: 10,
  currentStock: 5,
  deletedAt: null,
}

const MOCK_TX = {
  id: 1,
  productId: 1,
  type: 'in',
  quantity: 10,
  note: null,
  userId: 1,
  createdAt: new Date(),
  product: MOCK_PRODUCT,
}

beforeEach(() => jest.clearAllMocks())

// ─── POST /api/stock/in ────────────────────────────────────────────────────

describe('POST /api/stock/in', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).post('/api/stock/in').send({ productId: 1, quantity: 10 })
    expect(res.status).toBe(401)
  })

  it('returns 400 when productId missing', async () => {
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ quantity: 10 })
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity missing', async () => {
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1 })
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is zero', async () => {
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 0 })
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is negative', async () => {
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: -5 })
    expect(res.status).toBe(400)
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 999, quantity: 10 })
    expect(res.status).toBe(404)
  })

  it('returns 201 and transaction for staff', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockTransaction.mockResolvedValue([{ ...MOCK_PRODUCT, currentStock: 15 }, MOCK_TX])
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 10 })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('in')
    expect(res.body.data.quantity).toBe(10)
  })

  it('returns 201 for manager', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockTransaction.mockResolvedValue([{ ...MOCK_PRODUCT, currentStock: 15 }, MOCK_TX])
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 5 })
    expect(res.status).toBe(201)
  })

  it('returns 201 for admin', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockTransaction.mockResolvedValue([{ ...MOCK_PRODUCT, currentStock: 15 }, MOCK_TX])
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: 1, quantity: 5 })
    expect(res.status).toBe(201)
  })

  it('accepts optional note', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockTransaction.mockResolvedValue([
      { ...MOCK_PRODUCT, currentStock: 15 },
      { ...MOCK_TX, note: 'รับจากซัพพลายเออร์' },
    ])
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 10, note: 'รับจากซัพพลายเออร์' })
    expect(res.status).toBe(201)
    expect(res.body.data.note).toBe('รับจากซัพพลายเออร์')
  })

  it('calls $transaction so currentStock and transaction are atomic', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockTransaction.mockResolvedValue([{ ...MOCK_PRODUCT, currentStock: 15 }, MOCK_TX])
    await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 10 })
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })
})
