import { PrismaClient, TxType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Seed realistic usage data for a wood-pallet factory.
 * Period: 2026-01-01 → 2026-06-13
 *
 * Flow simulated each business day (Mon–Sat):
 *  - รับวัตถุดิบเข้า (ไม้ซุง / ไม้แปรรูป / ตะปู) เป็นรอบ ๆ
 *  - เบิกวัตถุดิบเข้าผลิต (out)
 *  - ผลิตพาเลทกึ่งสำเร็จ (wip) + พาเลทสำเร็จรูป (in)
 *  - จัดส่งพาเลทให้ลูกค้า (out)
 *  - โอนย้ายพาเลทไปคลังสาขา (transfer) รายสัปดาห์
 *  - ตรวจนับสต๊อกประจำเดือน (adjust)
 *
 * Re-runnable: ล้าง StockTransaction + ProductStock เดิมก่อนสร้างใหม่
 */

// ---- deterministic PRNG (LCG) — ผลซ้ำเดิมทุกครั้งที่รัน ----
let _seed = 20260101
function rnd(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff
  return _seed / 0x7fffffff
}
function randInt(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min
}
function chance(p: number): boolean {
  return rnd() < p
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]
}

const SUPPLIERS = ['สวนป่ายูคาภาคตะวันออก', 'โรงเลื่อยสมศักดิ์', 'ร้านวัสดุก่อสร้างเจริญพร']
const CUSTOMERS = [
  'บจก. ไทยโลจิสติกส์',
  'บจก. สยามฟู้ดส์',
  'โรงงานน้ำตาลมิตรผล',
  'บจก. ซีพีเอฟ',
  'คลังสินค้าลาดกระบัง',
  'บจก. เอสซีจี แพคเกจจิ้ง',
]

const RAW = { euca: 'RM-EUCALYPTUS-001', lumber: 'RM-LUMBER-2X4', nail: 'RM-NAIL-3IN' }
const WIP_SKU = 'WIP-PALLET-FRAME'
const FG_SKU = 'FG-PALLET-80X120'

type TxRow = {
  productId: number
  type: TxType
  quantity: number
  warehouseId: number
  toWarehouseId?: number | null
  binId?: number | null
  toBinId?: number | null
  reason?: string | null
  note?: string | null
  userId: number
  createdAt: Date
}

async function main() {
  console.log('Seeding realistic usage data (2026-01-01 → 2026-06-13)...\n')

  // ---- master data lookups ----
  const products = await prisma.product.findMany({ where: { deletedAt: null } })
  const bySku: Record<string, (typeof products)[number]> = {}
  for (const p of products) bySku[p.sku] = p

  const warehouses = await prisma.warehouse.findMany({ where: { isActive: true } })
  const main = warehouses.find((w) => w.code === 'WH-MAIN')
  const branch = warehouses.find((w) => w.code === 'WH-BRANCH')
  if (!main) throw new Error('ไม่พบคลังหลัก (WH-MAIN) — รัน prisma db seed ก่อน')

  const bins = await prisma.binLocation.findMany({ where: { isActive: true } })
  const binId = (warehouseId: number, code: string) =>
    bins.find((b) => b.warehouseId === warehouseId && b.code === code)?.id ?? null

  // ---- users (staff รับ/เบิก, manager โอน/ปรับ) ----
  const staffRole = await prisma.role.findUnique({ where: { name: 'staff' } })
  if (!staffRole) throw new Error('ไม่พบ role staff — รัน prisma db seed ก่อน')
  const staff = await prisma.user.upsert({
    where: { email: 'staff@cpd.com' },
    update: {},
    create: {
      name: 'พนักงานคลัง',
      email: 'staff@cpd.com',
      passwordHash: await bcrypt.hash('Staff@cpd2024', 10),
      roleId: staffRole.id,
    },
  })
  const manager = await prisma.user.findUnique({ where: { email: 'manager@cpd.com' } })
  const managerId = manager?.id ?? staff.id

  // ---- home bins ----
  const MAIN = main.id
  const BRANCH = branch?.id ?? null
  const homeBin: Record<string, number | null> = {
    [RAW.euca]: binId(MAIN, 'A-01'),
    [RAW.lumber]: binId(MAIN, 'A-02'),
    [RAW.nail]: binId(MAIN, 'B-01'),
    [WIP_SKU]: binId(MAIN, 'B-02'),
    [FG_SKU]: binId(MAIN, 'A-01'),
  }
  const branchBin = BRANCH ? binId(BRANCH, 'A-01') : null

  // ---- in-memory running balance per (productId:warehouseId) ----
  const balance = new Map<string, number>()
  const key = (pid: number, wid: number) => `${pid}:${wid}`
  const bal = (pid: number, wid: number) => balance.get(key(pid, wid)) ?? 0
  const setBal = (pid: number, wid: number, q: number) => balance.set(key(pid, wid), q)

  const rows: TxRow[] = []

  function emitIn(sku: string, wid: number, qty: number, at: Date, userId: number, note?: string) {
    const p = bySku[sku]
    if (!p || qty <= 0) return
    setBal(p.id, wid, bal(p.id, wid) + qty)
    rows.push({
      productId: p.id,
      type: 'in',
      quantity: qty,
      warehouseId: wid,
      binId: wid === MAIN ? homeBin[sku] : branchBin,
      note: note ?? null,
      userId,
      createdAt: at,
    })
  }

  function emitOut(
    sku: string,
    wid: number,
    qty: number,
    at: Date,
    userId: number,
    reason?: string,
    note?: string
  ): number {
    const p = bySku[sku]
    if (!p) return 0
    const available = bal(p.id, wid)
    const take = Math.min(qty, available)
    if (take <= 0) return 0
    setBal(p.id, wid, available - take)
    rows.push({
      productId: p.id,
      type: 'out',
      quantity: take,
      warehouseId: wid,
      binId: wid === MAIN ? homeBin[sku] : branchBin,
      reason: reason ?? null,
      note: note ?? null,
      userId,
      createdAt: at,
    })
    return take
  }

  function emitTransfer(sku: string, qty: number, at: Date, userId: number, note?: string): number {
    const p = bySku[sku]
    if (!p || !BRANCH) return 0
    const available = bal(p.id, MAIN)
    const move = Math.min(qty, available)
    if (move <= 0) return 0
    setBal(p.id, MAIN, available - move)
    setBal(p.id, BRANCH, bal(p.id, BRANCH) + move)
    rows.push({
      productId: p.id,
      type: 'transfer',
      quantity: move,
      warehouseId: MAIN,
      toWarehouseId: BRANCH,
      binId: homeBin[sku],
      toBinId: branchBin,
      note: note ?? null,
      userId,
      createdAt: at,
    })
    return move
  }

  function emitAdjust(
    sku: string,
    wid: number,
    newQty: number,
    at: Date,
    userId: number,
    reason: string
  ) {
    const p = bySku[sku]
    if (!p) return
    setBal(p.id, wid, newQty)
    rows.push({
      productId: p.id,
      type: 'adjust',
      quantity: newQty,
      warehouseId: wid,
      binId: wid === MAIN ? homeBin[sku] : branchBin,
      reason,
      userId,
      createdAt: at,
    })
  }

  // ---- iterate business days ----
  const start = new Date(2026, 0, 1) // 2026-01-01
  const end = new Date(2026, 5, 13) // 2026-06-13
  let firstDay = true

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay() // 0=Sun
    if (dow === 0) continue // หยุดวันอาทิตย์

    let hour = 8
    const at = (h: number) => {
      const t = new Date(d)
      t.setHours(h, randInt(0, 59), randInt(0, 59), 0)
      return t
    }

    // วันแรกของระบบ — ตั้งสต๊อกเปิดบัญชี (รับเข้าก้อนใหญ่)
    if (firstDay) {
      emitIn(RAW.euca, MAIN, 400, at(8), staff.id, 'ยอดยกมา/รับเข้าเปิดบัญชี')
      emitIn(RAW.lumber, MAIN, 1600, at(8), staff.id, 'ยอดยกมา/รับเข้าเปิดบัญชี')
      emitIn(RAW.nail, MAIN, 160, at(9), staff.id, 'ยอดยกมา/รับเข้าเปิดบัญชี')
      emitIn(FG_SKU, MAIN, 250, at(9), staff.id, 'ยอดยกมา/รับเข้าเปิดบัญชี')
      firstDay = false
    }

    // รับวัตถุดิบเข้าเป็นรอบ
    if (chance(0.18))
      emitIn(
        RAW.euca,
        MAIN,
        randInt(140, 280),
        at(hour++),
        staff.id,
        `รับไม้ซุงจาก ${pick(SUPPLIERS)}`
      )
    if (chance(0.17))
      emitIn(
        RAW.lumber,
        MAIN,
        randInt(500, 1000),
        at(hour++),
        staff.id,
        `รับไม้แปรรูปจาก ${pick(SUPPLIERS)}`
      )
    if (chance(0.07))
      emitIn(
        RAW.nail,
        MAIN,
        randInt(80, 160),
        at(hour++),
        staff.id,
        `รับตะปูจาก ${pick(SUPPLIERS)}`
      )

    // ผลิต — เบิกวัตถุดิบ + ผลิตพาเลท
    if (chance(0.85)) {
      emitOut(RAW.euca, MAIN, randInt(28, 52), at(hour++), staff.id, 'เบิกผลิต')
      emitOut(RAW.lumber, MAIN, randInt(90, 180), at(hour++), staff.id, 'เบิกผลิต')
      emitOut(RAW.nail, MAIN, randInt(4, 12), at(hour++), staff.id, 'เบิกผลิต')

      // ผลิตพาเลทกึ่งสำเร็จ แล้วประกอบเป็นพาเลทสำเร็จรูป (เหลือ WIP buffer เล็กน้อย)
      const frames = randInt(30, 70)
      emitIn(WIP_SKU, MAIN, frames, at(hour++), staff.id, 'ผลิตโครงพาเลท')
      const assembled = Math.max(0, frames - randInt(0, 4))
      emitOut(WIP_SKU, MAIN, assembled, at(hour++), staff.id, 'ประกอบเป็นพาเลทสำเร็จรูป')
      emitIn(FG_SKU, MAIN, assembled, at(hour++), staff.id, 'ผลิตพาเลทสำเร็จรูป')
    }

    // จัดส่งลูกค้า
    if (chance(0.7)) {
      emitOut(
        FG_SKU,
        MAIN,
        randInt(25, 65),
        at(hour++),
        staff.id,
        undefined,
        `จัดส่ง ${pick(CUSTOMERS)}`
      )
    }
    // คลังสาขาจัดส่งเอง (ถ้ามีสต๊อก)
    if (BRANCH && chance(0.25)) {
      emitOut(
        FG_SKU,
        BRANCH,
        randInt(10, 30),
        at(hour++),
        staff.id,
        undefined,
        `จัดส่ง ${pick(CUSTOMERS)} (สาขา)`
      )
    }

    // โอนย้ายไปคลังสาขา (รายสัปดาห์ — วันศุกร์)
    if (BRANCH && dow === 5 && chance(0.8)) {
      emitTransfer(FG_SKU, randInt(20, 50), at(hour++), managerId, 'เติมสต๊อกคลังสาขา')
    }

    // ตรวจนับสต๊อกประจำเดือน (วันที่ 28–30)
    const dom = d.getDate()
    if (dom >= 28 && chance(0.5)) {
      const sku = pick([RAW.euca, RAW.lumber, RAW.nail, FG_SKU])
      const cur = bal(bySku[sku].id, MAIN)
      const counted = Math.max(0, cur + randInt(-5, 3)) // ผลตรวจนับคลาดเคลื่อนเล็กน้อย
      emitAdjust(sku, MAIN, counted, at(16), managerId, 'ตรวจนับสต๊อกประจำเดือน')
    }
  }

  // ---- ล้างข้อมูลเดิม ----
  const oldTx = await prisma.stockTransaction.count()
  await prisma.stockTransaction.deleteMany({})
  await prisma.productStock.deleteMany({})
  console.log(`✓ ล้าง StockTransaction เดิม ${oldTx} รายการ + ProductStock`)

  // ---- insert transactions (chronological, batched) ----
  rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.stockTransaction.createMany({ data: rows.slice(i, i + CHUNK) })
  }
  console.log(`✓ สร้าง StockTransaction ${rows.length} รายการ`)

  // ---- final ProductStock per (product × warehouse) + Product.currentStock ----
  let psCount = 0
  for (const p of products) {
    let total = 0
    for (const w of warehouses) {
      const q = bal(p.id, w.id)
      await prisma.productStock.create({
        data: { productId: p.id, warehouseId: w.id, quantity: q },
      })
      total += q
      psCount++
    }
    await prisma.product.update({ where: { id: p.id }, data: { currentStock: total } })
    console.log(`✓ ${p.sku.padEnd(20)} คงเหลือรวม ${total}`)
  }
  console.log(`✓ สร้าง ProductStock ${psCount} รายการ + อัปเดต currentStock`)

  console.log('\nSeed usage data completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
