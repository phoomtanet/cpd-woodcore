import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/app'

const SECRET = process.env.JWT_SECRET ?? ''
const adminToken = jwt.sign({ userId: 1, role: 'admin' }, SECRET, { expiresIn: '1h' })
const managerToken = jwt.sign({ userId: 2, role: 'manager' }, SECRET, { expiresIn: '1h' })
const staffToken = jwt.sign({ userId: 3, role: 'staff' }, SECRET, { expiresIn: '1h' })

const MOCK_PERM = {
  id: 1,
  role: 'manager',
  menuKey: 'products',
  canView: true,
  canCreate: true,
  canUpdate: true,
  canDelete: false,
  updatedAt: new Date(),
}

jest.mock('@cpd/db', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    rolePermission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

import prisma from '@cpd/db'
const mockFindMany = prisma.rolePermission.findMany as jest.Mock
const mockUpsert = prisma.rolePermission.upsert as jest.Mock

beforeEach(() => jest.clearAllMocks())

// ─── GET /api/role-permissions ─────────────────────────────────────────────

describe('GET /api/role-permissions', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/role-permissions')
    expect(res.status).toBe(401)
  })

  it('returns 403 for manager', async () => {
    const res = await request(app)
      .get('/api/role-permissions')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app)
      .get('/api/role-permissions')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 200 with all permissions (admin)', async () => {
    mockFindMany.mockResolvedValue([MOCK_PERM])
    const res = await request(app)
      .get('/api/role-permissions')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data[0].role).toBe('manager')
  })
})

// ─── GET /api/role-permissions/:role ──────────────────────────────────────

describe('GET /api/role-permissions/:role', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/role-permissions/manager')
    expect(res.status).toBe(401)
  })

  it('returns 200 for admin fetching any role config', async () => {
    mockFindMany.mockResolvedValue([MOCK_PERM])
    const res = await request(app)
      .get('/api/role-permissions/manager')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data[0].menuKey).toBe('products')
  })

  it('returns 200 for manager fetching own role config', async () => {
    mockFindMany.mockResolvedValue([MOCK_PERM])
    const res = await request(app)
      .get('/api/role-permissions/manager')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(200)
  })

  it('returns 200 for staff fetching own role config', async () => {
    mockFindMany.mockResolvedValue([])
    const res = await request(app)
      .get('/api/role-permissions/staff')
      .set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

// ─── PUT /api/role-permissions/:role/:menuKey ──────────────────────────────

describe('PUT /api/role-permissions/:role/:menuKey', () => {
  const validBody = { canView: true, canCreate: false, canUpdate: false, canDelete: false }

  it('returns 401 when no token', async () => {
    const res = await request(app).put('/api/role-permissions/manager/products').send(validBody)
    expect(res.status).toBe(401)
  })

  it('returns 403 for manager', async () => {
    const res = await request(app)
      .put('/api/role-permissions/manager/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(validBody)
    expect(res.status).toBe(403)
  })

  it('returns 403 for staff', async () => {
    const res = await request(app)
      .put('/api/role-permissions/staff/products')
      .set('Authorization', `Bearer ${staffToken}`)
      .send(validBody)
    expect(res.status).toBe(403)
  })

  it('returns 400 when canView is missing', async () => {
    const res = await request(app)
      .put('/api/role-permissions/manager/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ canCreate: true })
    expect(res.status).toBe(400)
  })

  it('returns 400 when value is not boolean', async () => {
    const res = await request(app)
      .put('/api/role-permissions/manager/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ canView: 'yes', canCreate: false, canUpdate: false, canDelete: false })
    expect(res.status).toBe(400)
  })

  it('returns 200 and updates permission (admin)', async () => {
    mockUpsert.mockResolvedValue({ ...MOCK_PERM, canCreate: false })
    const res = await request(app)
      .put('/api/role-permissions/manager/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validBody)
    expect(res.status).toBe(200)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role_menuKey: { role: 'manager', menuKey: 'products' } },
        update: validBody,
      })
    )
  })
})
