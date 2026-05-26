# ระบบสต๊อกสินค้า — บริษัท ซีพีดี ซอว์มิลล์ จำกัด

ระบบจัดการสต๊อกสินค้าสำหรับโรงงานผลิตพาเลทไม้ รองรับการรับ-จ่ายสินค้า แจ้งเตือน Low Stock และออกรายงาน Excel/CSV

---

## ขอบเขตระบบ (Scope)

### ✅ ทำได้ใน Phase นี้ (ง่าย — ใช้ stack ปัจจุบัน)
| ระบบ | Feature |
|---|---|
| Item Master | CRUD สินค้า, รูปภาพ, Barcode, หน่วย, ราคาทุน/ขาย, แยกประเภท (วัตถุดิบ/WIP/สำเร็จรูป) |
| Inventory | Stock In, Stock Out, ปรับสต๊อก (Adjust), โอนย้าย (Transfer), Stock Card, Low Stock Alert |
| Reports | Stock Balance, Inbound/Outbound, Inventory Movement, Export Excel/CSV |
| Auth | Login/JWT, Role (admin/manager/staff), User Management |

### 🔜 Phase ถัดไป (ซับซ้อน — ทำทีหลัง)
| ระบบ | เหตุผลที่ข้าม |
|---|---|
| ระบบการผลิต (WIP/Process) | ต้องออกแบบ data model เพิ่มมาก (process steps, lot tracking) |
| ระบบต้นทุน (Costing) | ขึ้นอยู่กับระบบผลิต, ต้องการ formula ต้นทุนสะสม |
| เชื่อม Express Accounting | ทำ CSV export ได้ก่อน, direct API sync ทำทีหลัง |

---

## Tech Stack

- **Docker** — containerize ทุก service
- **PostgreSQL** — relational database หลัก
- **Prisma ORM** — schema, migration, type-safe query
- **Next.js 14** (App Router) — dashboard UI (Tailwind CSS + shadcn/ui)
- **Node.js + Express** — REST API
- **JWT + bcrypt** — Authentication / Authorization
- **ExcelJS** — Export รายงานเป็น Excel (.xlsx) และ CSV
- **Jest + Supertest** — Unit & Integration test (API)
- **Git Monorepo** — จัดการ codebase

---

## Monorepo Structure

```
cpd-woodcore/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── routes/         # auth, products, stock, reports, users
│   │   │   ├── controllers/
│   │   │   ├── middleware/     # authMiddleware, roleMiddleware
│   │   │   └── utils/
│   │   ├── tests/
│   │   │   ├── auth.test.ts
│   │   │   ├── products.test.ts
│   │   │   └── stock.test.ts
│   │   └── package.json
│   └── web/
│       ├── app/
│       │   ├── (auth)/login/
│       │   └── (dashboard)/
│       │       ├── products/       # รายการสินค้า
│       │       ├── stock-in/       # รับสินค้าเข้า
│       │       ├── stock-out/      # เบิกสินค้าออก
│       │       ├── stock-adjust/   # ปรับสต๊อก
│       │       ├── stock-transfer/ # โอนย้าย
│       │       ├── stock-card/     # Stock Card รายสินค้า
│       │       ├── alerts/         # Low Stock
│       │       ├── reports/        # รายงาน + Export
│       │       └── users/          # admin only
│       └── package.json
├── packages/
│   └── db/
│       ├── prisma/
│       │   ├── schema.prisma       # models + enums ทั้งหมด
│       │   └── migrations/
│       ├── src/
│       │   └── index.ts            # export PrismaClient instance
│       └── package.json
├── docker-compose.yml
└── package.json
```

---

## User Roles

| Role | สิทธิ์ |
|---|---|
| `admin` | ทุกอย่าง รวมถึงจัดการ user |
| `manager` | ดู/เพิ่ม/แก้ไขสินค้า, รับ-จ่าย-ปรับ-โอน, ดูรายงาน |
| `staff` | รับ-จ่ายสินค้า, ดูสต๊อก |

---

## Data Models (Prisma Schema)

```prisma
enum Role {
  admin
  manager
  staff
}

enum ProductType {
  raw       // วัตถุดิบ
  wip       // WIP
  finished  // สินค้าสำเร็จรูป
}

enum TxType {
  in
  out
  adjust
  transfer
}

model User {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(staff)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  transactions StockTransaction[]
}

model Product {
  id           Int         @id @default(autoincrement())
  name         String
  sku          String      @unique
  barcode      String?
  image        String?
  category     String?
  productType  ProductType @default(raw)
  unit         String
  costPrice    Decimal     @db.Decimal(12,2)
  salePrice    Decimal     @db.Decimal(12,2)
  minStock     Int         @default(0)
  currentStock Int         @default(0)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  transactions StockTransaction[]
}

model StockTransaction {
  id           Int      @id @default(autoincrement())
  product      Product  @relation(fields: [productId], references: [id])
  productId    Int
  type         TxType
  quantity     Int
  fromLocation String?
  toLocation   String?
  reason       String?
  note         String?
  createdBy    User     @relation(fields: [userId], references: [id])
  userId       Int
  createdAt    DateTime @default(now())
}
```

---

## API Endpoints

| Method | Path | Role | คำอธิบาย |
|---|---|---|---|
| POST | `/api/auth/login` | * | Login รับ JWT |
| GET | `/api/auth/me` | auth | ดูข้อมูลตัวเอง |
| GET | `/api/health` | * | Health check (status + db + uptime) |
| GET/POST | `/api/products` | manager+ | รายการ / เพิ่มสินค้า |
| GET/PUT/DELETE | `/api/products/:id` | manager+ | ดู / แก้ไข / ลบ |
| POST | `/api/stock/in` | staff+ | รับสินค้าเข้า |
| POST | `/api/stock/out` | staff+ | เบิกสินค้าออก |
| POST | `/api/stock/adjust` | manager+ | ปรับสต๊อก |
| POST | `/api/stock/transfer` | manager+ | โอนย้ายสินค้า |
| GET | `/api/stock/card/:productId` | staff+ | Stock Card รายสินค้า |
| GET | `/api/stock/history` | staff+ | ประวัติทุกสินค้า |
| GET | `/api/stock/low-alert` | staff+ | สินค้า Low Stock |
| GET | `/api/reports/balance` | manager+ | Stock Balance |
| GET | `/api/reports/movement` | manager+ | Inbound / Outbound |
| GET | `/api/reports/export` | manager+ | Export Excel / CSV |
| GET/POST | `/api/users` | admin | จัดการ user |
| PUT/DELETE | `/api/users/:id` | admin | แก้ไข / ลบ user |

---

## Dev Standards (บังคับใช้ทุก Phase)

> กฎเหล่านี้ป้องกันบัคที่พบบ่อยที่สุด — ต้องทำก่อนเขียน feature จริง

### 1. Input Validation — Zod (API)
ทุก route ที่รับ body/query ต้อง validate ด้วย Zod ก่อน controller
```ts
const schema = z.object({ name: z.string().min(1), qty: z.number().int().positive() })
const data = schema.parse(req.body)  // throws ZodError → global handler จัดการ
```

### 2. Global Error Handler (Express)
middleware ตัวสุดท้ายใน `apps/api/src/index.ts` — format error response สม่ำเสมอ
```ts
app.use((err, req, res, next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: err.errors })
  if (err instanceof PrismaClientKnownRequestError) { /* handle P2002 unique, P2025 not found */ }
  res.status(500).json({ error: 'Internal server error' })
})
```

### 3. Prisma Transaction สำหรับ Stock Operations
Stock In/Out/Adjust/Transfer ต้อง update `currentStock` + สร้าง `StockTransaction` ใน transaction เดียวกัน — ถ้า crash กลางคัน stock จะไม่ผิด
```ts
await prisma.$transaction([
  prisma.product.update({ where: { id }, data: { currentStock: { increment: qty } } }),
  prisma.stockTransaction.create({ data: { ... } })
])
```

### 4. Env Validation ตอน Startup
validate ทุก required env var ก่อน server เริ่ม — ถ้าขาดให้ crash ทันทีพร้อม error ชัดเจน
```ts
const required = ['DATABASE_URL', 'JWT_SECRET']
required.forEach(k => { if (!process.env[k]) throw new Error(`Missing env: ${k}`) })
```

### 5. Consistent API Response Format
```ts
// Success
res.json({ data: result, message: 'ok' })
// Error (จาก global handler)
res.status(400).json({ error: 'message', details?: [...] })
```

### 6. ESLint + Prettier
- `@typescript-eslint/no-explicit-any` — ห้ามใช้ `any`
- `@typescript-eslint/no-unused-vars` — ห้ามมี unused variables
- Prettier format ก่อน commit ทุกครั้ง (ผ่าน lint-staged)

---

## Task Management Rules (สำหรับ AI)

> 1. **เริ่ม task** → เปลี่ยน `[ ]` เป็น `[~]`
> 2. **เจอปัญหา** → เพิ่ม FIX ใต้ task นั้นทันที
> 3. **fix เสร็จ** → `[x]` + เพิ่ม `🧪 test:` และ `📝 commit:` ใต้ FIX item นั้น
> 4. **task เสร็จ** → `[x]` + เพิ่ม `🧪 test:` และ `📝 commit:` ใต้ task หลัก
> 5. **ห้ามลบ** FIX ที่เสร็จแล้ว — เก็บ `[x]` ไว้เป็น history

**สัญลักษณ์:**

| สัญลักษณ์ | ความหมาย |
|---|---|
| `[ ]` | ยังไม่เริ่ม |
| `[~]` | กำลังทำอยู่ |
| `[x]` | เสร็จแล้ว |
| `FIX #N:` | sub-task แก้ปัญหา (สร้างอัตโนมัติ) |
| `before/after:` | แสดงก่อน-หลังแก้ (ถ้าสั้นพอ) |
| `fix:` | สรุปวิธีแก้สั้นๆ (ถ้ายาวเกิน) |
| `🧪 test:` | วิธีทดสอบ + ผลที่ควรเห็น |
| `📝 commit:` | ชื่อ git commit ที่แนะนำ |

**โครงสร้าง:**

```
- [x] 1.1 task หลัก
  - 🧪 test: <คำสั่ง> → <ผลที่ควรเห็น>
  - 📝 commit: `feat(1.1): ...`

  - [x] FIX #1: <ปัญหา> | before: ... → after: ...
    - 🧪 test: <คำสั่ง> → <ผลที่ควรเห็น>
    - 📝 commit: `fix(1.1): ...`
```

<!-- ทำ   เสร็จแล้วให้ test ถ้าผ่านให้ x  ไม่ผ่านให้แก้จนผ่าน แล้ว x -->
---

## Tasks

### Phase 1 — Project Setup

- [x] 1.1 สร้าง Monorepo structure + ตั้งค่า npm workspaces
  - 🧪 test: `npm install` root → ไม่มี error ✅
  - 📝 commit: `chore: init monorepo workspace`

- [x] 1.2 ตั้งค่า Docker Compose (PostgreSQL + API + Web)
  - 🧪 test: `docker compose up` → ทุก container ขึ้นปกติ ✅
  - 📝 commit: `chore: add docker-compose`
  - หมายเหตุ: ใช้ Supabase แทน local PostgreSQL (credentials อยู่ใน .env)

- [x] 1.3 ตั้งค่า Prisma ใน packages/db + เขียน schema.prisma + migrate
  - 🧪 test: `npx prisma migrate dev` → migration สำเร็จ, tables ตรงกับ schema ✅
  - 📝 commit: `feat(db): add prisma schema and initial migration`

  - [x] FIX #1: Prisma หา `.env` ไม่เจอเมื่อรันจาก packages/db | fix: สร้าง `packages/db/.env` แยก
    - 📝 commit: `fix(db): add local .env for prisma cli`

  - [x] FIX #2: IDE แสดง error ว่า `url`/`directUrl` ไม่รองรับ | fix: false positive จาก VS Code Prisma extension ที่ใช้ rules Prisma 6 — Prisma 5.22.0 รองรับปกติ

- [x] 1.4 ตั้งค่า Express API พื้นฐาน + เชื่อม PostgreSQL ผ่าน Prisma + Health endpoint
  - 🧪 test: `GET http://localhost:3061/api/health` → `{ status: "ok", db: "connected", uptime: 8.27 }` ✅
  - 📝 commit: `feat(api): setup express with prisma and health endpoint`

  - [x] FIX #1: `@prisma/client did not initialize` | fix: เพิ่ม `RUN cd packages/db && npx prisma generate` ใน Dockerfile
    - 📝 commit: `fix(api): run prisma generate in dockerfile`

  - [x] FIX #2: `libssl.so.1.1: No such file or directory` บน Alpine | fix: เพิ่ม `RUN apk add --no-cache openssl`
    - 📝 commit: `fix(api): add openssl to alpine dockerfile`

- [x] 1.5 ตั้งค่า Next.js + Tailwind CSS + shadcn/ui
  - 🧪 test: `npm run dev` → หน้าแรกแสดงผลได้ ไม่มี error ✅ | `npm run build` ✅
  - 📝 commit: `feat(web): setup nextjs tailwind shadcn`
  - [x] FIX: React version conflict (root node_modules/react=18.3.1 vs web=19.2.6) | fix: เพิ่ม react@^19.0.0 เป็น root dependency + overrides

- [x] 1.6 ตั้งค่า Jest + Supertest สำหรับ API test
  - 🧪 test: `npm test --workspace=apps/api` → PASS tests/health.test.ts (1 passed) ✅
  - 📝 commit: `chore(api): setup jest and supertest`
  - หมายเหตุ: แยก src/app.ts (Express app) ออกจาก src/index.ts (server start) เพื่อให้ Supertest import app ได้โดยไม่ bind port ซ้ำ

- [x] 1.7 สร้าง `.dockerignore` (api + web)
  - 🧪 test: `docker build` → context ขนาด 201KB (api) / 12KB (web) — ยืนยันว่า node_modules ไม่ถูก copy ✅
  - 📝 commit: `chore: add dockerignore`
  - หมายเหตุ: ใช้ `.dockerignore` ไฟล์เดียวที่ root เพราะทั้งสอง Dockerfile ใช้ `context: .`

- [x] 1.8 ตั้งค่า ESLint + Prettier + lint-staged + Husky
  - 🧪 test: `npm run lint` → ไม่มี error ✅ | commit ไฟล์ที่ใช้ `any` → hook บล็อกพร้อม error ✅
  - 📝 commit: `chore: add eslint prettier lint-staged`
  - [x] FIX: eslint-config-next@16 ดึง ESLint 10 มาแทน v8 | fix: ลบ eslint-config-next ออก ใช้ @typescript-eslint ตรงๆ แทนทั้งสอง workspace

- [ ] 1.9 เพิ่ม Env Validation + Global Error Handler ใน API
  - 🧪 test: ลบ `JWT_SECRET` จาก .env → server ไม่ start พร้อม error ชัดเจน, POST body ผิด format → 400 JSON ไม่ crash
  - 📝 commit: `feat(api): env validation and global error handler`

- [ ] 1.10 ติดตั้ง Zod ใน API + สร้าง validation schema ตัวอย่าง
  - 🧪 test: POST `/api/products` โดยไม่ส่ง `name` → 400 `{ error: [{field: "name", message: "Required"}] }`
  - 📝 commit: `feat(api): add zod request validation`

- [ ] 1.11 สร้าง Seed script (admin user + สินค้าตัวอย่าง)
  - 🧪 test: `npx prisma db seed` → มี admin@cpd.com + สินค้า 5 รายการใน DB
  - 📝 commit: `chore(db): add seed script`

---

### Phase 2 — ระบบ Authentication & User Management

- [ ] 2.1 API: Login + ออก JWT (`POST /api/auth/login`) + seed admin user
  - 🧪 test: POST email/password ถูก → ได้ JWT กลับ, ผิด → 401
  - 📝 commit: `feat(api): auth login with jwt`

- [ ] 2.2 API: middleware ตรวจสอบ JWT + Role Guard
  - 🧪 test: ไม่มี token → 401, role ไม่ถึง → 403
  - 📝 commit: `feat(api): auth middleware and role guard`

- [ ] 2.3 API: CRUD user + เปลี่ยน role (admin only)
  - 🧪 test: admin สร้าง user ได้, staff สร้างไม่ได้ → 403
  - 📝 commit: `feat(api): user management endpoints`

- [ ] 2.4 Web: หน้า Login (form email/password, เก็บ JWT ใน httpOnly cookie)
  - 🧪 test: login สำเร็จ → redirect dashboard, ผิด → แสดง error
  - 📝 commit: `feat(web): login page with jwt cookie`

- [ ] 2.5 Web: ป้องกัน route (redirect ถ้าไม่ได้ login)
  - 🧪 test: เปิด `/dashboard` โดยไม่ login → redirect `/login`
  - 📝 commit: `feat(web): protected routes middleware`

- [ ] 2.6 Web: หน้าจัดการ User (admin only)
  - 🧪 test: admin เห็นหน้า Users, staff เข้าไม่ได้
  - 📝 commit: `feat(web): user management page`

- [ ] 2.7 Auto test: ครอบคลุม auth flow ทั้งหมด
  - 🧪 test: `npm test` → login, invalid token, role guard ผ่านทั้งหมด
  - 📝 commit: `test(api): auth and role guard tests`

---

### Phase 3 — ระบบสินค้า / Item Master

- [ ] 3.1 API: CRUD สินค้า + ค้นหา/filter + แยกประเภท (raw/wip/finished)
  - 🧪 test: POST/GET/PUT/DELETE `/api/products` → ทำงานถูกต้อง, filter productType ได้
  - 📝 commit: `feat(api): product CRUD with type and unit`

- [ ] 3.2 API: Upload รูปภาพสินค้า (multer)
  - 🧪 test: POST with image → ได้ URL รูปกลับมา
  - 📝 commit: `feat(api): product image upload`

- [ ] 3.3 Web: หน้ารายการสินค้า (ค้นหา, filter ประเภท, pagination, stock badge)
  - 🧪 test: แสดงรายการ, ค้นหาชื่อ/Barcode, filter วัตถุดิบ/WIP/สำเร็จรูปได้
  - 📝 commit: `feat(web): product list page`

- [ ] 3.4 Web: ฟอร์มเพิ่ม/แก้ไขสินค้า (ชื่อ, ประเภท, หน่วย, barcode, ราคา, minStock)
  - 🧪 test: กรอกฟอร์ม → บันทึก → list อัปเดต
  - 📝 commit: `feat(web): product add/edit form`

- [ ] 3.5 Auto test: ครอบคลุม product CRUD + filter
  - 🧪 test: `npm test` → ทุก case product ผ่าน
  - 📝 commit: `test(api): product CRUD tests`

---

### Phase 4 — ระบบคลังสินค้า (Inventory)

> ⚠️ ทุก stock operation ต้องใช้ `prisma.$transaction([...])` — ดู Dev Standards ข้อ 3

- [ ] 4.1 API: Stock In + อัปเดต currentStock
  - 🧪 test: POST stock/in → currentStock เพิ่มขึ้น, transaction บันทึก
  - 📝 commit: `feat(api): stock-in endpoint`

- [ ] 4.2 API: Stock Out + ป้องกัน stock ติดลบ
  - 🧪 test: POST เกินจำนวน → 400 error
  - 📝 commit: `feat(api): stock-out endpoint with validation`

- [ ] 4.3 API: ปรับสต๊อก (Adjust) + โอนย้าย (Transfer)
  - 🧪 test: POST adjust → stock ตรงกับค่าที่กำหนด, transfer → stock ย้ายถูกต้อง
  - 📝 commit: `feat(api): stock adjust and transfer endpoints`

- [ ] 4.4 API: Stock Card รายสินค้า (`GET /api/stock/card/:productId`)
  - 🧪 test: GET → list ทุก transaction ของสินค้านั้น + ยอดคงเหลือสะสม
  - 📝 commit: `feat(api): stock card endpoint`

- [ ] 4.5 API: ประวัติทุกสินค้า + filter (วันที่, ประเภท transaction)
  - 🧪 test: GET `/api/stock/history?type=in&from=2025-01-01` → list ถูกต้อง
  - 📝 commit: `feat(api): stock history with filters`

- [ ] 4.6 Web: หน้ารับสินค้าเข้า / เบิกออก / ปรับสต๊อก / โอนย้าย
  - 🧪 test: บันทึกแต่ละประเภท → stock อัปเดต, ประวัติปรากฏ
  - 📝 commit: `feat(web): stock movement pages`

- [ ] 4.7 Web: หน้า Stock Card (เลือกสินค้า → เห็น movement + ยอดสะสม)
  - 🧪 test: เลือกสินค้า → เห็น timeline เคลื่อนไหว ยอดถูกต้อง
  - 📝 commit: `feat(web): stock card page`

- [ ] 4.8 Auto test: ครอบคลุม stock flow ทั้งหมด + edge cases
  - 🧪 test: `npm test` → in/out/adjust/transfer ผ่านทั้งหมด
  - 📝 commit: `test(api): stock movement tests`

---

### Phase 5 — ระบบแจ้งเตือน Low Stock

- [ ] 5.1 API: ดึงสินค้าที่ต่ำกว่า minStock
  - 🧪 test: GET `/api/stock/low-alert` → list สินค้าที่ stock < minStock
  - 📝 commit: `feat(api): low stock alert endpoint`

- [ ] 5.2 Web: Badge แจ้งเตือนบน Sidebar + หน้า Alerts
  - 🧪 test: สินค้าต่ำกว่า minStock → เห็น badge จำนวนบน menu
  - 📝 commit: `feat(web): low stock alert UI`

---

### Phase 6 — ระบบรายงาน (Reports)

- [ ] 6.1 API: Stock Balance (ยอดคงเหลือ + มูลค่า ณ วันที่เลือก)
  - 🧪 test: GET `/api/reports/balance` → list สินค้า + currentStock + มูลค่า
  - 📝 commit: `feat(api): stock balance report`

- [ ] 6.2 API: Inbound/Outbound Movement (filter วันที่, สินค้า, ประเภท)
  - 🧪 test: GET `/api/reports/movement?from=X&to=Y` → รายการถูกต้อง
  - 📝 commit: `feat(api): inbound outbound movement report`

- [ ] 6.3 API: Export Excel (.xlsx) — Stock Balance + Movement
  - 🧪 test: GET `?format=xlsx` → ดาวน์โหลด .xlsx ได้ ข้อมูลถูกต้อง
  - 📝 commit: `feat(api): export excel report`

- [ ] 6.4 API: Export CSV — สำหรับ import เข้าโปรแกรมบัญชี Express
  - 🧪 test: GET `?format=csv` → ดาวน์โหลด .csv ได้ format ถูกต้อง
  - 📝 commit: `feat(api): export csv for accounting`

- [ ] 6.5 Web: หน้ารายงาน (filter, ดูตาราง, ปุ่ม Export Excel/CSV)
  - 🧪 test: filter → ข้อมูลถูกต้อง, กด Export → ไฟล์โหลดได้
  - 📝 commit: `feat(web): reports page with export`

---

### Phase 7 — Dashboard & UI Polish

- [ ] 7.1 Dashboard หน้าแรก (สรุปยอด, การ์ดสถิติ, Low Stock list, transaction ล่าสุด)
  - 🧪 test: เปิด dashboard → เห็นยอดสินค้าทั้งหมด, จำนวน low stock, รายการล่าสุด
  - 📝 commit: `feat(web): dashboard summary`

- [ ] 7.2 Responsive design — รองรับมือถือทุกหน้า
  - 🧪 test: เปิดบนมือถือ (375px) → layout ไม่แตก ใช้งานได้
  - 📝 commit: `feat(web): responsive layout`

- [ ] 7.3 รวม test suite ทั้งหมด
  - 🧪 test: `npm test` root → ผ่านทุก test ใน monorepo
  - 📝 commit: `chore: unified test suite`
