-- AlterTable: add isActive to Product
ALTER TABLE "Product" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: add isActive to ProductTypeItem
ALTER TABLE "ProductTypeItem" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: add isActive to Unit
ALTER TABLE "Unit" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
