import app from './app'

const required = ['DATABASE_URL', 'JWT_SECRET']
required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`API running on port ${PORT}`))
