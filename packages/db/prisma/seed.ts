import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Seed roles first
  const roleData = [
    { name: 'admin', label: 'ผู้ดูแลระบบ' },
    { name: 'manager', label: 'ผู้จัดการ' },
    { name: 'staff', label: 'พนักงาน' },
  ]

  const roleMap: Record<string, number> = {}
  for (const r of roleData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { label: r.label },
      create: r,
    })
    roleMap[role.name] = role.id
    console.log(`✓ Role: ${role.name} (${role.label})`)
  }

  // Admin user
  const adminHash = await bcrypt.hash('Admin@cpd2024', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cpd.com' },
    update: {},
    create: {
      name: 'ผู้ดูแลระบบ',
      email: 'admin@cpd.com',
      passwordHash: adminHash,
      roleId: roleMap['admin'],
    },
  })
  console.log(`✓ User: ${admin.email}`)

  // Manager user
  const managerHash = await bcrypt.hash('Manager@cpd2024', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@cpd.com' },
    update: {},
    create: {
      name: 'ผู้จัดการคลัง',
      email: 'manager@cpd.com',
      passwordHash: managerHash,
      roleId: roleMap['manager'],
    },
  })
  console.log(`✓ User: ${manager.email}`)

  // Sample products
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

  // Default role permissions
  type PermDef = { canView: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }
  type RoleKey = 'admin' | 'manager' | 'staff'

  const MENUS = [
    'dashboard',
    'products',
    'stock-in',
    'stock-out',
    'stock-adjust',
    'stock-transfer',
    'stock-card',
    'alerts',
    'reports',
    'users',
    'settings',
  ]

  const DEFAULTS: Record<RoleKey, Record<string, PermDef>> = {
    admin: Object.fromEntries(
      MENUS.map((m) => [m, { canView: true, canCreate: true, canUpdate: true, canDelete: true }])
    ),
    manager: {
      dashboard: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      products: { canView: true, canCreate: true, canUpdate: true, canDelete: false },
      'stock-in': { canView: true, canCreate: true, canUpdate: false, canDelete: false },
      'stock-out': { canView: true, canCreate: true, canUpdate: false, canDelete: false },
      'stock-adjust': { canView: true, canCreate: true, canUpdate: false, canDelete: false },
      'stock-transfer': { canView: true, canCreate: true, canUpdate: false, canDelete: false },
      'stock-card': { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      alerts: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      reports: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      users: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
      settings: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
    },
    staff: {
      dashboard: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      products: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      'stock-in': { canView: true, canCreate: true, canUpdate: false, canDelete: false },
      'stock-out': { canView: true, canCreate: true, canUpdate: false, canDelete: false },
      'stock-adjust': { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      'stock-transfer': { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      'stock-card': { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      alerts: { canView: true, canCreate: false, canUpdate: false, canDelete: false },
      reports: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
      users: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
      settings: { canView: false, canCreate: false, canUpdate: false, canDelete: false },
    },
  }

  for (const roleName of ['admin', 'manager', 'staff'] as RoleKey[]) {
    const roleId = roleMap[roleName]
    for (const menuKey of MENUS) {
      const perm = DEFAULTS[roleName][menuKey]
      await prisma.rolePermission.upsert({
        where: { roleId_menuKey: { roleId, menuKey } },
        update: {},
        create: { roleId, menuKey, ...perm },
      })
    }
    console.log(`✓ Permissions seeded for role: ${roleName}`)
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
