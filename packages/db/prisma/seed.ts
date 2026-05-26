import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const adminHash = await bcrypt.hash('Admin@cpd2024', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cpd.com' },
    update: {},
    create: {
      name: 'ผู้ดูแลระบบ',
      email: 'admin@cpd.com',
      passwordHash: adminHash,
      role: 'admin',
    },
  })
  console.log(`✓ User: ${admin.email} (${admin.role})`)

  // Manager user
  const managerHash = await bcrypt.hash('Manager@cpd2024', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@cpd.com' },
    update: {},
    create: {
      name: 'ผู้จัดการคลัง',
      email: 'manager@cpd.com',
      passwordHash: managerHash,
      role: 'manager',
    },
  })
  console.log(`✓ User: ${manager.email} (${manager.role})`)

  // Sample products for a wood pallet factory
  const products = [
    {
      name: 'ไม้ซุงยูคาลิปตัส',
      sku: 'RM-EUCALYPTUS-001',
      barcode: '8851234560001',
      category: 'วัตถุดิบหลัก',
      productType: 'raw' as const,
      unit: 'ท่อน',
      costPrice: 120.0,
      salePrice: 0.0,
      minStock: 100,
    },
    {
      name: 'ไม้แปรรูป 2x4 นิ้ว',
      sku: 'RM-LUMBER-2X4',
      barcode: '8851234560002',
      category: 'วัตถุดิบหลัก',
      productType: 'raw' as const,
      unit: 'แผ่น',
      costPrice: 45.0,
      salePrice: 0.0,
      minStock: 500,
    },
    {
      name: 'ตะปูเหล็ก 3 นิ้ว',
      sku: 'RM-NAIL-3IN',
      barcode: '8851234560003',
      category: 'อุปกรณ์',
      productType: 'raw' as const,
      unit: 'กิโลกรัม',
      costPrice: 55.0,
      salePrice: 0.0,
      minStock: 50,
    },
    {
      name: 'ไม้พาเลทกึ่งสำเร็จ (ประกอบขา)',
      sku: 'WIP-PALLET-FRAME',
      barcode: '8851234560004',
      category: 'งานระหว่างผลิต',
      productType: 'wip' as const,
      unit: 'ชิ้น',
      costPrice: 85.0,
      salePrice: 0.0,
      minStock: 50,
    },
    {
      name: 'พาเลทไม้มาตรฐาน 80×120 ซม.',
      sku: 'FG-PALLET-80X120',
      barcode: '8851234560005',
      category: 'สินค้าสำเร็จรูป',
      productType: 'finished' as const,
      unit: 'ชิ้น',
      costPrice: 180.0,
      salePrice: 250.0,
      minStock: 200,
    },
  ]

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    })
    console.log(`✓ Product: [${product.productType}] ${product.name} (${product.sku})`)
  }

  console.log('\nSeed completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
