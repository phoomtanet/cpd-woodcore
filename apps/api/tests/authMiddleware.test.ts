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
        name: 'ผู้ดูแลระบบ',
        email: 'admin@cpd.com',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
      }),
    },
    product: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 1,
        name: 'ไม้พาเลท',
        sku: 'PAL-TEST-001',
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
      }),
    },
  },
}))

describe('authenticate middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Unauthorized')
  })

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid or expired token')
  })

  it('returns 200 with valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe('admin@cpd.com')
  })
})

describe('requireRole middleware', () => {
  const validProduct = {
    name: 'ไม้พาเลท',
    sku: 'PAL-TEST-001',
    unit: 'แผ่น',
    costPrice: 50,
    salePrice: 80,
  }

  it('returns 401 when no token provided', async () => {
    const res = await request(app).post('/api/products').send(validProduct)
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is staff (requires manager+)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${staffToken}`)
      .send(validProduct)
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Forbidden: insufficient role')
  })

  it('returns 201 when role is manager', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${managerToken}`)
      .send(validProduct)
    expect(res.status).toBe(201)
  })

  it('returns 201 when role is admin', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProduct)
    expect(res.status).toBe(201)
  })
})
