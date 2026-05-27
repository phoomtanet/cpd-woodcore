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
    user: {
      findFirst: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Admin',
        email: 'admin@cpd.com',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        deletedAt: null,
      }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'Admin',
          email: 'admin@cpd.com',
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
          deletedAt: null,
        },
        {
          id: 2,
          name: 'Manager',
          email: 'manager@cpd.com',
          role: 'manager',
          isActive: true,
          createdAt: new Date(),
          deletedAt: null,
        },
      ]),
      create: jest.fn().mockResolvedValue({
        id: 3,
        name: 'Staff One',
        email: 'staff1@cpd.com',
        role: 'staff',
        isActive: true,
        createdAt: new Date(),
        deletedAt: null,
      }),
      update: jest.fn().mockResolvedValue({
        id: 2,
        name: 'Manager',
        email: 'manager@cpd.com',
        role: 'manager',
        isActive: true,
        createdAt: new Date(),
        deletedAt: null,
      }),
    },
  },
}))

import prisma from '@cpd/db'
const mockFindFirst = prisma.user.findFirst as jest.Mock
const mockFindMany = prisma.user.findMany as jest.Mock
const mockUpdate = prisma.user.update as jest.Mock

describe('GET /api/users — role guard', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(401)
  })

  it('returns 403 when manager', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 403 when staff', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${staffToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 200 with user list when admin', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(2)
  })

  it('filters out soft-deleted users', async () => {
    await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) })
    )
  })
})

describe('POST /api/users — validation', () => {
  it('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.error)).toBe(true)
  })

  it('returns 400 when password too short', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test', email: 'test@cpd.com', password: '123', role: 'staff' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test', email: 'not-an-email', password: 'password123', role: 'staff' })
    expect(res.status).toBe(400)
  })

  it('returns 409 when email already exists', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test', email: 'admin@cpd.com', password: 'password123', role: 'staff' })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already exists/i)
  })
})

describe('PUT /api/users/:id — update user', () => {
  it('returns 200 when admin updates role', async () => {
    const res = await request(app)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'manager' })
    expect(res.status).toBe(200)
    expect(res.body.data.role).toBe('manager')
  })

  it('returns 400 when role value is invalid', async () => {
    const res = await request(app)
      .put('/api/users/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'superadmin' })
    expect(res.status).toBe(400)
  })

  it('returns 403 when manager tries to update', async () => {
    const res = await request(app)
      .put('/api/users/3')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ role: 'staff' })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/users/:id — soft delete', () => {
  it('returns 200 and soft-deletes (sets deletedAt)', async () => {
    mockUpdate.mockResolvedValueOnce({ id: 3, deletedAt: new Date() })
    const res = await request(app)
      .delete('/api/users/3')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
    )
  })

  it('returns 403 when manager tries to delete', async () => {
    const res = await request(app)
      .delete('/api/users/3')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 when user not found (already soft-deleted or never existed)', async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    const res = await request(app)
      .delete('/api/users/999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/auth/login — soft-deleted user', () => {
  it('returns 401 when user is soft-deleted', async () => {
    // findFirst with deletedAt: null returns null for soft-deleted user
    mockFindFirst.mockResolvedValueOnce(null)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'deleted@cpd.com', password: 'password123' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })
})
