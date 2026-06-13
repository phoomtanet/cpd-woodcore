import { ProductRepository } from '../repositories/product.repository'
import { ReportRepository } from '../repositories/report.repository'

export interface BalanceParams {
  search?: string
  productType?: string
  categoryId?: number
  warehouseId?: number
  status?: 'active' | 'inactive' | 'all'
  asOf?: string
}

export interface BalanceItem {
  productId: number
  sku: string
  name: string
  productType: string
  unit: string
  category: string | null
  costPrice: number
  salePrice: number
  quantity: number
  costValue: number
  saleValue: number
}

const DEFAULT_WAREHOUSE = 1

export const ReportService = {
  async getBalance({
    search,
    productType,
    categoryId,
    warehouseId,
    status = 'all',
    asOf,
  }: BalanceParams) {
    const products = await ProductRepository.findAll({ search, productType, categoryId, status })

    // When asOf is given, reconstruct per-warehouse balances from transactions.
    // Map<productId, Map<warehouseId, quantity>>
    let asOfBalances: Map<number, Map<number, number>> | null = null
    if (asOf) {
      const txs = await ReportRepository.findTransactionsUpTo(
        new Date(asOf),
        products.map((p) => p.id)
      )
      asOfBalances = reconstructBalances(txs)
    }

    const items: BalanceItem[] = products.map((p) => {
      const costPrice = Number(p.costPrice)
      const salePrice = Number(p.salePrice)
      const quantity = resolveQuantity(p, warehouseId, asOfBalances)
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        productType: p.productType,
        unit: p.unit,
        category: p.category?.name ?? null,
        costPrice,
        salePrice,
        quantity,
        costValue: quantity * costPrice,
        saleValue: quantity * salePrice,
      }
    })

    const summary = {
      totalProducts: items.length,
      totalQuantity: items.reduce((acc, i) => acc + i.quantity, 0),
      totalCostValue: items.reduce((acc, i) => acc + i.costValue, 0),
      totalSaleValue: items.reduce((acc, i) => acc + i.saleValue, 0),
    }

    return { asOf: asOf ?? null, warehouseId: warehouseId ?? null, items, summary }
  },
}

type ProductWithStocks = Awaited<ReturnType<typeof ProductRepository.findAll>>[number]

function resolveQuantity(
  product: ProductWithStocks,
  warehouseId: number | undefined,
  asOfBalances: Map<number, Map<number, number>> | null
): number {
  if (asOfBalances) {
    const whMap = asOfBalances.get(product.id)
    if (!whMap) return 0
    if (warehouseId != null) return whMap.get(warehouseId) ?? 0
    return sumValues(whMap)
  }
  // Live balances come from ProductStock rows (included by findAll).
  if (warehouseId != null) {
    return product.stocks.find((s) => s.warehouseId === warehouseId)?.quantity ?? 0
  }
  return product.stocks.reduce((acc, s) => acc + s.quantity, 0)
}

// Replay transactions in chronological order into per-warehouse balances.
function reconstructBalances(
  txs: {
    productId: number
    type: string
    quantity: number
    warehouseId: number | null
    toWarehouseId: number | null
  }[]
): Map<number, Map<number, number>> {
  const result = new Map<number, Map<number, number>>()
  for (const tx of txs) {
    let whMap = result.get(tx.productId)
    if (!whMap) {
      whMap = new Map()
      result.set(tx.productId, whMap)
    }
    const wh = tx.warehouseId ?? DEFAULT_WAREHOUSE
    const current = whMap.get(wh) ?? 0
    if (tx.type === 'in') whMap.set(wh, current + tx.quantity)
    else if (tx.type === 'out') whMap.set(wh, current - tx.quantity)
    else if (tx.type === 'adjust') whMap.set(wh, tx.quantity)
    else if (tx.type === 'transfer') {
      const toWh = tx.toWarehouseId ?? wh
      // intra-warehouse (bin-to-bin) transfers leave warehouse totals unchanged
      if (toWh !== wh) {
        whMap.set(wh, current - tx.quantity)
        whMap.set(toWh, (whMap.get(toWh) ?? 0) + tx.quantity)
      }
    }
  }
  return result
}

function sumValues(map: Map<number, number>): number {
  let total = 0
  for (const v of map.values()) total += v
  return total
}
