import request from 'supertest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import app from '../src/app'

const HASH = bcrypt.hashSync('Admin@cpd2024', 10)
const MOCK_USER = {
  id: 1,
  name: 'ผู้ดูแลระบบ',
  email: 'admin@cpd.com',
  passwordHash: HASH,
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
}

jest.mock('@cpd/db', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
    },
  },
}))

import prisma from '@cpd/db'
const mockFindUnique = prisma.user.findFirst as jest.Mock

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns token when credentials are correct', async () => {
    mockFindUnique.mockResolvedValue(MOCK_USER)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cpd.com', password: 'Admin@cpd2024' })

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('ok')
    expect(res.body.data.token).toBeDefined()
    expect(res.body.data.user.email).toBe('admin@cpd.com')
    expect(res.body.data.user.role).toBe('admin')

    const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET ?? '') as {
      userId: number
      role: string
    }
    expect(decoded.userId).toBe(1)
    expect(decoded.role).toBe('admin')
  })

  it('returns 401 when password is wrong', async () => {
    mockFindUnique.mockResolvedValue(MOCK_USER)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cpd.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 401 when user does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@cpd.com', password: 'somepassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 401 when user is inactive', async () => {
    mockFindUnique.mockResolvedValue({ ...MOCK_USER, isActive: false })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cpd.com', password: 'Admin@cpd2024' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'Admin@cpd2024' })

    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.error)).toBe(true)
  })
})
