import request from 'supertest'
import app from '../src/app'

jest.mock('@cpd/db', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

describe('GET /api/health', () => {
  it('returns 200 with status ok when db is connected', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.db).toBe('connected')
    expect(typeof res.body.uptime).toBe('number')
  })
})

describe('Global Error Handler', () => {
  it('returns 400 for malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{invalid json}')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid JSON body')
  })
})
