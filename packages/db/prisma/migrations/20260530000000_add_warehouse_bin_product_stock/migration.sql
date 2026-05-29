-- CreateTable: Warehouse
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "updatedById" INTEGER,
    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BinLocation
CREATE TABLE "BinLocation" (
    "id" SERIAL NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdById" INTEGER,
    "updatedById" INTEGER,
    CONSTRAINT "BinLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductStock
CREATE TABLE "ProductStock" (
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("productId","warehouseId")
);

-- AlterTable: StockTransaction — add warehouse/bin columns
ALTER TABLE "StockTransaction"
    ADD COLUMN "warehouseId" INTEGER,
    ADD COLUMN "toWarehouseId" INTEGER,
    ADD COLUMN "binId" INTEGER,
    ADD COLUMN "toBinId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
CREATE UNIQUE INDEX "BinLocation_warehouseId_code_key" ON "BinLocation"("warehouseId", "code");

-- AddForeignKey: Warehouse audit
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: BinLocation
ALTER TABLE "BinLocation" ADD CONSTRAINT "BinLocation_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BinLocation" ADD CONSTRAINT "BinLocation_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BinLocation" ADD CONSTRAINT "BinLocation_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: ProductStock
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: StockTransaction warehouse/bin
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_toWarehouseId_fkey"
    FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_binId_fkey"
    FOREIGN KEY ("binId") REFERENCES "BinLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_toBinId_fkey"
    FOREIGN KEY ("toBinId") REFERENCES "BinLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: seed default warehouse "คลังหลัก"
INSERT INTO "Warehouse" ("id", "code", "name", "isActive", "createdAt", "updatedAt")
VALUES (1, 'WH-MAIN', 'คลังหลัก', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Advance sequence past the inserted id=1
SELECT setval(pg_get_serial_sequence('"Warehouse"', 'id'), GREATEST(1, (SELECT MAX("id") FROM "Warehouse")));

-- DataMigration: populate ProductStock from Product.currentStock (active products only)
INSERT INTO "ProductStock" ("productId", "warehouseId", "quantity")
SELECT "id", 1, "currentStock"
FROM "Product"
WHERE "deletedAt" IS NULL
ON CONFLICT ("productId", "warehouseId") DO NOTHING;

-- DataMigration: assign all existing transactions to default warehouse
UPDATE "StockTransaction" SET "warehouseId" = 1 WHERE "warehouseId" IS NULL;
