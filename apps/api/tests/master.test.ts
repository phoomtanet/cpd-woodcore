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
    productTypeItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    unit: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import prisma from '@cpd/db'
const mockPTFindMany = prisma.productTypeItem.findMany as jest.Mock
const mockPTFindUnique = prisma.productTypeItem.findUnique as jest.Mock
const mockPTCreate = prisma.productTypeItem.create as jest.Mock
const mockPTUpdate = prisma.productTypeItem.update as jest.Mock
const mockPTDelete = prisma.productTypeItem.delete as jest.Mock
const mockUnitFindMany = prisma.unit.findMany as jest.Mock
const mockUnitFindUnique = prisma.unit.findUnique as jest.Mock
const mockUnitCreate = prisma.unit.create as jest.Mock
const mockUnitUpdate = prisma.unit.update as jest.Mock
const mockUnitDelete = prisma.unit.delete as jest.Mock

const MOCK_PT = { id: 1, name: 'raw', label: 'วัตถุดิบ', isActive: true }
const MOCK_UNIT = { id: 1, name: 'แผ่น', isActive: true }

beforeEach(() => jest.clearAllMocks())

// ─── GET /api/master/product-types ────────────────────────────────────────────

describe('GET /api/master/product-types', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/master/product-types')
    expect(res.status).toBe(401)
  })

  it('returns 200 for admin', async () => {
    mockPTFindMany.mockResolvedValue([MOCK_PT])
    const res = await request(app)
      .get('/api/master/product-types')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('returns 200 for manager', async () => {
    mockPTFindMany.mockResolvedValue([MOCK_PT])
    const res = await request(app)
      .get('/api/master/product-types')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(200)
  })

  it('returns 200 for staff', async () => {
    mockPTFindMany.mockResolvedValue([MOCK_PT])
    const res = await request(app)
      .get('/api/master/product-types')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
  })
})

// ─── POST /api/master/product-types ───────────────────────────────────────────

describe('POST /api/master/product-types', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app)
      .post('/api/master/product-types')
      .send({ name: 'custom', label: 'Custom' })
    expect(res.status).toBe(401)
  })

  it('returns 403 for manager', async () => {
    const res = await request(app)
      .post('/api/master/product-types')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'custom', label: 'Custom' })
    expect(res.status).toBe(403)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/master/product-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'Custom' })
    expect(res.status).toBe(400)
  })

  it('returns 201 when valid (admin)', async () => {
    mockPTFindUnique.mockResolvedValue(null)
    mockPTCreate.mockResolvedValue(MOCK_PT)
    const res = await request(app)
      .post('/api/master/product-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'raw', label: 'วัตถุดิบ' })
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('raw')
  })

  it('returns 409 when name already exists', async () => {
    mockPTFindUnique.mockResolvedValue(MOCK_PT)
    const res = await request(app)
      .post('/api/master/product-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'raw', label: 'วัตถุดิบ' })
    expect(res.status).toBe(409)
  })
})

// ─── PUT /api/master/product-types/:id ────────────────────────────────────────

describe('PUT /api/master/product-types/:id', () => {
  it('returns 403 for staff', async () => {
    const res = await request(app)
      .put('/api/master/product-types/1')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ label: 'Updated' })
    expect(res.status).toBe(403)
  })

  it('returns 200 when updated', async () => {
    mockPTFindUnique.mockResolvedValue(MOCK_PT)
    mockPTUpdate.mockResolvedValue({ ...MOCK_PT, label: 'Updated' })
    const res = await request(app)
      .put('/api/master/product-types/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data.label).toBe('Updated')
  })

  it('returns 404 when not found', async () => {
    mockPTFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .put('/api/master/product-types/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'Updated' })
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /api/master/product-types/:id ─────────────────────────────────────

describe('DELETE /api/master/product-types/:id', () => {
  it('returns 403 for manager', async () => {
    const res = await request(app)
      .delete('/api/master/product-types/1')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 200 when deleted', async () => {
    mockPTFindUnique.mockResolvedValue(MOCK_PT)
    mockPTDelete.mockResolvedValue(MOCK_PT)
    const res = await request(app)
      .delete('/api/master/product-types/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockPTFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .delete('/api/master/product-types/999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

// ─── GET /api/master/units ────────────────────────────────────────────────────

describe('GET /api/master/units', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/master/units')
    expect(res.status).toBe(401)
  })

  it('returns 200 for all roles', async () => {
    mockUnitFindMany.mockResolvedValue([MOCK_UNIT])
    const res = await request(app)
      .get('/api/master/units')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})

// ─── POST /api/master/units ───────────────────────────────────────────────────

describe('POST /api/master/units', () => {
  it('returns 403 for manager', async () => {
    const res = await request(app)
      .post('/api/master/units')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'ชิ้น' })
    expect(res.status).toBe(403)
  })

  it('returns 201 when valid (admin)', async () => {
    mockUnitFindUnique.mockResolvedValue(null)
    mockUnitCreate.mockResolvedValue(MOCK_UNIT)
    const res = await request(app)
      .post('/api/master/units')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'แผ่น' })
    expect(res.status).toBe(201)
  })

  it('returns 409 when name already exists', async () => {
    mockUnitFindUnique.mockResolvedValue(MOCK_UNIT)
    const res = await request(app)
      .post('/api/master/units')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'แผ่น' })
    expect(res.status).toBe(409)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/master/units')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(res.status).toBe(400)
  })
})

// ─── PUT /api/master/units/:id ────────────────────────────────────────────────

describe('PUT /api/master/units/:id', () => {
  it('returns 200 when updated', async () => {
    mockUnitFindUnique.mockResolvedValueOnce(MOCK_UNIT).mockResolvedValueOnce(null)
    mockUnitUpdate.mockResolvedValue({ ...MOCK_UNIT, name: 'แผ่นใหม่' })
    const res = await request(app)
      .put('/api/master/units/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'แผ่นใหม่' })
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockUnitFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .put('/api/master/units/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ใหม่' })
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /api/master/units/:id ─────────────────────────────────────────────

describe('DELETE /api/master/units/:id', () => {
  it('returns 200 when deleted', async () => {
    mockUnitFindUnique.mockResolvedValue(MOCK_UNIT)
    mockUnitDelete.mockResolvedValue(MOCK_UNIT)
    const res = await request(app)
      .delete('/api/master/units/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    mockUnitFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .delete('/api/master/units/999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

// ─── GET /api/master/product-types?status ─────────────────────────────────

describe('GET /api/master/product-types?status', () => {
  it('filters active by default (no status param)', async () => {
    mockPTFindMany.mockResolvedValue([MOCK_PT])
    await request(app).get('/api/master/product-types').set('Authorization', `Bearer ${adminToken}`)
    expect(mockPTFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    )
  })

  it('filters active when status=active', async () => {
    mockPTFindMany.mockResolvedValue([MOCK_PT])
    await request(app)
      .get('/api/master/product-types?status=active')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(mockPTFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    )
  })

  it('returns all when status=all', async () => {
    mockPTFindMany.mockResolvedValue([MOCK_PT])
    await request(app)
      .get('/api/master/product-types?status=all')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(mockPTFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })
})

// ─── PATCH /api/master/product-types/:id/status ───────────────────────────

describe('PATCH /api/master/product-types/:id/status', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app)
      .patch('/api/master/product-types/1/status')
      .send({ isActive: false })
    expect(res.status).toBe(401)
  })

  it('returns 403 for manager', async () => {
    const res = await request(app)
      .patch('/api/master/product-types/1/status')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ isActive: false })
    expect(res.status).toBe(403)
  })

  it('returns 400 when isActive is missing', async () => {
    const res = await request(app)
      .patch('/api/master/product-types/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('returns 404 when not found', async () => {
    mockPTFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .patch('/api/master/product-types/999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
    expect(res.status).toBe(404)
  })

  it('deactivates product type', async () => {
    mockPTFindUnique.mockResolvedValue(MOCK_PT)
    mockPTUpdate.mockResolvedValue({ ...MOCK_PT, isActive: false })
    const res = await request(app)
      .patch('/api/master/product-types/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(false)
  })

  it('activates product type', async () => {
    mockPTFindUnique.mockResolvedValue({ ...MOCK_PT, isActive: false })
    mockPTUpdate.mockResolvedValue(MOCK_PT)
    const res = await request(app)
      .patch('/api/master/product-types/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(true)
  })
})

// ─── GET /api/master/units?status ─────────────────────────────────────────

describe('GET /api/master/units?status', () => {
  it('filters active by default (no status param)', async () => {
    mockUnitFindMany.mockResolvedValue([MOCK_UNIT])
    await request(app).get('/api/master/units').set('Authorization', `Bearer ${adminToken}`)
    expect(mockUnitFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    )
  })

  it('returns all when status=all', async () => {
    mockUnitFindMany.mockResolvedValue([MOCK_UNIT])
    await request(app)
      .get('/api/master/units?status=all')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(mockUnitFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })
})

// ─── PATCH /api/master/units/:id/status ───────────────────────────────────

describe('PATCH /api/master/units/:id/status', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).patch('/api/master/units/1/status').send({ isActive: false })
    expect(res.status).toBe(401)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app)
      .patch('/api/master/units/1/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ isActive: false })
    expect(res.status).toBe(403)
  })

  it('returns 400 when isActive is missing', async () => {
    const res = await request(app)
      .patch('/api/master/units/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('returns 404 when not found', async () => {
    mockUnitFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .patch('/api/master/units/999/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
    expect(res.status).toBe(404)
  })

  it('deactivates unit', async () => {
    mockUnitFindUnique.mockResolvedValue(MOCK_UNIT)
    mockUnitUpdate.mockResolvedValue({ ...MOCK_UNIT, isActive: false })
    const res = await request(app)
      .patch('/api/master/units/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(false)
  })

  it('activates unit', async () => {
    mockUnitFindUnique.mockResolvedValue({ ...MOCK_UNIT, isActive: false })
    mockUnitUpdate.mockResolvedValue(MOCK_UNIT)
    const res = await request(app)
      .patch('/api/master/units/1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(true)
  })
})
