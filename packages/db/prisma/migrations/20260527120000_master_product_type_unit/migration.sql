-- Drop the DEFAULT that references the enum first
ALTER TABLE "Product" ALTER COLUMN "productType" DROP DEFAULT;

-- Change Product.productType from enum to TEXT (preserves existing data via cast)
ALTER TABLE "Product" ALTER COLUMN "productType" TYPE TEXT;

-- Restore the default as plain text
ALTER TABLE "Product" ALTER COLUMN "productType" SET DEFAULT 'raw';

-- Drop the enum type (no longer needed)
DROP TYPE IF EXISTS "ProductType";

-- CreateTable ProductTypeItem
CREATE TABLE "ProductTypeItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "ProductTypeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable Unit
CREATE TABLE "Unit" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductTypeItem_name_key" ON "ProductTypeItem"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");
