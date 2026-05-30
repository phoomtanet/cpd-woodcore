import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Resetting stock data...\n')

  // 1. Delete all stock transactions
  const txCount = await prisma.stockTransaction.count()
  await prisma.stockTransaction.deleteMany({})
  console.log(`✓ Deleted ${txCount} StockTransaction records`)

  // 2. Delete all product stock records
  const psCount = await prisma.productStock.count()
  await prisma.productStock.deleteMany({})
  console.log(`✓ Deleted ${psCount} ProductStock records`)

  // 3. Reset all products currentStock to 0
  await prisma.product.updateMany({
    where: { deletedAt: null },
    data: { currentStock: 0 },
  })
  console.log(`✓ Reset Product.currentStock = 0 for all active products`)

  // 4. Create ProductStock rows: every active product × every active warehouse, qty=0
  const products = await prisma.product.findMany({ where: { deletedAt: null } })
  const warehouses = await prisma.warehouse.findMany({ where: { isActive: true } })

  let created = 0
  for (const product of products) {
    for (const warehouse of warehouses) {
      await prisma.productStock.create({
        data: { productId: product.id, warehouseId: warehouse.id, quantity: 0 },
      })
      created++
    }
  }
  console.log(
    `✓ Created ${created} ProductStock records (${products.length} products × ${warehouses.length} warehouses)`
  )

  console.log('\nStock reset complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
