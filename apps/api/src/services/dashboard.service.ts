import { ReportService } from './report.service'
import { DashboardRepository } from '../repositories/dashboard.repository'

export interface DashboardFilter {
  warehouseId?: number
  binId?: number
}

export const DashboardService = {
  // Headline stats. Reuses ReportService.getBalance so warehouse / bin filtering
  // (including bin-level transaction replay) stays in one place.
  async getSummary({ warehouseId, binId }: DashboardFilter) {
    const balance = await ReportService.getBalance({ warehouseId, binId, status: 'active' })
    const warehouseCount = await DashboardRepository.countActiveWarehouses()

    const lowStockCount = balance.items.filter((i) => i.quantity < i.minStock).length

    return {
      warehouseId: warehouseId ?? null,
      binId: binId ?? null,
      totalProducts: balance.summary.totalProducts,
      totalStockQuantity: balance.summary.totalQuantity,
      totalCostValue: balance.summary.totalCostValue,
      totalSaleValue: balance.summary.totalSaleValue,
      lowStockCount,
      warehouseCount,
    }
  },

  getRecentTransactions({ warehouseId, binId }: DashboardFilter, limit: number) {
    return DashboardRepository.findRecentTransactions({ warehouseId, binId, limit })
  },

  // Daily in/out/transfer totals for the last `days` days (Asia/Bangkok),
  // with empty days filled with zeros so the chart axis is continuous.
  async getMovementTrend({ warehouseId, binId }: DashboardFilter, days: number) {
    const dates = lastNDates(Math.min(Math.max(days, 1), 365))
    const from = new Date(`${dates[0]}T00:00:00+07:00`)
    const txs = await DashboardRepository.findTransactionsFrom(from, { warehouseId, binId })

    const buckets = new Map<string, { in: number; out: number; transfer: number }>()
    for (const d of dates) buckets.set(d, { in: 0, out: 0, transfer: 0 })

    for (const tx of txs) {
      const day = bangkokDate(tx.createdAt)
      const bucket = buckets.get(day)
      if (!bucket) continue
      if (tx.type === 'in') bucket.in += tx.quantity
      else if (tx.type === 'out') bucket.out += tx.quantity
      else if (tx.type === 'transfer') bucket.transfer += tx.quantity
    }

    return dates.map((date) => ({ date, ...buckets.get(date)! }))
  },

  // Stock value grouped by product type or category. Reuses getBalance so the
  // warehouse / bin filtering (incl. bin replay) stays in one place.
  async getValueBreakdown({ warehouseId, binId }: DashboardFilter, by: 'type' | 'category') {
    const balance = await ReportService.getBalance({ warehouseId, binId, status: 'active' })

    const groups = new Map<string, { costValue: number; saleValue: number; quantity: number }>()
    for (const item of balance.items) {
      const label = by === 'category' ? (item.category ?? 'ไม่มีหมวดหมู่') : item.productType
      const g = groups.get(label) ?? { costValue: 0, saleValue: 0, quantity: 0 }
      g.costValue += item.costValue
      g.saleValue += item.saleValue
      g.quantity += item.quantity
      groups.set(label, g)
    }

    return Array.from(groups.entries()).map(([key, v]) => ({ key, label: key, ...v }))
  },
}

// ['YYYY-MM-DD', ...] for the last n days ending today, in Asia/Bangkok.
function lastNDates(n: number): string[] {
  const out: string[] = []
  const now = Date.now()
  for (let i = n - 1; i >= 0; i--) {
    out.push(bangkokDate(new Date(now - i * 86_400_000)))
  }
  return out
}

// Format an instant as YYYY-MM-DD in Asia/Bangkok.
function bangkokDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(date)
}
