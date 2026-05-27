import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/app'

const SECRET = process.env.JWT_SECRET ?? ''
const adminToken = jwt.sign({ userId: 1, role: 'admin' }, SECRET, { expiresIn: '1h' })
const managerToken = jwt.sign({ userId: 2, role: 'manager' }, SECRET, { expiresIn: '1h' })

const MOCK_ROLES = [
  { id: 1, name: 'admin', label: 'ผู้ดูแลระบบ', createdAt: new Date() },
  { id: 2, name: 'manager', label: 'ผู้จัดการ', createdAt: new Date() },
  { id: 3, name: 'staff', label: 'พนักงาน', createdAt: new Date() },
]

jest.mock('@cpd/db', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import prisma from '@cpd/db'
const mockFindMany = prisma.role.findMany as jest.Mock
const mockFindUnique = prisma.role.findUnique as jest.Mock
const mockCreate = prisma.role.create as jest.Mock
const mockUpdate = prisma.role.update as jest.Mock
const mockDelete = prisma.role.delete as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe('GET /api/roles', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/roles')
    expect(res.status).toBe(401)
  })

  it('returns 200 with role list for admin', async () => {
    mockFindMany.mockResolvedValue(MOCK_ROLES)
    const res = await request(app).get('/api/roles').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(3)
    expect(res.body.data[0].name).toBe('admin')
  })

  it('returns 200 with role list for manager', async () => {
    mockFindMany.mockResolvedValue(MOCK_ROLES)
    const res = await request(app).get('/api/roles').set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(200)
  })
})

describe('POST /api/roles', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'supervisor', label: 'หัวหน้า' })
    expect(res.status).toBe(403)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'หัวหน้า' })
    expect(res.status).toBe(400)
  })

  it('returns 409 when name already exists', async () => {
    mockFindUnique.mockResolvedValue(MOCK_ROLES[0])
    const res = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'admin', label: 'ผู้ดูแลระบบ' })
    expect(res.status).toBe(409)
  })

  it('returns 201 when admin creates role', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({
      id: 4,
      name: 'supervisor',
      label: 'หัวหน้า',
      createdAt: new Date(),
    })
    const res = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'supervisor', label: 'หัวหน้า' })
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('supervisor')
  })
})

describe('PUT /api/roles/:id', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .put('/api/roles/1')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ label: 'New Label' })
    expect(res.status).toBe(403)
  })

  it('returns 404 when role not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .put('/api/roles/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'New Label' })
    expect(res.status).toBe(404)
  })

  it('returns 200 when admin updates role', async () => {
    mockFindUnique.mockResolvedValue(MOCK_ROLES[0])
    mockUpdate.mockResolvedValue({ ...MOCK_ROLES[0], label: 'New Label' })
    const res = await request(app)
      .put('/api/roles/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: 'New Label' })
    expect(res.status).toBe(200)
    expect(res.body.data.label).toBe('New Label')
  })
})

describe('DELETE /api/roles/:id', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .delete('/api/roles/1')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 when role not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .delete('/api/roles/999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })

  it('returns 200 when admin deletes role', async () => {
    mockFindUnique.mockResolvedValue(MOCK_ROLES[0])
    mockDelete.mockResolvedValue(MOCK_ROLES[0])
    const res = await request(app)
      .delete('/api/roles/1')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})
