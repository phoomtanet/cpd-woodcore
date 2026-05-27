-- Rename enum to free up the "Role" name for the table
ALTER TYPE "Role" RENAME TO "RoleEnum";

-- CreateTable Role
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- Seed default roles
INSERT INTO "Role" ("name", "label") VALUES
    ('admin', 'ผู้ดูแลระบบ'),
    ('manager', 'ผู้จัดการ'),
    ('staff', 'พนักงาน');

-- AddColumn roleId to User (nullable first)
ALTER TABLE "User" ADD COLUMN "roleId" INTEGER;

-- Populate roleId from existing role enum
UPDATE "User" u SET "roleId" = r.id FROM "Role" r WHERE r.name = u.role::TEXT;

-- Make roleId NOT NULL
ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;

-- AddForeignKey User.roleId -> Role.id
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropColumn role from User
ALTER TABLE "User" DROP COLUMN "role";

-- AddColumn roleId to RolePermission (nullable first)
ALTER TABLE "RolePermission" ADD COLUMN "roleId" INTEGER;

-- Populate roleId from existing role enum
UPDATE "RolePermission" rp SET "roleId" = r.id FROM "Role" r WHERE r.name = rp.role::TEXT;

-- Make roleId NOT NULL
ALTER TABLE "RolePermission" ALTER COLUMN "roleId" SET NOT NULL;

-- AddForeignKey RolePermission.roleId -> Role.id
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex old unique constraint
DROP INDEX "RolePermission_role_menuKey_key";

-- DropColumn role from RolePermission
ALTER TABLE "RolePermission" DROP COLUMN "role";

-- CreateIndex new unique constraint
CREATE UNIQUE INDEX "RolePermission_roleId_menuKey_key" ON "RolePermission"("roleId", "menuKey");

-- Drop the renamed enum type
DROP TYPE "RoleEnum";
