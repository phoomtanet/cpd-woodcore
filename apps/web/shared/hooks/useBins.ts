import { useState, useEffect } from 'react'
import { masterApi } from '@/modules/master/services/masterApi'
import type { BinLocationItem } from '@/types'

// Active bins for a warehouse — empty when no warehouse selected.
// Shared across features (reports, dashboard, ...).
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
