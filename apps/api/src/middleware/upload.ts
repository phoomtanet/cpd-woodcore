import multer from 'multer'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'products')

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const uploadProductImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image')

export async function saveResizedImage(buffer: Buffer): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const filepath = path.join(UPLOADS_DIR, filename)
  await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(filepath)
  return `/uploads/products/${filename}`
}
