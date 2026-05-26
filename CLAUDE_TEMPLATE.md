# {{PROJECT_NAME}} — {{COMPANY_NAME}}

{{PROJECT_DESCRIPTION}}

---

## ขอบเขตระบบ (Scope)

### ✅ ทำได้ใน Phase นี้
| ระบบ | Feature |
|---|---|
| {{MODULE_1}} | {{FEATURES_1}} |
| {{MODULE_2}} | {{FEATURES_2}} |
| Auth | Login/JWT, Role (admin/manager/staff), User Management |

### 🔜 Phase ถัดไป (ทำทีหลัง)
| ระบบ | เหตุผลที่เลื่อน |
|---|---|
| {{FUTURE_MODULE_1}} | {{REASON_1}} |
| {{FUTURE_MODULE_2}} | {{REASON_2}} |

---

## Tech Stack

- **Docker** — containerize ทุก service
- **PostgreSQL** — relational database หลัก
- **Prisma ORM** — schema, migration, type-safe query
- **Next.js 15** (App Router) — dashboard UI (Tailwind CSS + shadcn/ui)
- **Node.js + Express** — REST API
- **JWT + bcrypt** — Authentication / Authorization
- **ExcelJS** — Export รายงานเป็น Excel (.xlsx) และ CSV
- **Jest + Supertest** — Unit & Integration test (API)
- **Git Monorepo** — จัดการ codebase

---

## Monorepo Structure

```
{{PROJECT_FOLDER}}/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── routes/         # {{LIST_ROUTES}}
│   │   │   ├── controllers/
│   │   │   ├── middleware/     # authMiddleware, roleMiddleware
│   │   │   └── utils/
│   │   ├── tests/
│   │   │   └── {{MODULE}}.test.ts
│   │   └── package.json
│   └── web/
│       ├── app/
│       │   ├── (auth)/login/
│       │   └── (dashboard)/
│       │       ├── {{PAGE_1}}/
│       │       ├── {{PAGE_2}}/
│       │       ├── reports/
│       │       └── users/      # admin only
│       └── package.json
├── packages/
│   └── db/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── src/
│       │   └── index.ts        # export PrismaClient instance
│       └── package.json
├── docker-compose.yml
└── package.json
```

---

## User Roles

| Role | สิทธิ์ |
|---|---|
| `admin` | ทุกอย่าง รวมถึงจัดการ user |
| `manager` | {{MANAGER_PERMISSIONS}} |
| `staff` | {{STAFF_PERMISSIONS}} |

---

## Data Models (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  admin
  manager
  staff
}

// เพิ่ม enum ตามระบบ เช่น:
// enum Status { active inactive }
// enum Type   { typeA typeB }

model User {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(staff)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
}

// model {{ModelName}} {
//   id        Int      @id @default(autoincrement())
//   name      String
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
```

---

## API Endpoints

| Method | Path | Role | คำอธิบาย |
|---|---|---|---|
| POST | `/api/auth/login` | * | Login รับ JWT |
| GET | `/api/auth/me` | auth | ดูข้อมูลตัวเอง |
| GET | `/api/health` | * | Health check (status + db + uptime) |
| GET/POST | `/api/{{resource}}` | manager+ | รายการ / เพิ่ม |
| GET/PUT/DELETE | `/api/{{resource}}/:id` | manager+ | ดู / แก้ไข / ลบ |
| GET | `/api/reports/export` | manager+ | Export Excel / CSV |
| GET/POST | `/api/users` | admin | จัดการ user |
| PUT/DELETE | `/api/users/:id` | admin | แก้ไข / ลบ user |

---

## .gitignore

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Environment variables
.env
.env.local
.env.*.local
.env.development
.env.production

# Prisma
.prisma/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Test coverage
coverage/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Docker volumes (ถ้า mount local)
postgres_data/
```

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

---

## Tasks

### Phase 1 — Project Setup

- [ ] 1.0 สร้างไฟล์ `.gitignore` ที่ root
  - 🧪 test: `git status` → node_modules, .env, dist ไม่ติด tracked
  - 📝 commit: `chore: add gitignore`

- [ ] 1.1 สร้าง Monorepo structure + ตั้งค่า npm workspaces
  - 🧪 test: `npm install` root → ไม่มี error
  - 📝 commit: `chore: init monorepo workspace`

- [ ] 1.2 ตั้งค่า Docker Compose (PostgreSQL + API + Web)
  - 🧪 test: `docker compose up` → ทุก container ขึ้นปกติ
  - 📝 commit: `chore: add docker-compose`

- [ ] 1.3 ตั้งค่า Prisma ใน packages/db + เขียน schema.prisma + migrate
  - 🧪 test: `npx prisma migrate dev` → migration สำเร็จ, `prisma studio` เห็น tables
  - 📝 commit: `feat(db): add prisma schema and initial migration`

- [ ] 1.4 ตั้งค่า Express API พื้นฐาน + เชื่อม PostgreSQL ผ่าน Prisma + Health endpoint
  - 🧪 test: `GET /api/health` → `{ status: "ok", db: "connected", uptime: 123 }`
  - 📝 commit: `feat(api): setup express with prisma and health endpoint`

- [ ] 1.5 ตั้งค่า Next.js + Tailwind CSS + shadcn/ui
  - 🧪 test: `npm run dev` → หน้าแรกแสดงผลได้ ไม่มี error
  - 📝 commit: `feat(web): setup nextjs tailwind shadcn`

- [ ] 1.6 ตั้งค่า Jest + Supertest สำหรับ API test
  - 🧪 test: `npm test` → ผ่าน test เปล่า 1 ชุด
  - 📝 commit: `chore(api): setup jest and supertest`

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

### Phase 3 — {{CORE_MODULE_NAME}}

- [ ] 3.1 API: CRUD {{resource}} + ค้นหา/filter
  - 🧪 test: POST/GET/PUT/DELETE `/api/{{resource}}` → ทำงานถูกต้อง
  - 📝 commit: `feat(api): {{resource}} CRUD endpoints`

- [ ] 3.2 Web: หน้ารายการ (ค้นหา, filter, pagination)
  - 🧪 test: แสดงรายการ, ค้นหาได้
  - 📝 commit: `feat(web): {{resource}} list page`

- [ ] 3.3 Web: ฟอร์มเพิ่ม/แก้ไข
  - 🧪 test: กรอกฟอร์ม → บันทึก → list อัปเดต
  - 📝 commit: `feat(web): {{resource}} add/edit form`

- [ ] 3.4 Auto test: ครอบคลุม CRUD
  - 🧪 test: `npm test` → ทุก case ผ่าน
  - 📝 commit: `test(api): {{resource}} CRUD tests`

---

### Phase N — ระบบรายงาน (Reports)

- [ ] N.1 API: รายงานสรุป
  - 🧪 test: GET `/api/reports/summary` → ข้อมูลถูกต้อง
  - 📝 commit: `feat(api): summary report`

- [ ] N.2 API: Export Excel (.xlsx)
  - 🧪 test: GET `?format=xlsx` → ดาวน์โหลด .xlsx ได้
  - 📝 commit: `feat(api): export excel`

- [ ] N.3 API: Export CSV
  - 🧪 test: GET `?format=csv` → ดาวน์โหลด .csv ได้
  - 📝 commit: `feat(api): export csv`

- [ ] N.4 Web: หน้ารายงาน (filter, ดูตาราง, ปุ่ม Export)
  - 🧪 test: filter → ข้อมูลถูกต้อง, กด Export → ไฟล์โหลดได้
  - 📝 commit: `feat(web): reports page with export`

---

### Phase Last — Dashboard & UI Polish

- [ ] L.1 Dashboard หน้าแรก (สรุปยอด, การ์ดสถิติ)
  - 🧪 test: เปิด dashboard → เห็นข้อมูลสรุปถูกต้อง
  - 📝 commit: `feat(web): dashboard summary`

- [ ] L.2 Responsive design — รองรับมือถือทุกหน้า
  - 🧪 test: เปิดบนมือถือ (375px) → layout ไม่แตก
  - 📝 commit: `feat(web): responsive layout`

- [ ] L.3 รวม test suite ทั้งหมด
  - 🧪 test: `npm test` root → ผ่านทุก test
  - 📝 commit: `chore: unified test suite`

---

<!--
## วิธีใช้ Template นี้

1. Copy ไฟล์นี้เป็น CLAUDE.md ในโปรเจกต์ใหม่
2. แทนที่ placeholder ทั้งหมด:
   - {{PROJECT_NAME}}     → ชื่อระบบ
   - {{COMPANY_NAME}}     → ชื่อบริษัท
   - {{PROJECT_DESCRIPTION}} → คำอธิบายโปรเจกต์
   - {{PROJECT_FOLDER}}   → ชื่อ folder root
   - {{MODULE_N}}         → ชื่อระบบหลัก
   - {{FEATURES_N}}       → feature list
   - {{PAGE_N}}           → หน้า dashboard
   - {{resource}}         → ชื่อ resource (เช่น products, orders)
   - {{CORE_MODULE_NAME}} → ชื่อ Phase หลัก
   - {{LIST_ROUTES}}      → รายการ routes ใน API
   - {{MANAGER_PERMISSIONS}} → สิทธิ์ manager
   - {{STAFF_PERMISSIONS}}   → สิทธิ์ staff
3. อัปเดต Data Models ให้ตรงกับ schema ของระบบ
4. เพิ่ม/ลบ Phase ตาม feature ที่ต้องการ
5. Phase 1 และ Phase 2 (Setup + Auth) ใช้ได้เกือบทุกโปรเจกต์ ไม่ต้องแก้มาก
-->
