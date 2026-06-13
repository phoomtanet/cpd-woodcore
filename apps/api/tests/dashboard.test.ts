import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/app'

const SECRET = process.env.JWT_SECRET ?? ''
const adminToken = jwt.sign({ userId: 1, role: 'admin' }, SECRET, { expiresIn: '1h' })
const staffToken = jwt.sign({ userId: 3, role: 'staff' }, SECRET, { expiresIn: '1h' })

jest.mock('@cpd/db', () => ({
  __esModule: true,
  default: {
    product: { findMany: jest.fn() },
    stockTransaction: { findMany: jest.fn() },
    warehouse: { count: jest.fn() },
  },
}))

import prisma from '@cpd/db'
const mockProductFindMany = prisma.product.findMany as jest.Mock
const mockTxFindMany = prisma.stockTransaction.findMany as jest.Mock
const mockWarehouseCount = prisma.warehouse.count as jest.Mock

// Product 1: total 30 across warehouses, minStock 10 → not low
// Product 2: total 5, minStock 50 → LOW
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
    minStock: 50,
    currentStock: 5,
    deletedAt: null,
    stocks: [{ productId: 2, warehouseId: 1, quantity: 5 }],
  },
]

beforeEach(() => jest.clearAllMocks())

describe('GET /api/dashboard/summary', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/dashboard/summary')
    expect(res.status).toBe(401)
  })

  it('returns headline stats across all warehouses', async () => {
    mockProductFindMany.mockResolvedValue(MOCK_PRODUCTS)
    mockWarehouseCount.mockResolvedValue(2)

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${staffToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({
      warehouseId: null,
      binId: null,
      totalProducts: 2,
      totalStockQuantity: 35, // 30 + 5
      totalCostValue: 1550, // 30*50 + 5*10
      totalSaleValue: 2475, // 30*80 + 5*15
      lowStockCount: 1, // product 2: 5 < 50
      warehouseCount: 2,
    })
    // no asOf/bin filter → no transaction replay
    expect(mockTxFindMany).not.toHaveBeenCalled()
  })

  it('scopes quantities and low-stock to a warehouse', async () => {
    mockProductFindMany.mockResolvedValue(MOCK_PRODUCTS)
    mockWarehouseCount.mockResolvedValue(2)

    const res = await request(app)
      .get('/api/dashboard/summary?warehouseId=2')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.warehouseId).toBe(2)
    expect(res.body.data.totalStockQuantity).toBe(10) // only product 1 in wh 2
    // product 1: 10 < 10 false; product 2: 0 < 50 true → 1 low
    expect(res.body.data.lowStockCount).toBe(1)
  })

  it('reconstructs bin-level quantity via transaction replay', async () => {
    mockProductFindMany.mockResolvedValue([MOCK_PRODUCTS[0]])
    mockWarehouseCount.mockResolvedValue(2)
    mockTxFindMany.mockResolvedValue([
      { productId: 1, type: 'in', quantity: 40, binId: 5, toBinId: null },
      { productId: 1, type: 'out', quantity: 15, binId: 5, toBinId: null },
    ])

    const res = await request(app)
      .get('/api/dashboard/summary?warehouseId=1&binId=5')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.binId).toBe(5)
    expect(res.body.data.totalStockQuantity).toBe(25) // 40 - 15
    expect(res.body.data.totalCostValue).toBe(1250) // 25 * 50
  })

  it('returns 400 when warehouseId is not numeric', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary?warehouseId=abc')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/dashboard/recent-transactions', () => {
  const MOCK_TX = [
    {
      id: 2,
      type: 'in',
      quantity: 100,
      productId: 1,
      createdAt: new Date('2026-06-12T10:00:00Z'),
      product: { id: 1, name: 'ไม้พาเลท', sku: 'PAL-001', unit: 'แผ่น' },
      createdBy: { id: 1, name: 'admin' },
      warehouse: { id: 1, name: 'คลังหลัก', shortName: 'หลัก' },
      toWarehouse: null,
      bin: null,
      tobin: null,
    },
  ]

  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/dashboard/recent-transactions')
    expect(res.status).toBe(401)
  })

  it('returns recent transactions and passes limit/filter to the query', async () => {
    mockTxFindMany.mockResolvedValue(MOCK_TX)

    const res = await request(app)
      .get('/api/dashboard/recent-transactions?warehouseId=1&limit=5')
      .set('Authorization', `Bearer ${staffToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    const args = mockTxFindMany.mock.calls[0][0]
    expect(args.take).toBe(5)
    expect(args.where.OR).toEqual([{ warehouseId: 1 }, { toWarehouseId: 1 }])
    expect(args.orderBy).toEqual({ createdAt: 'desc' })
  })

  it('defaults to limit 10 and binId precedence over warehouseId', async () => {
    mockTxFindMany.mockResolvedValue([])

    const res = await request(app)
      .get('/api/dashboard/recent-transactions?warehouseId=1&binId=5')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    const args = mockTxFindMany.mock.calls[0][0]
    expect(args.take).toBe(10)
    expect(args.where.OR).toEqual([{ binId: 5 }, { toBinId: 5 }])
  })
})
