import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/app'

const SECRET = process.env.JWT_SECRET ?? ''
const adminToken = jwt.sign({ userId: 1, role: 'admin' }, SECRET, { expiresIn: '1h' })

jest.mock('@cpd/db', () => ({
  __esModule: true,
  default: { $queryRaw: jest.fn() },
}))

describe('POST /api/products — Zod validation', () => {
  it('returns 400 with field errors when name is missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.error)).toBe(true)
    const nameError = res.body.error.find((e: { field: string }) => e.field === 'name')
    expect(nameError).toBeDefined()
    expect(nameError.message).toMatch(/required/i)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test' })
    expect(res.status).toBe(400)
    expect(Array.isArray(res.body.error)).toBe(true)
  })

  it('returns 201 when all required fields are valid', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ไม้พาเลท', sku: 'PAL-001', unit: 'แผ่น', costPrice: 50, salePrice: 80 })
    expect(res.status).toBe(201)
    expect(res.body.message).toBe('ok')
  })
})
