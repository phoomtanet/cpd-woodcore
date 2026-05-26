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
      findUnique: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Admin',
        email: 'admin@cpd.com',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
      }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'Admin',
          email: 'admin@cpd.com',
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 2,
          name: 'Manager',
          email: 'manager@cpd.com',
          role: 'manager',
          isActive: true,
          createdAt: new Date(),
        },
      ]),
      create: jest.fn().mockResolvedValue({
        id: 3,
        name: 'Staff One',
        email: 'staff1@cpd.com',
        role: 'staff',
        isActive: true,
        createdAt: new Date(),
      }),
      update: jest.fn().mockResolvedValue({
        id: 2,
        name: 'Manager',
        email: 'manager@cpd.com',
        role: 'manager',
        isActive: true,
        createdAt: new Date(),
      }),
      delete: jest.fn().mockResolvedValue({ id: 3 }),
    },
  },
}))

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

describe('DELETE /api/users/:id', () => {
  it('returns 200 when admin deletes user', async () => {
    const res = await request(app)
      .delete('/api/users/3')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toBeNull()
  })

  it('returns 403 when manager tries to delete', async () => {
    const res = await request(app)
      .delete('/api/users/3')
      .set('Authorization', `Bearer ${managerToken}`)
    expect(res.status).toBe(403)
  })
})
