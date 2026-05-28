'use client'

import { useState, useEffect } from 'react'
import { Select, Table, Tag, Badge, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '@/shared/components/PageHeader'
import { stockApi } from '../services/stockApi'
import { productsApi } from '@/modules/products/services/productsApi'
import type { Product } from '@/modules/products/types'
import type { StockCardData, StockCardRow, TxType } from '../types'

const TX_CONFIG: Record<TxType, { color: string; label: string }> = {
  in: { color: 'green', label: 'รับเข้า' },
  out: { color: 'red', label: 'เบิกออก' },
  adjust: { color: 'orange', label: 'ปรับสต๊อก' },
  transfer: { color: 'blue', label: 'โอนย้าย' },
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
      const cfg = TX_CONFIG[type] ?? { color: 'default', label: type }
      return <Tag color={cfg.color}>{cfg.label}</Tag>
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
      if (row.type === 'transfer') return <span style={{ color: '#1677ff' }}>~{row.quantity}</span>
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

function StockCardContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined)
  const [cardData, setCardData] = useState<StockCardData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    productsApi
      .getAll({ status: 'active' })
      .then(setProducts)
      .catch(() => {})
  }, [])

  const handleSelect = async (productId: number) => {
    setSelectedId(productId)
    setLoading(true)
    try {
      const data = await stockApi.getStockCard(productId)
      setCardData(data)
    } catch {
      setCardData(null)
    } finally {
      setLoading(false)
    }
  }

  const product = cardData?.product

  return (
    <>
      <div style={{ maxWidth: 480, marginBottom: 24 }}>
        <Select
          showSearch
          style={{ width: '100%' }}
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
      </div>

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
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (t: number) => `ทั้งหมด ${t} รายการ`,
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
