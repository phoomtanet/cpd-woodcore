import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/dashboardApi'
import type { MovementTrendPoint, ValueBreakdownItem, DashboardFilter, BreakdownBy } from '../types'

// Chart datasets for the dashboard. Trend window is fixed at 30 days; the value
// breakdown can be grouped by product type or category.
export function useDashboardCharts(filter: DashboardFilter, by: BreakdownBy) {
  const [trend, setTrend] = useState<MovementTrendPoint[]>([])
  const [breakdown, setBreakdown] = useState<ValueBreakdownItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      dashboardApi.getMovementTrend(filter, 30),
      dashboardApi.getValueBreakdown(filter, by),
    ])
      .then(([t, b]) => {
        if (!active) return
        setTrend(t)
        setBreakdown(b)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [filter, by])

  return { trend, breakdown, loading }
}
