import request from 'supertest'
import jwt from 'jsonwebtoken'
import ExcelJS from 'exceljs'
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

describe('GET /api/reports/movement', () => {
  const MOCK_MOVEMENTS = [
    {
      id: 3,
      type: 'out',
      quantity: 30,
      productId: 1,
      createdAt: new Date('2026-06-12T10:00:00Z'),
      product: { id: 1, name: 'ไม้พาเลท', sku: 'PAL-001', unit: 'แผ่น' },
      createdBy: { id: 1, name: 'admin' },
      warehouse: { id: 1, name: 'คลังหลัก', shortName: 'หลัก' },
      toWarehouse: null,
    },
    {
      id: 2,
      type: 'in',
      quantity: 100,
      productId: 1,
      createdAt: new Date('2026-06-11T10:00:00Z'),
      product: { id: 1, name: 'ไม้พาเลท', sku: 'PAL-001', unit: 'แผ่น' },
      createdBy: { id: 1, name: 'admin' },
      warehouse: { id: 1, name: 'คลังหลัก', shortName: 'หลัก' },
      toWarehouse: null,
    },
    {
      id: 1,
      type: 'in',
      quantity: 50,
      productId: 2,
      createdAt: new Date('2026-06-10T10:00:00Z'),
      product: { id: 2, name: 'ตะปู', sku: 'WD-002', unit: 'กก.' },
      createdBy: { id: 2, name: 'manager' },
      warehouse: { id: 1, name: 'คลังหลัก', shortName: 'หลัก' },
      toWarehouse: null,
    },
  ]

  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/reports/movement')
    expect(res.status).toBe(401)
  })

  it('returns movements with in/out summary', async () => {
    mockTxFindMany.mockResolvedValue(MOCK_MOVEMENTS)

    const res = await request(app)
      .get('/api/reports/movement')
      .set('Authorization', `Bearer ${staffToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.items).toHaveLength(3)
    expect(res.body.data.summary).toEqual({
      totalRecords: 3,
      totalIn: 150, // 100 + 50
      totalOut: 30,
      totalAdjust: 0,
      totalTransfer: 0,
      netChange: 120, // 150 - 30
    })
  })

  it('passes date and type filters to the query', async () => {
    mockTxFindMany.mockResolvedValue([MOCK_MOVEMENTS[1], MOCK_MOVEMENTS[2]])

    const res = await request(app)
      .get(
        '/api/reports/movement?type=in&from=2026-06-01T00:00:00%2B07:00&to=2026-06-30T23:59:59%2B07:00&productId=1&warehouseId=1'
      )
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    const where = mockTxFindMany.mock.calls[0][0].where
    expect(where.type).toBe('in')
    expect(where.productId).toBe(1)
    expect(where.OR).toEqual([{ warehouseId: 1 }, { toWarehouseId: 1 }])
    expect(where.createdAt.gte).toBeInstanceOf(Date)
    expect(where.createdAt.lte).toBeInstanceOf(Date)
  })

  it('returns 400 when type is invalid', async () => {
    const res = await request(app)
      .get('/api/reports/movement?type=foo')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(400)
  })

  it('returns 400 when from is not a valid datetime', async () => {
    const res = await request(app)
      .get('/api/reports/movement?from=2026-06-01')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(400)
  })
})

describe('Excel export (?format=xlsx)', () => {
  const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  it('exports stock balance as a valid .xlsx with data', async () => {
    mockProductFindMany.mockResolvedValue(MOCK_PRODUCTS)

    const res = await request(app)
      .get('/api/reports/balance?format=xlsx')
      .set('Authorization', `Bearer ${staffToken}`)
      .responseType('blob')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain(XLSX_MIME)
    expect(res.headers['content-disposition']).toContain('attachment')
    expect(res.headers['content-disposition']).toContain('stock-balance')

    // Parse the returned workbook and verify content
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(res.body)
    const ws = wb.getWorksheet('Stock Balance')
    expect(ws).toBeDefined()
    expect(ws!.getRow(1).getCell(1).value).toBe('ลำดับ')
    // first data row = product 1
    expect(ws!.getRow(2).getCell(2).value).toBe('PAL-001')
    expect(ws!.getRow(2).getCell(7).value).toBe(30) // quantity
    expect(ws!.getRow(2).getCell(9).value).toBe(1500) // costValue
  })

  it('exports stock movement as a valid .xlsx', async () => {
    mockTxFindMany.mockResolvedValue([
      {
        id: 1,
        type: 'in',
        quantity: 100,
        productId: 1,
        note: 'รับเข้าล็อตแรก',
        createdAt: new Date('2026-06-11T10:00:00Z'),
        product: { id: 1, name: 'ไม้พาเลท', sku: 'PAL-001', unit: 'แผ่น' },
        createdBy: { id: 1, name: 'admin' },
        warehouse: { id: 1, name: 'คลังหลัก', shortName: 'หลัก' },
        toWarehouse: null,
      },
    ])

    const res = await request(app)
      .get('/api/reports/movement?format=xlsx')
      .set('Authorization', `Bearer ${adminToken}`)
      .responseType('blob')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain(XLSX_MIME)
    expect(res.headers['content-disposition']).toContain('stock-movement')

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(res.body)
    const ws = wb.getWorksheet('Stock Movement')
    expect(ws).toBeDefined()
    expect(ws!.getRow(1).getCell(3).value).toBe('ประเภท')
    expect(ws!.getRow(2).getCell(3).value).toBe('รับเข้า') // type label
    expect(ws!.getRow(2).getCell(4).value).toBe('PAL-001')
    expect(ws!.getRow(2).getCell(6).value).toBe(100) // quantity
  })

  it('returns 400 when format is invalid', async () => {
    const res = await request(app)
      .get('/api/reports/balance?format=pdf')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(400)
  })
})

describe('CSV export (?format=csv)', () => {
  const BOM = '﻿'

  it('exports stock balance as CSV with BOM and correct rows', async () => {
    mockProductFindMany.mockResolvedValue(MOCK_PRODUCTS)

    const res = await request(app)
      .get('/api/reports/balance?format=csv')
      .set('Authorization', `Bearer ${staffToken}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('attachment')
    expect(res.headers['content-disposition']).toContain('stock-balance')
    expect(res.headers['content-disposition']).toContain('.csv')

    expect(res.text.startsWith(BOM)).toBe(true)
    const lines = res.text.replace(BOM, '').split('\r\n')
    expect(lines[0]).toBe(
      'ลำดับ,SKU,ชื่อสินค้า,ประเภท,หมวดหมู่,หน่วย,คงเหลือ,ราคาทุน,มูลค่าทุน,ราคาขาย,มูลค่าขาย'
    )
    // product 1: quantity 30, costValue 1500, saleValue 2400
    expect(lines[1]).toBe('1,PAL-001,ไม้พาเลท,raw,พาเลท,แผ่น,30,50,1500,80,2400')
    // total row at the end
    expect(lines[lines.length - 1]).toContain('รวม')
  })

  it('exports stock movement as CSV', async () => {
    mockTxFindMany.mockResolvedValue([
      {
        id: 1,
        type: 'in',
        quantity: 100,
        productId: 1,
        note: 'ล็อตแรก',
        createdAt: new Date('2026-06-11T10:00:00Z'),
        product: { id: 1, name: 'ไม้พาเลท', sku: 'PAL-001', unit: 'แผ่น' },
        createdBy: { id: 1, name: 'admin' },
        warehouse: { id: 1, name: 'คลังหลัก', shortName: 'หลัก' },
        toWarehouse: null,
      },
    ])

    const res = await request(app)
      .get('/api/reports/movement?format=csv')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('stock-movement')

    const lines = res.text.replace(BOM, '').split('\r\n')
    expect(lines[0]).toBe('ลำดับ,วันที่,ประเภท,SKU,ชื่อสินค้า,จำนวน,หน่วย,คลัง,ผู้บันทึก,หมายเหตุ')
    expect(lines[1]).toContain('รับเข้า')
    expect(lines[1]).toContain('PAL-001')
    expect(lines[1]).toContain('100')
  })

  it('escapes fields containing commas with double quotes', async () => {
    mockTxFindMany.mockResolvedValue([
      {
        id: 1,
        type: 'in',
        quantity: 5,
        productId: 1,
        note: 'รับเข้า, ของดี',
        createdAt: new Date('2026-06-11T10:00:00Z'),
        product: { id: 1, name: 'ไม้พาเลท', sku: 'PAL-001', unit: 'แผ่น' },
        createdBy: { id: 1, name: 'admin' },
        warehouse: { id: 1, name: 'คลังหลัก', shortName: 'หลัก' },
        toWarehouse: null,
      },
    ])

    const res = await request(app)
      .get('/api/reports/movement?format=csv')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.text).toContain('"รับเข้า, ของดี"')
  })
})
