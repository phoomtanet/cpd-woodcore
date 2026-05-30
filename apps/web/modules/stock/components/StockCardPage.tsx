'use client'

import { useState, useEffect } from 'react'
import { Select, Table, Badge, App, DatePicker, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import PageHeader from '@/shared/components/PageHeader'
import { stockApi } from '../services/stockApi'
import { productsApi } from '@/modules/products/services/productsApi'
import { masterApi } from '@/modules/master/services/masterApi'
import { useMasterStore } from '@/store/masterStore'
import type { Product } from '@/modules/products/types'
import type { BinLocationItem } from '@/types'
import type {
  StockCardData,
  StockCardRow,
  StockCardWarehouse,
  StockCardBin,
  TxType,
} from '../types'

const TX_CONFIG: Record<TxType, { bg: string; text: string; border: string; label: string }> = {
  in: { bg: '#f6ffed', text: '#52c41a', border: '#b7eb8f', label: 'รับเข้า' },
  out: { bg: '#fff2f0', text: '#ff4d4f', border: '#ffa39e', label: 'เบิกออก' },
  adjust: { bg: '#fff7e6', text: '#fa8c16', border: '#ffd591', label: 'ปรับสต๊อก' },
  transfer: { bg: '#e6f4ff', text: '#1677ff', border: '#91caff', label: 'โอนย้าย' },
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function whLabel(wh?: StockCardWarehouse | null, bin?: StockCardBin | null) {
  if (!wh) return null
  const whName = wh.shortName ?? wh.name
  return bin ? `${whName} / ${bin.code}` : whName
}

function StockCardContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined)
  const [cardData, setCardData] = useState<StockCardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const warehouses = useMasterStore((s) => s.warehouses)
  const multiWh = warehouses.length > 1
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined)
  const [selectedBinId, setSelectedBinId] = useState<number | undefined>(undefined)
  const [bins, setBins] = useState<BinLocationItem[]>([])
  const [binStock, setBinStock] = useState<number | null>(null)

  useEffect(() => {
    productsApi
      .getAll({ status: 'active' })
      .then(setProducts)
      .catch(() => {})
  }, [])

  const fetchCard = async (
    productId: number,
    range: [Dayjs | null, Dayjs | null] | null,
    sortOrder: 'asc' | 'desc',
    warehouseId?: number,
    binId?: number
  ) => {
    setLoading(true)
    try {
      const from = range?.[0]?.startOf('day').toISOString()
      const to = range?.[1]?.endOf('day').toISOString()
      const data = await stockApi.getStockCard(productId, from, to, sortOrder, warehouseId, binId)
      setCardData(data)
    } catch {
      setCardData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (productId: number) => {
    setSelectedId(productId)
    setPage(1)
    setBinStock(null)
    if (selectedBinId != null) {
      try {
        const qty = await stockApi.getBinStock(productId, selectedBinId)
        setBinStock(qty)
      } catch {
        // ignore
      }
    }
    fetchCard(productId, dateRange, order, selectedWarehouseId, selectedBinId)
  }

  const handleRangeChange = (range: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(range)
    setPage(1)
    if (selectedId !== undefined)
      fetchCard(selectedId, range, order, selectedWarehouseId, selectedBinId)
  }

  const handleOrderChange = (value: 'asc' | 'desc') => {
    setOrder(value)
    setPage(1)
    if (selectedId !== undefined)
      fetchCard(selectedId, dateRange, value, selectedWarehouseId, selectedBinId)
  }

  const handleWarehouseFilterChange = (wid: number | undefined) => {
    setSelectedWarehouseId(wid)
    setSelectedBinId(undefined)
    setBinStock(null)
    setBins([])
    setPage(1)
    if (wid) {
      masterApi
        .getBinsByWarehouse(wid, 'active')
        .then(setBins)
        .catch(() => {})
    }
    if (selectedId !== undefined) fetchCard(selectedId, dateRange, order, wid, undefined)
  }

  const handleBinFilterChange = async (bid: number | undefined) => {
    setSelectedBinId(bid)
    setPage(1)
    if (bid != null && selectedId != null) {
      try {
        const qty = await stockApi.getBinStock(selectedId, bid)
        setBinStock(qty)
      } catch {
        setBinStock(null)
      }
    } else {
      setBinStock(null)
    }
    if (selectedId !== undefined) fetchCard(selectedId, dateRange, order, selectedWarehouseId, bid)
  }

  const columns: ColumnsType<StockCardRow> = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      title: 'วันที่',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) =>
        new Date(v).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      title: 'ประเภท',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: TxType) => {
        const cfg = TX_CONFIG[type]
        if (!cfg) return <span>{type}</span>
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '0 7px',
              fontSize: 12,
              lineHeight: '20px',
              borderRadius: 4,
              border: `1px solid ${cfg.border}`,
              background: cfg.bg,
              color: cfg.text,
            }}
          >
            {cfg.label}
          </span>
        )
      },
    },
    {
      title: 'รับเข้า',
      key: 'in',
      width: 90,
      align: 'right' as const,
      render: (_: unknown, row: StockCardRow) => {
        if (row.type === 'in') return <span style={{ color: '#52c41a' }}>+{row.quantity}</span>
        if (row.type === 'adjust') return <span style={{ color: '#fa8c16' }}>={row.quantity}</span>
        return null
      },
    },
    {
      title: 'เบิกออก',
      key: 'out',
      width: 90,
      align: 'right' as const,
      render: (_: unknown, row: StockCardRow) => {
        if (row.type === 'out') return <span style={{ color: '#ff4d4f' }}>-{row.quantity}</span>
        return null
      },
    },
    {
      title: 'โอนย้าย',
      key: 'transferQty',
      width: 90,
      align: 'right' as const,
      render: (_: unknown, row: StockCardRow) => {
        if (row.type !== 'transfer') return null
        if (selectedBinId != null) {
          if (row.tobin?.id === selectedBinId)
            return <span style={{ color: '#52c41a' }}>+{row.quantity}</span>
          return <span style={{ color: '#ff4d4f' }}>-{row.quantity}</span>
        }
        if (selectedWarehouseId != null) {
          const intraWh = row.warehouse?.id != null && row.warehouse.id === row.toWarehouse?.id
          if (!intraWh) {
            if (row.toWarehouse?.id === selectedWarehouseId)
              return <span style={{ color: '#52c41a' }}>+{row.quantity}</span>
            return <span style={{ color: '#ff4d4f' }}>-{row.quantity}</span>
          }
        }
        return <span style={{ color: '#1677ff' }}>~{row.quantity}</span>
      },
    },
    {
      title: 'ยอดสะสม',
      dataIndex: 'balance',
      key: 'balance',
      width: 100,
      align: 'right' as const,
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: 'คลัง',
      key: 'warehouse',
      width: 140,
      render: (_: unknown, row: StockCardRow) => {
        if (row.type !== 'transfer') return whLabel(row.warehouse, row.bin) ?? '-'
        // show the side that matches the active filter as "current location"
        const incoming =
          (selectedBinId != null && row.tobin?.id === selectedBinId) ||
          (selectedBinId == null &&
            selectedWarehouseId != null &&
            row.toWarehouse?.id === selectedWarehouseId)
        return incoming
          ? (whLabel(row.toWarehouse, row.tobin) ?? '-')
          : (whLabel(row.warehouse, row.bin) ?? '-')
      },
    },
    {
      title: 'ย้ายมาจาก',
      key: 'transferOther',
      width: 155,
      render: (_: unknown, row: StockCardRow) => {
        if (row.type !== 'transfer') return null
        const incoming =
          (selectedBinId != null && row.tobin?.id === selectedBinId) ||
          (selectedBinId == null &&
            selectedWarehouseId != null &&
            row.toWarehouse?.id === selectedWarehouseId)
        const other = incoming
          ? whLabel(row.warehouse, row.bin)
          : whLabel(row.toWarehouse, row.tobin)
        if (!other) return null
        return (
          <span style={{ color: '#888', fontSize: 12 }}>
            {incoming ? '← ' : '→ '}
            {other}
          </span>
        )
      },
    },
    {
      title: 'หมายเหตุ',
      key: 'note',
      render: (_: unknown, row: StockCardRow) => row.reason ?? row.note ?? '-',
    },
    {
      title: 'ผู้บันทึก',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 110,
      render: (user: { name: string }) => user?.name ?? '-',
    },
  ]

  const product = cardData?.product
  const selectedProductFull = products.find((p) => p.id === selectedId)
  const warehouseStock =
    selectedWarehouseId != null && selectedBinId == null
      ? (selectedProductFull?.stocks?.find((s) => s.warehouseId === selectedWarehouseId)
          ?.quantity ?? null)
      : null
  const panelStock =
    selectedBinId != null && binStock != null
      ? binStock
      : warehouseStock != null
        ? warehouseStock
        : (product?.currentStock ?? 0)
  const panelCostValue = panelStock * (product?.costPrice ?? 0)
  const panelSaleValue = panelStock * (product?.salePrice ?? 0)

  return (
    <>
      <Space style={{ marginBottom: 24 }} wrap>
        <Select
          showSearch
          style={{ width: 320 }}
          placeholder="เลือกสินค้าเพื่อดู Stock Card"
          options={products.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.sku})`,
          }))}
          filterOption={(input: string, opt?: { label?: unknown }) =>
            ((opt?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
          }
          onChange={handleSelect}
          value={selectedId}
        />
        <DatePicker.RangePicker
          onChange={(range: [Dayjs | null, Dayjs | null] | null) => handleRangeChange(range)}
          format="DD/MM/YYYY"
          placeholder={['วันที่เริ่ม', 'วันที่สิ้นสุด']}
          allowClear
        />
        <Select
          value={order}
          onChange={handleOrderChange}
          style={{ width: 140 }}
          options={[
            { value: 'desc', label: 'ใหม่ → เก่า' },
            { value: 'asc', label: 'เก่า → ใหม่' },
          ]}
        />
        {multiWh && (
          <Select
            value={selectedWarehouseId}
            onChange={(v: number | undefined) => handleWarehouseFilterChange(v)}
            style={{ width: 160 }}
            placeholder="ทุกคลัง"
            allowClear
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          />
        )}
        {bins.length > 0 && (
          <Select
            value={selectedBinId}
            onChange={(v: number | undefined) => handleBinFilterChange(v)}
            style={{ width: 160 }}
            placeholder="ทุก Bin"
            allowClear
            options={bins.map((b) => ({
              value: b.id,
              label: b.name ? `${b.code} — ${b.name}` : b.code,
            }))}
          />
        )}
      </Space>

      {product && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            marginBottom: 24,
            padding: '12px 16px',
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#888' }}>สินค้า</div>
            <div style={{ fontWeight: 600 }}>{product.name}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888' }}>SKU</div>
            <div>{product.sku}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {selectedBinId != null
                ? 'ยอดคงเหลือ (Bin)'
                : selectedWarehouseId != null
                  ? 'ยอดคงเหลือ (คลัง)'
                  : 'ยอดคงเหลือ'}
            </div>
            <div>
              <Badge
                color={panelStock <= 0 ? 'red' : panelStock < product.minStock ? 'orange' : 'green'}
                text={`${panelStock} ${product.unit}`}
              />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888' }}>ราคาทุน / หน่วย</div>
            <div>{fmt(product.costPrice)} บาท</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888' }}>ราคาขาย / หน่วย</div>
            <div style={{ color: '#1677ff' }}>{fmt(product.salePrice)} บาท</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888' }}>มูลค่าต้นทุนรวม</div>
            <div style={{ fontWeight: 600 }}>{fmt(panelCostValue)} บาท</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888' }}>มูลค่าราคาขายรวม</div>
            <div style={{ fontWeight: 600, color: '#1677ff' }}>{fmt(panelSaleValue)} บาท</div>
          </div>
        </div>
      )}

      {selectedId !== undefined && (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={cardData?.transactions ?? []}
          loading={loading}
          size="small"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t: number) => `ทั้งหมด ${t} รายการ`,
            onChange: (p: number) => setPage(p),
            onShowSizeChange: (_: number, size: number) => {
              setPageSize(size)
              setPage(1)
            },
          }}
          locale={{ emptyText: 'ยังไม่มีประวัติสำหรับสินค้านี้' }}
        />
      )}
    </>
  )
}

export default function StockCardPage() {
  return (
    <App>
      <PageHeader title="Stock Card" subtitle="ดูประวัติการเคลื่อนไหวสินค้าพร้อมยอดสะสม" />
      <StockCardContent />
    </App>
  )
}
