import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/dashboardApi'
import type { DashboardSummary, RecentTransaction, DashboardFilter } from '../types'

export function useDashboard() {
  const [filter, setFilter] = useState<DashboardFilter>({})
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recent, setRecent] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([dashboardApi.getSummary(filter), dashboardApi.getRecentTransactions(filter, 10)])
      .then(([s, r]) => {
        if (!active) return
        setSummary(s)
        setRecent(r)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [filter])

  return { filter, setFilter, summary, recent, loading }
}
