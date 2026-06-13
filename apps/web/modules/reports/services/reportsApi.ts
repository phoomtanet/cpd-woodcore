import api from '@/services/api'
import type { ApiResponse } from '@/types'
import type {
  BalanceReport,
  BalanceFilter,
  MovementReport,
  MovementFilter,
  ExportFormat,
} from '../types'

function buildBalanceParams(filter: BalanceFilter): URLSearchParams {
  const params = new URLSearchParams()
  if (filter.search) params.set('search', filter.search)
  if (filter.productType) params.set('productType', filter.productType)
  if (filter.categoryId) params.set('categoryId', String(filter.categoryId))
  if (filter.warehouseId) params.set('warehouseId', String(filter.warehouseId))
  if (filter.binId) params.set('binId', String(filter.binId))
  if (filter.status) params.set('status', filter.status)
  if (filter.asOf) params.set('asOf', filter.asOf)
  return params
}

function buildMovementParams(filter: MovementFilter): URLSearchParams {
  const params = new URLSearchParams()
  if (filter.type) params.set('type', filter.type)
  if (filter.productId) params.set('productId', String(filter.productId))
  if (filter.warehouseId) params.set('warehouseId', String(filter.warehouseId))
  if (filter.binId) params.set('binId', String(filter.binId))
  if (filter.from) params.set('from', filter.from)
  if (filter.to) params.set('to', filter.to)
  return params
}

// Trigger a browser download from a Blob response.
function downloadBlob(data: Blob, fallbackName: string, contentDisposition?: string) {
  let filename = fallbackName
  if (contentDisposition) {
    const match = /filename="?([^"]+)"?/.exec(contentDisposition)
    if (match) filename = match[1]
  }
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const reportsApi = {
  getBalance: (filter: BalanceFilter = {}) =>
    api
      .get<ApiResponse<BalanceReport>>(`/reports/balance?${buildBalanceParams(filter).toString()}`)
      .then((r) => r.data.data),

  getMovement: (filter: MovementFilter = {}) =>
    api
      .get<
        ApiResponse<MovementReport>
      >(`/reports/movement?${buildMovementParams(filter).toString()}`)
      .then((r) => r.data.data),

  exportBalance: async (filter: BalanceFilter, format: ExportFormat) => {
    const params = buildBalanceParams(filter)
    params.set('format', format)
    const res = await api.get(`/reports/balance?${params.toString()}`, { responseType: 'blob' })
    downloadBlob(res.data, `stock-balance.${format}`, res.headers['content-disposition'])
  },

  exportMovement: async (filter: MovementFilter, format: ExportFormat) => {
    const params = buildMovementParams(filter)
    params.set('format', format)
    const res = await api.get(`/reports/movement?${params.toString()}`, { responseType: 'blob' })
    downloadBlob(res.data, `stock-movement.${format}`, res.headers['content-disposition'])
  },
}
