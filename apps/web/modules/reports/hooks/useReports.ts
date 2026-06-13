import { useState, useEffect, useCallback } from 'react'
import { reportsApi } from '../services/reportsApi'
import { masterApi } from '@/modules/master/services/masterApi'
import type { BinLocationItem } from '@/types'
import type { BalanceReport, BalanceFilter, MovementReport, MovementFilter } from '../types'

// Active bins for a warehouse — empty when no warehouse selected.
export function useBins(warehouseId?: number) {
  const [bins, setBins] = useState<BinLocationItem[]>([])

  useEffect(() => {
    if (!warehouseId) {
      setBins([])
      return
    }
    masterApi
      .getBinsByWarehouse(warehouseId, 'active')
      .then(setBins)
      .catch(() => setBins([]))
  }, [warehouseId])

  return bins
}

export function useBalanceReport() {
  const [filter, setFilter] = useState<BalanceFilter>({ status: 'all' })
  const [data, setData] = useState<BalanceReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((f: BalanceFilter) => {
    setLoading(true)
    setError(null)
    reportsApi
      .getBalance(f)
      .then(setData)
      .catch(() => setError('โหลดรายงานไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(filter)
  }, [filter, load])

  return { filter, setFilter, data, loading, error, reload: () => load(filter) }
}

export function useMovementReport() {
  const [filter, setFilter] = useState<MovementFilter>({})
  const [data, setData] = useState<MovementReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((f: MovementFilter) => {
    setLoading(true)
    setError(null)
    reportsApi
      .getMovement(f)
      .then(setData)
      .catch(() => setError('โหลดรายงานไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(filter)
  }, [filter, load])

  return { filter, setFilter, data, loading, error, reload: () => load(filter) }
}
