import multer from 'multer'
import path from 'path'
import fs from 'fs'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products')

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const uploadProductImage = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image')
