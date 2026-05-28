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
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import prisma from '@cpd/db'
const mockFindMany = prisma.product.findMany as jest.Mock
const mockFindFirst = prisma.product.findFirst as jest.Mock
const mockCreate = prisma.product.create as jest.Mock
const mockUpdate = prisma.product.update as jest.Mock

const MOCK_PRODUCT = {
  id: 1,
  name: 'ไม้พาเลท',
  sku: 'PAL-001',
  barcode: null,
  image: null,
  category: null,
  productType: 'raw',
  unit: 'แผ่น',
  costPrice: '50.00',
  salePrice: '80.00',
  minStock: 0,
  currentStock: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const VALID_BODY = {
  name: 'ไม้พาเลท',
  sku: 'PAL-001',
  unit: 'แผ่น',
  costPrice: 50,
  salePrice: 80,
}

beforeEach(() => jest.clearAllMocks())

// ─── GET /api/products ─────────────────────────────────────────────────────

describe('GET /api/products', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(401)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app).get('/api/products').set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 200 with product list (manager)', async () => {
    mockFindMany.mockResolvedValue([MOCK_PRODUCT])
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].sku).toBe('PAL-001')
  })

  it('filters out soft-deleted products', async () => {
    mockFindMany.mockResolvedValue([])
    await request(app).get('/api/products').set('Authorization', `Bearer ${adminToken}`)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) })
    )
  })

  it('passes productType filter to repository', async () => {
    mockFindMany.mockResolvedValue([])
    const res = await request(app)
      .get('/api/products?productType=raw')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ productType: 'raw' }) })
    )
  })

  it('passes search filter to repository', async () => {
    mockFindMany.mockResolvedValue([])
    const res = await request(app)
      .get('/api/products?search=ไม้')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
    )
  })

  it('returns 200 with product list (admin)', async () => {
    mockFindMany.mockResolvedValue([MOCK_PRODUCT])
    const res = await request(app).get('/api/products').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('passes combined search + productType filter', async () => {
    mockFindMany.mockResolvedValue([])
    await request(app)
      .get('/api/products?search=ไม้&productType=raw')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productType: 'raw',
          OR: expect.any(Array),
        }),
      })
    )
  })
})

// ─── GET /api/products/:id ─────────────────────────────────────────────────

describe('GET /api/products/:id', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/products/1')
    expect(res.status).toBe(401)
  })

  it('returns 200 with product', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    const res = await request(app)
      .get('/api/products/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(1)
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .get('/api/products/999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Product not found')
  })

  it('returns 404 for soft-deleted product', async () => {
    // findFirst with deletedAt: null returns null for a soft-deleted record
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .get('/api/products/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

// ─── POST /api/products ────────────────────────────────────────────────────

describe('POST /api/products', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).post('/api/products').send(VALID_BODY)
    expect(res.status).toBe(401)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${staffToken}`)
      .send(VALID_BODY)
    expect(res.status).toBe(403)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.error)).toBe(true)
    expect(res.body.error.find((e: { field: string }) => e.field === 'name')).toBeDefined()
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test' })
    expect(res.status).toBe(400)
  })

  it('returns 201 when valid (admin)', async () => {
    mockFindFirst.mockResolvedValue(null)
    mockCreate.mockResolvedValue(MOCK_PRODUCT)
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(VALID_BODY)
    expect(res.status).toBe(201)
    expect(res.body.data.sku).toBe('PAL-001')
  })

  it('returns 201 when valid (manager)', async () => {
    mockFindFirst.mockResolvedValue(null)
    mockCreate.mockResolvedValue(MOCK_PRODUCT)
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(VALID_BODY)
    expect(res.status).toBe(201)
  })

  it('returns 400 when productType is empty string', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...VALID_BODY, productType: '' })
    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.error)).toBe(true)
    expect(res.body.error.find((e: { field: string }) => e.field === 'productType')).toBeDefined()
  })

  it('returns 400 when costPrice is negative', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...VALID_BODY, costPrice: -1 })
    expect(res.status).toBe(400)
  })

  it('returns 409 when SKU already exists', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(VALID_BODY)
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('SKU already exists')
  })
})

// ─── PUT /api/products/:id ─────────────────────────────────────────────────

describe('PUT /api/products/:id', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).put('/api/products/1').send({ name: 'ไม้ใหม่' })
    expect(res.status).toBe(401)
  })

  it('returns 200 when updated', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockUpdate.mockResolvedValue({ ...MOCK_PRODUCT, name: 'ไม้ใหม่' })
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ไม้ใหม่' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('ไม้ใหม่')
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .put('/api/products/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ไม้ใหม่' })
    expect(res.status).toBe(404)
  })

  it('returns 409 when new SKU conflicts with existing product', async () => {
    mockFindFirst
      .mockResolvedValueOnce(MOCK_PRODUCT)
      .mockResolvedValueOnce({ ...MOCK_PRODUCT, id: 2, sku: 'PAL-002' })
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku: 'PAL-002' })
    expect(res.status).toBe(409)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'ไม้ใหม่' })
    expect(res.status).toBe(403)
  })
})

// ─── POST /api/products/:id/image ─────────────────────────────────────────

describe('POST /api/products/:id/image', () => {
  const FAKE_JPEG = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH' +
      'BwYIDAoMCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/wAAR' +
      'CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAA' +
      'AAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAA' +
      'AAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=',
    'base64'
  )

  it('returns 401 when no token', async () => {
    const res = await request(app)
      .post('/api/products/1/image')
      .attach('image', FAKE_JPEG, 'test.jpg')
    expect(res.status).toBe(401)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app)
      .post('/api/products/1/image')
      .set('Authorization', `Bearer ${staffToken}`)
      .attach('image', FAKE_JPEG, 'test.jpg')
    expect(res.status).toBe(403)
  })

  it('returns 400 when no file attached', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    const res = await request(app)
      .post('/api/products/1/image')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('No image file provided')
  })

  it('returns 400 when file is not an image', async () => {
    const res = await request(app)
      .post('/api/products/1/image')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', Buffer.from('not an image'), {
        filename: 'file.txt',
        contentType: 'text/plain',
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Only image files are allowed')
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/products/999/image')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', FAKE_JPEG, { filename: 'test.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(404)
  })

  it('returns 200 and image URL when upload succeeds', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockUpdate.mockResolvedValue({ ...MOCK_PRODUCT, image: '/uploads/products/test.jpg' })
    const res = await request(app)
      .post('/api/products/1/image')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', FAKE_JPEG, { filename: 'test.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(200)
    expect(res.body.data.image).toMatch(/^\/uploads\/products\//)
  })
})

// ─── DELETE /api/products/:id ──────────────────────────────────────────────

describe('DELETE /api/products/:id', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).delete('/api/products/1')
    expect(res.status).toBe(401)
  })

  it('returns 200 and soft-deletes (sets deletedAt)', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockUpdate.mockResolvedValue({ ...MOCK_PRODUCT, deletedAt: new Date() })
    const res = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
    )
  })

  it('returns 403 for manager (admin only)', async () => {
    const res = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .delete('/api/products/999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

// ─── GET /api/products?status ──────────────────────────────────────────────

describe('GET /api/products?status', () => {
  it('filters by status=active', async () => {
    mockFindMany.mockResolvedValue([])
    await request(app)
      .get('/api/products?status=active')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    )
  })

  it('filters by status=inactive', async () => {
    mockFindMany.mockResolvedValue([])
    await request(app)
      .get('/api/products?status=inactive')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: false }) })
    )
  })

  it('does not filter isActive when status=all', async () => {
    mockFindMany.mockResolvedValue([])
    await request(app).get('/api/products?status=all').set('Authorization', `Bearer ${adminToken}`)
    const call = mockFindMany.mock.calls[0][0]
    expect(call.where).not.toHaveProperty('isActive')
  })

  it('does not filter isActive when status is invalid', async () => {
    mockFindMany.mockResolvedValue([])
    await request(app)
      .get('/api/products?status=unknown')
      .set('Authorization', `Bearer ${adminToken}`)
    const call = mockFindMany.mock.calls[0][0]
    expect(call.where).not.toHaveProperty('isActive')
  })
})

// ─── PATCH /api/products/:id/status ───────────────────────────────────────

describe('PATCH /api/products/:id/status', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).patch('/api/products/1/status').send({ isActive: false })
    expect(res.status).toBe(401)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app)
      .patch('/api/products/1/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ isActive: false })
    expect(res.status).toBe(403)
  })

  it('returns 400 when isActive is missing', async () => {
    const res = await request(app)
      .patch('/api/products/1/status')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('returns 400 when isActive is not boolean', async () => {
    const res = await request(app)
      .patch('/api/products/1/status')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ isActive: 'yes' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when product not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const res = await request(app)
      .patch('/api/products/999/status')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ isActive: false })
    expect(res.status).toBe(404)
  })

  it('deactivates product (manager)', async () => {
    mockFindFirst.mockResolvedValue(MOCK_PRODUCT)
    mockUpdate.mockResolvedValue({ ...MOCK_PRODUCT, isActive: false })
    const res = await request(app)
      .patch('/api/products/1/status')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ isActive: false })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(false)
  })

  it('activates product (admin)', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PRODUCT, isActive: false })
    mockUpdate.mockResolvedValue({ ...MOCK_PRODUCT, isActive: true })
    const res = await request(app)
      .patch('/api/products/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(true)
  })
})
