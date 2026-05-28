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
      findMany: jest.fn(),
    },
  },
}))

import prisma from '@cpd/db'
const mockFindFirst = prisma.product.findFirst as jest.Mock
const mockTransaction = prisma.$transaction as jest.Mock
const mockFindMany = prisma.stockTransaction.findMany as jest.Mock
const mockQueryRaw = prisma.$queryRaw as jest.Mock

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

  it('returns 400 when quantity is not an integer', async () => {
    const res = await request(app)
      .post('/api/stock/in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 1.5 })
    expect(res.status).toBe(400)
  })
})

// ─── POST /api/stock/out ───────────────────────────────────────────────────

describe('POST /api/stock/out', () => {
  const MOCK_OUT_TX = { ...MOCK_TX, type: 'out', quantity: 3 }

  it('returns 401 when no token', async () => {
    const res = await request(app).post('/api/stock/out').send({ productId: 1, quantity: 3 })
    expect(res.status).toBe(401)
  })

  it('returns 400 when productId missing', async () => {
    const res = await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ quantity: 3 })
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is zero', async () => {
    const res = await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 0 })
    expect(res.status).toBe(400)
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 999, quantity: 3 })
    expect(res.status).toBe(404)
  })

  it('returns 400 when quantity exceeds currentStock', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 2 })
    const res = await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 5 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/insufficient stock/i)
  })

  it('returns 400 when currentStock is exactly zero', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 0 })
    const res = await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 1 })
    expect(res.status).toBe(400)
  })

  it('returns 201 when quantity equals currentStock (exact depletion)', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 5 })
    mockTransaction.mockResolvedValue([{ ...MOCK_PRODUCT, currentStock: 0 }, MOCK_OUT_TX])
    const res = await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 5 })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('out')
  })

  it('returns 201 for manager', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 10 })
    mockTransaction.mockResolvedValue([{ ...MOCK_PRODUCT, currentStock: 7 }, MOCK_OUT_TX])
    const res = await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 3 })
    expect(res.status).toBe(201)
  })

  it('calls $transaction atomically on success', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 10 })
    mockTransaction.mockResolvedValue([{ ...MOCK_PRODUCT, currentStock: 7 }, MOCK_OUT_TX])
    await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 3 })
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  it('returns 201 for admin', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 10 })
    mockTransaction.mockResolvedValue([{ ...MOCK_PRODUCT, currentStock: 7 }, MOCK_OUT_TX])
    const res = await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: 1, quantity: 3 })
    expect(res.status).toBe(201)
  })

  it('returns 400 when quantity is not an integer', async () => {
    const res = await request(app)
      .post('/api/stock/out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 2.5 })
    expect(res.status).toBe(400)
  })
})

// ─── POST /api/stock/adjust ───────────────────────────────────────────────

describe('POST /api/stock/adjust', () => {
  const MOCK_ADJ_TX = { ...MOCK_TX, type: 'adjust', quantity: 20 }

  it('returns 401 when no token', async () => {
    const res = await request(app).post('/api/stock/adjust').send({ productId: 1, quantity: 20 })
    expect(res.status).toBe(401)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 20 })
    expect(res.status).toBe(403)
  })

  it('returns 400 when productId missing', async () => {
    const res = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ quantity: 20 })
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is negative', async () => {
    const res = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: -1 })
    expect(res.status).toBe(400)
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 999, quantity: 20 })
    expect(res.status).toBe(404)
  })

  it('returns 201 and sets stock to given quantity', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockTransaction.mockResolvedValue([{ ...MOCK_PRODUCT, currentStock: 20 }, MOCK_ADJ_TX])
    const res = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 20 })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('adjust')
    expect(res.body.data.quantity).toBe(20)
  })

  it('allows adjusting to zero', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockTransaction.mockResolvedValue([
      { ...MOCK_PRODUCT, currentStock: 0 },
      { ...MOCK_ADJ_TX, quantity: 0 },
    ])
    const res = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 0 })
    expect(res.status).toBe(201)
  })

  it('accepts optional reason and note', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockTransaction.mockResolvedValue([
      { ...MOCK_PRODUCT, currentStock: 20 },
      { ...MOCK_ADJ_TX, reason: 'นับสต๊อกจริง', note: 'ตรวจนับประจำปี' },
    ])
    const res = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: 1, quantity: 20, reason: 'นับสต๊อกจริง', note: 'ตรวจนับประจำปี' })
    expect(res.status).toBe(201)
    expect(res.body.data.reason).toBe('นับสต๊อกจริง')
  })

  it('returns 400 when quantity is not an integer', async () => {
    const res = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 10.5 })
    expect(res.status).toBe(400)
  })
})

// ─── POST /api/stock/transfer ─────────────────────────────────────────────

describe('POST /api/stock/transfer', () => {
  const MOCK_TRANSFER_TX = {
    ...MOCK_TX,
    type: 'transfer',
    quantity: 5,
    fromLocation: 'คลัง A',
    toLocation: 'คลัง B',
  }

  it('returns 401 when no token', async () => {
    const res = await request(app)
      .post('/api/stock/transfer')
      .send({ productId: 1, quantity: 5, fromLocation: 'คลัง A', toLocation: 'คลัง B' })
    expect(res.status).toBe(401)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 1, quantity: 5, fromLocation: 'คลัง A', toLocation: 'คลัง B' })
    expect(res.status).toBe(403)
  })

  it('returns 400 when fromLocation missing', async () => {
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 5, toLocation: 'คลัง B' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when toLocation missing', async () => {
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 5, fromLocation: 'คลัง A' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is zero', async () => {
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 0, fromLocation: 'คลัง A', toLocation: 'คลัง B' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 999, quantity: 5, fromLocation: 'คลัง A', toLocation: 'คลัง B' })
    expect(res.status).toBe(404)
  })

  it('returns 400 when transfer quantity exceeds stock', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 3 })
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 5, fromLocation: 'คลัง A', toLocation: 'คลัง B' })
    expect(res.status).toBe(400)
  })

  it('returns 201 and records transfer for manager', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 10 })
    mockTransaction.mockResolvedValue([MOCK_TRANSFER_TX])
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 5, fromLocation: 'คลัง A', toLocation: 'คลัง B' })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('transfer')
    expect(res.body.data.fromLocation).toBe('คลัง A')
    expect(res.body.data.toLocation).toBe('คลัง B')
  })

  it('returns 201 for admin', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 10 })
    mockTransaction.mockResolvedValue([MOCK_TRANSFER_TX])
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: 1, quantity: 5, fromLocation: 'คลัง A', toLocation: 'คลัง B' })
    expect(res.status).toBe(201)
  })

  it('returns 201 when transfer quantity equals currentStock (exact)', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 5 })
    mockTransaction.mockResolvedValue([MOCK_TRANSFER_TX])
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 5, fromLocation: 'คลัง A', toLocation: 'คลัง B' })
    expect(res.status).toBe(201)
  })

  it('returns 400 when fromLocation is empty string', async () => {
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 5, fromLocation: '', toLocation: 'คลัง B' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when toLocation is empty string', async () => {
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 5, fromLocation: 'คลัง A', toLocation: '' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is not an integer', async () => {
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ productId: 1, quantity: 3.7, fromLocation: 'คลัง A', toLocation: 'คลัง B' })
    expect(res.status).toBe(400)
  })

  it('preserves note in response', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, currentStock: 10 })
    mockTransaction.mockResolvedValue([{ ...MOCK_TRANSFER_TX, note: 'ย้ายเพื่อผลิต' }])
    const res = await request(app)
      .post('/api/stock/transfer')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        productId: 1,
        quantity: 5,
        fromLocation: 'คลัง A',
        toLocation: 'คลัง B',
        note: 'ย้ายเพื่อผลิต',
      })
    expect(res.status).toBe(201)
    expect(res.body.data.note).toBe('ย้ายเพื่อผลิต')
  })
})

// ─── GET /api/stock/card/:productId ───────────────────────────────────────

describe('GET /api/stock/card/:productId', () => {
  const createdAt = new Date('2025-01-01T00:00:00Z')

  const makeTx = (id: number, type: string, quantity: number) => ({
    id,
    productId: 1,
    type,
    quantity,
    fromLocation: null,
    toLocation: null,
    reason: null,
    note: null,
    userId: 1,
    createdAt,
    product: MOCK_PRODUCT,
    createdBy: { id: 1, name: 'admin' },
  })

  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/stock/card/1')
    expect(res.status).toBe(401)
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .get('/api/stock/card/999')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(404)
  })

  it('returns empty transactions when no history', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockFindMany.mockResolvedValue([])
    const res = await request(app)
      .get('/api/stock/card/1')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.transactions).toHaveLength(0)
    expect(res.body.data.product.id).toBe(1)
  })

  it('computes running balance: in → out → in', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockFindMany.mockResolvedValue([makeTx(1, 'in', 10), makeTx(2, 'out', 3), makeTx(3, 'in', 5)])
    const res = await request(app)
      .get('/api/stock/card/1')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    const txs = res.body.data.transactions
    expect(txs[0].balance).toBe(10) // 0 + 10
    expect(txs[1].balance).toBe(7) // 10 - 3
    expect(txs[2].balance).toBe(12) // 7 + 5
  })

  it('adjust resets balance to absolute quantity', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockFindMany.mockResolvedValue([
      makeTx(1, 'in', 10),
      makeTx(2, 'adjust', 20),
      makeTx(3, 'out', 5),
    ])
    const res = await request(app)
      .get('/api/stock/card/1')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    const txs = res.body.data.transactions
    expect(txs[0].balance).toBe(10) // 0 + 10
    expect(txs[1].balance).toBe(20) // reset to 20
    expect(txs[2].balance).toBe(15) // 20 - 5
  })

  it('transfer does not change balance', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockFindMany.mockResolvedValue([
      makeTx(1, 'in', 10),
      makeTx(2, 'transfer', 4),
      makeTx(3, 'out', 2),
    ])
    const res = await request(app)
      .get('/api/stock/card/1')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    const txs = res.body.data.transactions
    expect(txs[0].balance).toBe(10) // in
    expect(txs[1].balance).toBe(10) // transfer — balance unchanged
    expect(txs[2].balance).toBe(8) // 10 - 2
  })

  it('allows all roles: staff, manager, admin', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockFindMany.mockResolvedValue([])
    for (const token of [staffToken, managerToken, adminToken]) {
      const res = await request(app)
        .get('/api/stock/card/1')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
    }
  })

  it('includes createdBy name in each transaction', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockFindMany.mockResolvedValue([makeTx(1, 'in', 10)])
    const res = await request(app)
      .get('/api/stock/card/1')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.transactions[0].createdBy.name).toBe('admin')
  })
})

// ─── GET /api/stock/history ───────────────────────────────────────────────

describe('GET /api/stock/history', () => {
  const createdAt = new Date('2025-06-01T00:00:00Z')
  const makeTx = (id: number, type: string) => ({
    id,
    productId: 1,
    type,
    quantity: 10,
    fromLocation: null,
    toLocation: null,
    reason: null,
    note: null,
    userId: 1,
    createdAt,
    product: MOCK_PRODUCT,
    createdBy: { id: 1, name: 'admin' },
  })

  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/stock/history')
    expect(res.status).toBe(401)
  })

  it('returns 200 with all transactions when no filter', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'in'), makeTx(2, 'out')])
    const res = await request(app)
      .get('/api/stock/history')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
  })

  it('filters by type=in', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'in')])
    const res = await request(app)
      .get('/api/stock/history?type=in')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].type).toBe('in')
  })

  it('returns 400 for invalid type', async () => {
    const res = await request(app)
      .get('/api/stock/history?type=invalid')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(400)
  })

  it('filters by from date', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'in')])
    const res = await request(app)
      .get('/api/stock/history?from=2025-01-01T00:00:00Z')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('filters by to date', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'out')])
    const res = await request(app)
      .get('/api/stock/history?to=2025-12-31T23:59:59Z')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
  })

  it('filters by from and to combined', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'in'), makeTx(2, 'out')])
    const res = await request(app)
      .get('/api/stock/history?from=2025-01-01T00:00:00Z&to=2025-12-31T23:59:59Z')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
  })

  it('filters by productId', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'in')])
    const res = await request(app)
      .get('/api/stock/history?productId=1')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
  })

  it('returns 400 for non-integer productId', async () => {
    const res = await request(app)
      .get('/api/stock/history?productId=abc')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid date format', async () => {
    const res = await request(app)
      .get('/api/stock/history?from=not-a-date')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(400)
  })

  it('allows all roles: staff, manager, admin', async () => {
    mockFindMany.mockResolvedValue([])
    for (const token of [staffToken, managerToken, adminToken]) {
      const res = await request(app)
        .get('/api/stock/history')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
    }
  })

  it('filters by type=out', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'out')])
    const res = await request(app)
      .get('/api/stock/history?type=out')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data[0].type).toBe('out')
  })

  it('filters by type=adjust', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'adjust')])
    const res = await request(app)
      .get('/api/stock/history?type=adjust')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data[0].type).toBe('adjust')
  })

  it('filters by type=transfer', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'transfer')])
    const res = await request(app)
      .get('/api/stock/history?type=transfer')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data[0].type).toBe('transfer')
  })

  it('returns empty array when no transactions match filter', async () => {
    mockFindMany.mockResolvedValue([])
    const res = await request(app)
      .get('/api/stock/history?type=in&productId=999')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })

  it('filters by productId combined with type', async () => {
    mockFindMany.mockResolvedValue([makeTx(1, 'in')])
    const res = await request(app)
      .get('/api/stock/history?productId=1&type=in')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})

// ─── GET /api/stock/low-alert ─────────────────────────────────────────────

describe('GET /api/stock/low-alert', () => {
  const LOW_PRODUCT = { ...MOCK_PRODUCT, currentStock: 2, minStock: 10 }
  const OK_PRODUCT = { ...MOCK_PRODUCT, id: 2, currentStock: 15, minStock: 10 }

  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/stock/low-alert')
    expect(res.status).toBe(401)
  })

  it('returns 200 with low stock products for staff', async () => {
    mockQueryRaw.mockResolvedValue([LOW_PRODUCT])
    const res = await request(app)
      .get('/api/stock/low-alert')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].currentStock).toBe(2)
    expect(res.body.data[0].minStock).toBe(10)
  })

  it('returns 200 for manager', async () => {
    mockQueryRaw.mockResolvedValue([LOW_PRODUCT])
    const res = await request(app)
      .get('/api/stock/low-alert')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(200)
  })

  it('returns 200 for admin', async () => {
    mockQueryRaw.mockResolvedValue([LOW_PRODUCT])
    const res = await request(app)
      .get('/api/stock/low-alert')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('returns empty array when all products are above minStock', async () => {
    mockQueryRaw.mockResolvedValue([])
    const res = await request(app)
      .get('/api/stock/low-alert')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(0)
  })

  it('returns multiple low stock products sorted by shortage desc', async () => {
    const criticalProduct = { ...MOCK_PRODUCT, id: 3, currentStock: 0, minStock: 10 }
    mockQueryRaw.mockResolvedValue([criticalProduct, LOW_PRODUCT])
    const res = await request(app)
      .get('/api/stock/low-alert')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data[0].currentStock).toBe(0)
  })

  it('does not include ok_product in response (only low-stock products)', async () => {
    mockQueryRaw.mockResolvedValue([LOW_PRODUCT])
    const res = await request(app)
      .get('/api/stock/low-alert')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    const ids = res.body.data.map((p: { id: number }) => p.id)
    expect(ids).not.toContain(OK_PRODUCT.id)
  })
})
