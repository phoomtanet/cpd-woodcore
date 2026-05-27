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
- **Next.js 15** (App Router) — dashboard UI
- **Tailwind CSS** — utility-first styling
- **Ant Design** — UI component library (Table, Form, Modal, etc.)
- **Axios** — HTTP client (single instance, interceptors)
- **Zustand** — lightweight global state management
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
│   │   │   ├── routes/         # HTTP routing only — chains middleware + controller
│   │   │   ├── controllers/    # req/res handling — calls service, returns response
│   │   │   ├── services/       # business logic — calls repository, ไม่รู้จัก req/res
│   │   │   ├── repositories/   # data access — Prisma queries only, ไม่มี business logic
│   │   │   ├── middleware/     # authenticate, requireRole, validate, errorHandler
│   │   │   ├── types/          # TypeScript declarations (express.d.ts)
│   │   │   └── utils/          # pure helpers (errors.ts, etc.)
│   │   ├── tests/
│   │   └── package.json
│   └── web/
│       ├── app/                        # Next.js App Router — routing ONLY
│       │   ├── (auth)/
│       │   │   └── login/page.tsx      # renders <LoginPage /> from modules/auth
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx          # renders <DashboardLayout /> from shared/layouts
│       │   │   ├── page.tsx            # renders <DashboardPage /> from modules/dashboard
│       │   │   ├── products/page.tsx
│       │   │   ├── stock-in/page.tsx
│       │   │   ├── stock-out/page.tsx
│       │   │   ├── stock-adjust/page.tsx
│       │   │   ├── stock-transfer/page.tsx
│       │   │   ├── stock-card/page.tsx
│       │   │   ├── alerts/page.tsx
│       │   │   ├── reports/page.tsx
│       │   │   └── users/page.tsx
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── modules/                    # Feature modules — domain logic per feature
│       │   ├── auth/
│       │   │   ├── components/         # LoginForm
│       │   │   ├── hooks/              # useLogin
│       │   │   ├── services/           # authApi.ts — POST /api/auth/login, GET /me
│       │   │   └── types.ts
│       │   ├── dashboard/
│       │   │   └── components/         # DashboardPage, StatsCard
│       │   ├── products/
│       │   │   ├── components/         # ProductsPage, ProductTable, ProductForm, ProductModal
│       │   │   ├── hooks/              # useProducts, useCreateProduct
│       │   │   ├── services/           # productsApi.ts — CRUD /api/products
│       │   │   └── types.ts
│       │   ├── stock/
│       │   │   ├── components/         # StockInForm, StockOutForm, AdjustForm, TransferForm, StockCard
│       │   │   ├── hooks/              # useStockIn, useStockOut, useStockCard
│       │   │   ├── services/           # stockApi.ts — /api/stock/*
│       │   │   └── types.ts
│       │   ├── reports/
│       │   │   ├── components/         # ReportsPage, ReportTable, ExportButton
│       │   │   ├── hooks/              # useReports
│       │   │   ├── services/           # reportsApi.ts — /api/reports/*
│       │   │   └── types.ts
│       │   └── users/
│       │       ├── components/         # UsersPage, UserTable, UserForm
│       │       ├── hooks/              # useUsers
│       │       ├── services/           # usersApi.ts — /api/users
│       │       └── types.ts
│       ├── shared/                     # Cross-feature reusable code
│       │   ├── components/             # PageHeader, DataTable, StatusBadge, ConfirmModal
│       │   ├── layouts/                # DashboardLayout (Sidebar + Header + Content)
│       │   └── guards/                 # AuthGuard, RoleGuard
│       ├── services/                   # Global HTTP layer
│       │   └── api.ts                  # Axios instance — baseURL, token interceptor, error interceptor
│       ├── store/                      # Global state (Zustand)
│       │   └── authStore.ts            # user, token, setAuth, clearAuth
│       ├── types/                      # Global TypeScript types
│       │   └── index.ts                # ApiResponse<T>, PaginatedResponse<T>, Role
│       ├── constants/                  # App-wide constants
│       │   └── index.ts                # API_BASE_URL, ROLE_LABELS, ROUTES
│       └── lib/                        # Pure utilities
│           └── utils.ts                # cn(), formatDate(), formatNumber()
├── packages/
│   └── db/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── src/
│       │   └── index.ts
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
  deletedAt    DateTime?
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
  deletedAt    DateTime?
  transactions StockTransaction[]
}

model RolePermission {
  id        Int      @id @default(autoincrement())
  role      Role
  menuKey   String
  canView   Boolean  @default(true)
  canCreate Boolean  @default(false)
  canUpdate Boolean  @default(false)
  canDelete Boolean  @default(false)
  updatedAt DateTime @updatedAt

  @@unique([role, menuKey])
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

### 7. Controller-Service-Repository Pattern
แยกความรับผิดชอบ 3 ชั้น — แต่ละชั้นรู้แค่ชั้นถัดไป ไม่ข้ามชั้น

| ชั้น | ความรับผิดชอบ | รู้จัก | ไม่รู้จัก |
|---|---|---|---|
| **Route** | HTTP path + middleware chain | middleware, controller | business logic, DB |
| **Controller** | รับ `req` → เรียก service → ส่ง `res` | service | Prisma, business rules |
| **Service** | business logic, validation ระดับ domain | repository | `req`, `res`, HTTP status |
| **Repository** | Prisma query เท่านั้น | PrismaClient | business rules, HTTP |

```ts
// routes/products.ts — routing only
router.post('/', authenticate, requireRole('manager','admin'), validate(schema), ProductController.create)

// controllers/product.controller.ts — HTTP in/out
async create(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await ProductService.create(req.body, req.user!.userId)
    res.status(201).json({ data: product, message: 'ok' })
  } catch (err) { next(err) }
}

// services/product.service.ts — business logic
async create(dto: CreateProductDto, userId: number) {
  const existing = await ProductRepository.findBySku(dto.sku)
  if (existing) throw new ConflictError('SKU already exists')
  return ProductRepository.create(dto)
}

// repositories/product.repository.ts — Prisma only
async create(data: Prisma.ProductCreateInput) {
  return prisma.product.create({ data })
}
```

**กฎข้าม:**
- Controller ห้าม import Prisma โดยตรง → ต้องผ่าน Service
- Service ห้าม import `req`/`res` หรือ HTTP status codes
- Repository ห้ามมี `if/else` business logic — query เท่านั้น

### 8. Feature-Based Frontend Architecture (Web)
Next.js App Router ใช้เป็น routing layer เท่านั้น — ไม่ใส่ logic ใน `app/`

**กฎหลัก:**

| Layer | ความรับผิดชอบ | ตำแหน่ง |
|---|---|---|
| **app/** | Next.js routing — render page component จาก module | `app/(dashboard)/products/page.tsx` |
| **modules/[feature]/** | UI + hooks + services ของ feature นั้น | `modules/products/components/ProductsPage.tsx` |
| **shared/** | component / layout ที่ใช้ข้าม feature | `shared/components/PageHeader.tsx` |
| **services/api.ts** | Axios instance เดียว — token interceptor, error handling | `services/api.ts` |
| **store/** | global state (Zustand) — auth เท่านั้น | `store/authStore.ts` |
| **types/** | global TypeScript types | `types/index.ts` |
| **constants/** | ค่าคงที่ app-wide | `constants/index.ts` |

```ts
// app/(dashboard)/products/page.tsx — routing ONLY
import ProductsPage from '@/modules/products/components/ProductsPage'
export default function Page() { return <ProductsPage /> }

// modules/products/components/ProductsPage.tsx — feature UI
'use client'
export default function ProductsPage() {
  const { data, isLoading } = useProducts()
  return <ProductTable data={data} loading={isLoading} />
}

// modules/products/hooks/useProducts.ts — data fetching
export function useProducts() {
  const [data, setData] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => { productsApi.getAll().then(setData).finally(() => setIsLoading(false)) }, [])
  return { data, isLoading }
}

// modules/products/services/productsApi.ts — HTTP calls
export const productsApi = {
  getAll: () => api.get<ApiResponse<Product[]>>('/products').then(r => r.data.data),
  create: (dto: CreateProductDto) => api.post('/products', dto),
}

// services/api.ts — single Axios instance
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL })
api.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
```

**กฎข้าม:**
- `app/` ห้ามมี useState / useEffect / fetch — ต้องอยู่ใน module
- `modules/[feature]/services/` ห้าม import จาก modules อื่น — ใช้ `services/api.ts` เท่านั้น
- `shared/` ห้ามมี feature-specific logic — เป็น generic เท่านั้น
- ห้ามสร้าง Axios instance มากกว่า 1 ตัว — ทุกที่ใช้ `services/api.ts`

### 9. Soft Delete
Record ที่ผู้ใช้ "ลบ" ต้องใช้ Soft Delete — set `deletedAt DateTime?` แทนการ `DELETE` จริง เพื่อรักษา referential integrity กับ StockTransaction และ audit trail

```prisma
model Product {
  ...
  deletedAt DateTime?  // null = active, non-null = soft-deleted
}
```

**กฎ:**
- Repository: ทุก `findAll` / `findMany` ต้อง filter `where: { deletedAt: null }` เสมอ
- Repository: `findById` ที่ใช้ทั่วไปต้องกรอง `deletedAt: null` ด้วย — ถ้าเจอ record ที่ถูก soft-delete ให้ถือว่าไม่มี (return `null`)
- Service: `deleteById` → `update({ deletedAt: new Date() })` ไม่ใช่ `delete()`
- API: `DELETE /:id` ยังคง return 200 เหมือนเดิม — client ไม่รู้ว่าเป็น soft delete
- ห้าม hard delete record ที่มี foreign key references (StockTransaction) — ใช้ soft delete เท่านั้น

### 10. Role Permission (Dynamic RBAC)
สิทธิ์การเข้าถึง menu และ CRUD action ต้องอ่านจาก `RolePermission` ใน DB — ไม่ hardcode ใน code

**Data Model:**
```prisma
model RolePermission {
  id        Int      @id @default(autoincrement())
  role      Role
  menuKey   String   // "products" | "stock-in" | "stock-out" | "reports" | "users" | ...
  canView   Boolean  @default(true)
  canCreate Boolean  @default(false)
  canUpdate Boolean  @default(false)
  canDelete Boolean  @default(false)
  updatedAt DateTime @updatedAt

  @@unique([role, menuKey])
}
```

**กฎ API:**
- `GET /api/role-permissions/:role` — public ถ้า authenticated (ทุก role ดู config ของตัวเองได้)
- `GET /api/role-permissions` + `PUT /api/role-permissions/:role/:menuKey` — admin only
- Seed default permissions ตาม role เดิมเสมอเมื่อ migrate — ป้องกัน permission ว่างหลัง deploy ใหม่

**กฎ Frontend:**
- หลัง login → `GET /api/role-permissions/:role` → เก็บใน `permissionStore` (Zustand)
- Sidebar: render เฉพาะ menu ที่ `canView: true`
- ปุ่ม "เพิ่ม" / "แก้ไข" / "ลบ" แสดงตาม `canCreate` / `canUpdate` / `canDelete`
- ห้าม hardcode role name ใน component เพื่อตัดสิน visibility — ให้ใช้ permission flag เท่านั้น
- `permissionStore` ต้อง clear ตอน logout (เหมือน `authStore`)

**กฎข้าม:**
- ห้าม duplicate permission check — API enforce ด้วย `requireRole` + Frontend hide ด้วย permission flag (ทั้งสองต้องมี — frontend เป็น UX, backend เป็น security)
- ห้ามใช้ `user.role === 'admin'` ใน component ตรงๆ เพื่อ show/hide — ให้ผ่าน `permissionStore` เสมอ

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

  - [x] FIX #2: stack เดิมใช้ shadcn/ui + โครงสร้าง flat ไม่รองรับ ERP scale | fix: ย้ายเป็น Ant Design + Feature-Based Architecture (Dev Standard #8)
    - [x] FIX #2.1 ติดตั้ง antd + axios + zustand, ลบ shadcn/ui และ @base-ui/react ออก
      - 🧪 test: `npm run build --workspace=apps/web` → ไม่มี error ✅ | `import { Button } from 'antd'` ใช้ได้ ✅
      - 📝 commit: `chore(web): replace shadcn with antd axios zustand`

      - [x] FIX #2.1a: `Result` component มี type error กับ React 19 types | fix: แทนด้วย Typography + Button
        - 📝 commit: `fix(web): replace antd Result with Typography for react19 compat`
      - [x] FIX #2.1b: Menu `onClick` destructure key มี implicit `any` | fix: เพิ่ม type annotation `{ key: string }`
        - 📝 commit: `fix(web): type menu onclick key`

    - [x] FIX #2.2 สร้าง directory structure — `modules/`, `shared/`, `services/`, `store/`, `types/`, `constants/`
      - 🧪 test: โฟลเดอร์ครบตาม Dev Standard #8 ✅ | `npm run build` → pass ✅
      - 📝 commit: `chore(web): scaffold feature-based directory structure`
    - [x] FIX #2.3 สร้าง `services/api.ts` — Axios instance + token interceptor + error interceptor
      - 🧪 test: request ที่มี token ส่ง `Authorization: Bearer ...` ในทุก header ✅ | 401 response → clearAuth + redirect `/login` ✅
      - 📝 commit: `feat(web): axios instance with auth interceptors`
    - [x] FIX #2.4 สร้าง `store/authStore.ts` — Zustand (user, token, setAuth, clearAuth) + persist ใน localStorage
      - 🧪 test: login → setAuth → token อยู่ใน store ✅ | refresh หน้า → token ยังอยู่ (persist) ✅
      - 📝 commit: `feat(web): zustand auth store with persistence`
    - [x] FIX #2.5 สร้าง `types/index.ts` — ApiResponse\<T\>, PaginatedResponse\<T\>, Role, User
      - 🧪 test: `npm run build` → TypeScript ไม่ error ✅
      - 📝 commit: `feat(web): global typescript types`
    - [x] FIX #2.6 สร้าง `constants/index.ts` — ROUTES, ROLE_LABELS, API_BASE_URL
      - 🧪 test: `npm run build` → TypeScript ไม่ error ✅
      - 📝 commit: `feat(web): app constants`
    - [x] FIX #2.7 สร้าง `shared/layouts/DashboardLayout.tsx` — Ant Design Layout + Sidebar + Header
      - 🧪 test: `npm run build` → pass ✅
      - 📝 commit: `feat(web): dashboard layout with sidebar`
    - [x] FIX #2.8 สร้าง `shared/guards/AuthGuard.tsx` + `RoleGuard.tsx`
      - 🧪 test: `npm run build` → pass ✅
      - 📝 commit: `feat(web): auth and role guards`

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

- [x] 1.9 เพิ่ม Env Validation + Global Error Handler ใน API
  - 🧪 test: ไม่มี JWT_SECRET → `Error: Missing required environment variable: JWT_SECRET` ✅ | POST malformed JSON → 400 `{error:"Invalid JSON body"}` ✅
  - 📝 commit: `feat(api): env validation and global error handler`

- [x] 1.10 ติดตั้ง Zod ใน API + สร้าง validation schema ตัวอย่าง
  - 🧪 test: POST `/api/products` ไม่ส่ง `name` → 400 `{ error: [{field: "name", message: "Required"}] }` ✅ | 5 tests passed ✅
  - 📝 commit: `feat(api): add zod request validation`
  - [x] FIX: Zod 3.25 เปลี่ยน param API จาก `required_error` เป็น `error` | fix: ใช้ `{ error: 'Required' }` แทน

- [x] 1.11 สร้าง Seed script (admin user + สินค้าตัวอย่าง)
  - 🧪 test: `npx prisma db seed` → admin@cpd.com + manager@cpd.com + สินค้า 5 รายการ (raw/wip/finished) ✅ | รันซ้ำไม่ error (upsert) ✅
  - 📝 commit: `chore(db): add seed script`

---

### Phase 2 — ระบบ Authentication & User Management

- [x] 2.1 API: Login + ออก JWT (`POST /api/auth/login`) + seed admin user
  - 🧪 test: credentials ถูก → 200 + JWT ✅ | password ผิด → 401 ✅ | user ไม่มี → 401 ✅ | inactive → 401 ✅ | missing field → 400 ✅
  - 📝 commit: `feat(api): auth login with jwt`

- [x] 2.2 API: middleware ตรวจสอบ JWT + Role Guard
  - 🧪 test: ไม่มี token → 401 ✅ | token ผิด → 401 ✅ | staff POST products → 403 ✅ | manager/admin → 201 ✅ | GET /me valid → 200 ✅
  - 📝 commit: `feat(api): auth middleware and role guard`

  - [x] FIX #1: routes/auth.ts + routes/products.ts มี business logic ตรงใน handler (Prisma, bcrypt, jwt) ละเมิด Dev Standard #7 | fix: แยก 3 ชั้น — สร้าง `UserRepository`, `ProductRepository`, `AuthService`, `ProductService`, `AuthController`, `ProductController` + สร้าง `utils/errors.ts` (HttpError subclasses) + อัปเดต errorHandler ให้รับ HttpError
    - 🧪 test: `npm test --workspace=apps/api` → 17 passed ✅
    - 📝 commit: `refactor(api): controller-service-repository pattern`

- [x] 2.3 API: CRUD user + เปลี่ยน role (admin only)
  - 🧪 test: admin list/create/update/delete ✅ | manager/staff → 403 ✅ | validation → 400 ✅ | duplicate email → 409 ✅ | 30 tests passed ✅
  - 📝 commit: `feat(api): user management endpoints`

  - [x] FIX #1: jest.mock hoisted ก่อน mockUsers/mockNewUser declarations | fix: inline mock data ใน jest.mock() factory โดยตรง

- [x] 2.3.1 ปรับ DELETE user เป็น Soft Delete (ตาม Dev Standard #9)
  - 🧪 test: 52 tests passed — DELETE sets deletedAt, GET list filters deletedAt:null, login soft-deleted → 401 ✅
  - 📝 commit: `feat(api): soft delete users`
    - 📝 commit: `fix(api): inline mock data in users test`

- [x] 2.4 Web: หน้า Login (form email/password, เก็บ JWT ใน httpOnly cookie)
  - 🧪 test: `npm run build` → `/login` route ปรากฏ ✅ | login form แสดง email/password/button ✅ | error state แสดง Alert ✅ | redirect dashboard หลัง login ✅
  - 📝 commit: `feat(web): login page with jwt cookie`
  - หมายเหตุ: เก็บ JWT ใน localStorage ผ่าน Zustand persist (ตั้งแต่ FIX #2.4) แทน httpOnly cookie เพื่อให้ client-side Axios interceptor อ่าน token ได้

  - [x] FIX #1: `Card` จาก antd มี type error กับ React 19 types (เช่นเดียวกับ `Result`) | fix: แทนด้วย plain `div` + inline styles
    - 📝 commit: `fix(web): replace antd Card with div for react19 compat`
  - [x] FIX #2: `app/page.tsx` ชนกับ `app/(dashboard)/page.tsx` ที่ path `/` | fix: ลบ `app/page.tsx` ออก ให้ `(dashboard)/page.tsx` เป็น root — AuthGuard จัดการ redirect `/login`
    - 📝 commit: `fix(web): remove conflicting root page`

- [x] 2.5 Web: ป้องกัน route (redirect ถ้าไม่ได้ login)
  - 🧪 test: เปิด `/` โดยไม่มี token → redirect `/login` ✅ | user ที่ login แล้ว refresh → ยังอยู่หน้าเดิม ✅ | `npm run build` → pass ✅
  - 📝 commit: `feat(web): protected routes middleware`

  - [x] FIX #1: AuthGuard redirect ผิดสำหรับ user ที่ login แล้ว เพราะ Zustand rehydrate จาก localStorage หลัง render ครั้งแรก | fix: เพิ่ม `mounted` state — รอ client mount ก่อน (`useEffect(() => setMounted(true), [])`) จึงค่อย check token
    - 📝 commit: `fix(web): wait for zustand hydration before auth redirect`

- [x] 2.6 Web: หน้าจัดการ User (admin only)
  - 🧪 test: `npm run build` → `/users` route ✅ | admin เห็นตาราง user ✅ | role ≠ admin → 403 page ✅ | เพิ่ม/แก้ไข/ลบผ่าน modal ✅
  - 📝 commit: `feat(web): user management page`

  - [x] FIX #1: `onCreate` prop type `Promise<void>` ไม่รับ `Promise<User>` ที่ hook คืนมา | fix: เปลี่ยน prop type เป็น `Promise<unknown>`
    - 📝 commit: `fix(web): fix oncreate prop type in user form modal`

- [x] 2.7 Auto test: ครอบคลุม auth flow ทั้งหมด
  - 🧪 test: `npm test` → 30 tests passed (auth 5, authMiddleware 7, users 13, products 4, health 1) ✅
  - 📝 commit: `test(api): auth and role guard tests`

- [x] 2.8 DB + API: ระบบ Role Permission — กำหนดสิทธิ์ per role per menu
  - เพิ่ม model `RolePermission { role, menuKey, canView, canCreate, canUpdate, canDelete }` ใน Prisma schema
  - เพิ่ม seed default permissions ตาม role เดิม (admin=all, manager=ดู+เพิ่ม+แก้, staff=ดู+เพิ่ม stock)
  - `GET /api/role-permissions` — ดึง config ทั้งหมด (admin only)
  - `GET /api/role-permissions/:role` — ดึง config ของ role นั้น (auth, ใช้ load ตอน login)
  - `PUT /api/role-permissions/:role/:menuKey` — อัปเดต permission (admin only)
  - 🧪 test: 66 tests passed — GET all (admin-only), GET/:role (all auth), PUT (admin-only + validation) ✅
  - 📝 commit: `feat(api): role permission management`

- [x] 2.9 Web: หน้าตั้งค่า Role Permission (admin only)
  - route `/settings/roles` — แสดงตาราง role × menu พร้อม checkbox canView/canCreate/canUpdate/canDelete
  - บันทึกทีละแถว (PUT per menuKey) พร้อม loading + feedback
  - 🧪 test: `npm run build` → `/settings/roles` route ✅ | RoleGuard roles=['admin'] → non-admin 403 ✅
  - 📝 commit: `feat(web): role permission settings page`

- [x] 2.10 Web: ใช้ Role Permission จาก server ใน UI
  - load permissions ของ user's role หลัง login → เก็บใน Zustand `permissionStore`
  - `DashboardLayout` sidebar render เฉพาะ menu ที่ `canView: true`
  - `RoleGuard` / action buttons (เพิ่ม/แก้ไข/ลบ) แสดงตาม `canCreate/canUpdate/canDelete`
  - 🧪 test: `npm run build` → pass ✅ | 79 tests passed ✅
  - 📝 commit: `feat(web): dynamic menu and action visibility from role permissions`

- [x] 2.11 DB + API: สร้าง Role table แทน enum — เก็บ `name` + `label` ใน DB
  - ลบ `enum Role` ออกจาก schema + สร้าง `model Role { id, name, label, createdAt }`
  - ปรับ `User.role` → `User.roleId Int` (FK → Role)
  - ปรับ `RolePermission.role` → `RolePermission.roleId Int` (FK → Role)
  - migrate + seed roles เริ่มต้น: `{ name: 'admin', label: 'ผู้ดูแลระบบ' }` ฯลฯ
  - เพิ่ม `GET /api/roles` — ดึง role ทั้งหมด (auth), `POST/PUT/DELETE /api/roles` (admin only, สำหรับสร้าง/แก้ role ใหม่)
  - ปรับ repositories ให้ flatten role name ใน API response (role string ยังเหมือนเดิมสำหรับ JWT และ frontend)
  - 🧪 test: 79 tests passed — GET roles (all auth), CRUD roles (admin-only), rolePermission compound key roleId_menuKey ✅
  - 📝 commit: `feat(api): role table replaces enum`

- [ ] 2.12 Web: ดึง Role list + label จาก API แทน hardcode
  - ลบ `ROLE_LABELS` ออกจาก `constants/index.ts`
  - สร้าง `rolesStore` (Zustand) — เก็บ role list หลัง login, clear ตอน logout
  - `UserFormModal` select options ดึงจาก `rolesStore` แทน hardcode `ROLE_OPTIONS`
  - `RolePermissionsPage` tab label ดึงจาก `rolesStore`
  - ทุก component ที่แสดง role label ใช้ `rolesStore` แทน `ROLE_LABELS`
  - 🧪 test: build ผ่าน, เปลี่ยน label ใน DB → UI แสดงตาม
  - 📝 commit: `feat(web): role labels from api instead of hardcode`

- [x] 2.12.1 Web: ปรับ UI หน้า `settings/roles` ให้มีรูปแบบเดียวกับหน้า users
  - เปลี่ยนจาก Tabs + checkbox grid → **ตาราง 1 ตาราง** (แบบเดียวกับ UserTable)
  - แถว = role (ชื่อ + label tag สี), คอลัมน์ = menu แต่ละอัน
  - แต่ละ cell แสดง permission flags เป็น Tag/Badge แทนที่จะเป็น checkbox — กดที่แถวเพื่อเปิด Modal แก้ไข permission ของ role นั้น
  - Modal แสดง permission ของ role × menu ทั้งหมดพร้อม checkbox (ย้าย edit UX เข้า modal แทน inline)
  - 🧪 test: `npm run build` → pass ✅ | 66 tests passed ✅
  - 📝 commit: `feat(web): settings roles page redesign to match users table style`

---

### Phase 3 — ระบบสินค้า / Item Master

- [x] 3.1 API: CRUD สินค้า + ค้นหา/filter + แยกประเภท (raw/wip/finished)
  - 🧪 test: 47 tests passed — GET list/filter/search, GET /:id, POST 201/400/403/409, PUT 200/404/409, DELETE 200/403/404 ✅
  - 📝 commit: `feat(api): product CRUD with type and unit`

- [x] 3.1.1 ปรับ DELETE สินค้าเป็น Soft Delete (เพิ่ม field `deletedAt` ใน schema + filter ออกจาก query ปกติ)
  - 🧪 test: 49 tests passed — DELETE sets deletedAt, GET list filters deletedAt:null, GET/:id returns 404 for soft-deleted ✅
  - 📝 commit: `feat(api): soft delete products`

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
