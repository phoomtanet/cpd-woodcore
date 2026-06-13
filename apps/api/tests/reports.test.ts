import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/app'

const SECRET = process.env.JWT_SECRET ?? ''
const adminToken = jwt.sign({ userId: 1, role: 'admin' }, SECRET, { expiresIn: '1h' })
const staffToken = jwt.sign({ userId: 3, role: 'staff' }, SECRET, { expiresIn: '1h' })

jest.mock('@cpd/db', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: jest.fn(),
    },
    stockTransaction: {
      findMany: jest.fn(),
    },
  },
}))

import prisma from '@cpd/db'
const mockProductFindMany = prisma.product.findMany as jest.Mock
const mockTxFindMany = prisma.stockTransaction.findMany as jest.Mock

// Two products, each with per-warehouse ProductStock rows
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'ไม้พาเลท',
    sku: 'PAL-001',
    productType: 'raw',
    unit: 'แผ่น',
    category: { id: 1, name: 'พาเลท' },
    costPrice: '50.00',
    salePrice: '80.00',
    minStock: 10,
    currentStock: 30,
    deletedAt: null,
    stocks: [
      { productId: 1, warehouseId: 1, quantity: 20 },
      { productId: 1, warehouseId: 2, quantity: 10 },
    ],
  },
  {
    id: 2,
    name: 'ตะปู',
    sku: 'WD-002',
    productType: 'raw',
    unit: 'กก.',
    category: null,
    costPrice: '10.00',
    salePrice: '15.00',
    minStock: 5,
    currentStock: 5,
    deletedAt: null,
    stocks: [{ productId: 2, warehouseId: 1, quantity: 5 }],
  },
]

beforeEach(() => jest.clearAllMocks())

describe('GET /api/reports/balance', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/reports/balance')
    expect(res.status).toBe(401)
  })

  it('returns balance list with values and summary (all warehouses)', async () => {
    mockProductFindMany.mockResolvedValue(MOCK_PRODUCTS)

    const res = await request(app)
      .get('/api/reports/balance')
      .set('Authorization', `Bearer ${staffToken}`)

    expect(res.status).toBe(200)
    expect(mockTxFindMany).not.toHaveBeenCalled() // no asOf → no reconstruction
    expect(res.body.data.items).toHaveLength(2)

    const pal = res.body.data.items[0]
    expect(pal.quantity).toBe(30) // 20 + 10 across warehouses
    expect(pal.costValue).toBe(1500) // 30 * 50
    expect(pal.saleValue).toBe(2400) // 30 * 80
    expect(pal.category).toBe('พาเลท')

    expect(res.body.data.summary).toEqual({
      totalProducts: 2,
      totalQuantity: 35,
      totalCostValue: 1550, // 1500 + 50
      totalSaleValue: 2475, // 2400 + 75
    })
  })

  it('filters quantity by warehouseId', async () => {
    mockProductFindMany.mockResolvedValue(MOCK_PRODUCTS)

    const res = await request(app)
      .get('/api/reports/balance?warehouseId=2')
      .set('Authorization', `Bearer ${staffToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.warehouseId).toBe(2)
    expect(res.body.data.items[0].quantity).toBe(10) // only warehouse 2
    expect(res.body.data.items[1].quantity).toBe(0) // product 2 has no stock in wh 2
    expect(res.body.data.summary.totalQuantity).toBe(10)
  })

  it('reconstructs balance as of a date from transactions', async () => {
    mockProductFindMany.mockResolvedValue([MOCK_PRODUCTS[0]])
    mockTxFindMany.mockResolvedValue([
      { productId: 1, type: 'in', quantity: 100, warehouseId: 1, toWarehouseId: null },
      { productId: 1, type: 'out', quantity: 30, warehouseId: 1, toWarehouseId: null },
      { productId: 1, type: 'transfer', quantity: 20, warehouseId: 1, toWarehouseId: 2 },
    ])

    const res = await request(app)
      .get('/api/reports/balance?asOf=2026-06-13T23:59:59%2B07:00')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(mockTxFindMany).toHaveBeenCalledTimes(1)
    // wh1: 100 - 30 - 20 = 50, wh2: +20 → total 70
    expect(res.body.data.items[0].quantity).toBe(70)
    expect(res.body.data.items[0].costValue).toBe(3500) // 70 * 50
    expect(res.body.data.asOf).toBe('2026-06-13T23:59:59+07:00')
  })

  it('as-of with warehouseId returns that warehouse balance only', async () => {
    mockProductFindMany.mockResolvedValue([MOCK_PRODUCTS[0]])
    mockTxFindMany.mockResolvedValue([
      { productId: 1, type: 'in', quantity: 100, warehouseId: 1, toWarehouseId: null },
      { productId: 1, type: 'transfer', quantity: 20, warehouseId: 1, toWarehouseId: 2 },
    ])

    const res = await request(app)
      .get('/api/reports/balance?asOf=2026-06-13T23:59:59%2B07:00&warehouseId=2')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.items[0].quantity).toBe(20) // only what arrived in wh 2
  })

  it('returns 400 when warehouseId is not numeric', async () => {
    const res = await request(app)
      .get('/api/reports/balance?warehouseId=abc')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(400)
  })

  it('returns 400 when asOf is not a valid datetime', async () => {
    const res = await request(app)
      .get('/api/reports/balance?asOf=2026-06-13')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(400)
  })
})
