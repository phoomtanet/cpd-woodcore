'use client'

import { useState, useEffect } from 'react'
import { Select, Table, Badge, App, DatePicker, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import PageHeader from '@/shared/components/PageHeader'
import { stockApi } from '../services/stockApi'
import { productsApi } from '@/modules/products/services/productsApi'
import type { Product } from '@/modules/products/types'
import type { StockCardData, StockCardRow, TxType } from '../types'

const TX_CONFIG: Record<TxType, { bg: string; text: string; border: string; label: string }> = {
  in: { bg: '#f6ffed', text: '#52c41a', border: '#b7eb8f', label: 'รับเข้า' },
  out: { bg: '#fff2f0', text: '#ff4d4f', border: '#ffa39e', label: 'เบิกออก' },
  adjust: { bg: '#fff7e6', text: '#fa8c16', border: '#ffd591', label: 'ปรับสต๊อก' },
  transfer: { bg: '#e6f4ff', text: '#1677ff', border: '#91caff', label: 'โอนย้าย' },
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

  useEffect(() => {
    productsApi
      .getAll({ status: 'active' })
      .then(setProducts)
      .catch(() => {})
  }, [])

  const fetchCard = async (
    productId: number,
    range: [Dayjs | null, Dayjs | null] | null,
    sortOrder: 'asc' | 'desc'
  ) => {
    setLoading(true)
    try {
      const from = range?.[0]?.startOf('day').toISOString()
      const to = range?.[1]?.endOf('day').toISOString()
      const data = await stockApi.getStockCard(productId, from, to, sortOrder)
      setCardData(data)
    } catch {
      setCardData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (productId: number) => {
    setSelectedId(productId)
    setPage(1)
    fetchCard(productId, dateRange, order)
  }

  const handleRangeChange = (range: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(range)
    setPage(1)
    if (selectedId !== undefined) fetchCard(selectedId, range, order)
  }

  const handleOrderChange = (value: 'asc' | 'desc') => {
    setOrder(value)
    setPage(1)
    if (selectedId !== undefined) fetchCard(selectedId, dateRange, value)
  }

  const columns: ColumnsType<StockCardRow> = [
    {
      title: 'วันที่',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) =>
        new Date(v).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      title: 'ประเภท',
      dataIndex: 'type',
      key: 'type',
      width: 110,
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
        if (row.type === 'transfer')
          return <span style={{ color: '#1677ff' }}>~{row.quantity}</span>
        return null
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
      title: 'สถานที่',
      key: 'location',
      render: (_: unknown, row: StockCardRow) =>
        row.fromLocation && row.toLocation ? `${row.fromLocation} → ${row.toLocation}` : null,
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
            maxWidth: 640,
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
            <div style={{ fontSize: 12, color: '#888' }}>ยอดคงเหลือ</div>
            <div>
              <Badge
                color={
                  product.currentStock <= 0
                    ? 'red'
                    : product.currentStock < product.minStock
                      ? 'orange'
                      : 'green'
                }
                text={`${product.currentStock} ${product.unit}`}
              />
            </div>
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
