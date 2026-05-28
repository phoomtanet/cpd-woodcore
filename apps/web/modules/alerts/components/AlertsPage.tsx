'use client'

import { useState, useEffect } from 'react'
import { Table, Tag, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '@/shared/components/PageHeader'
import { stockApi } from '@/modules/stock/services/stockApi'
import type { LowStockProduct } from '@/modules/stock/types'

const columns: ColumnsType<LowStockProduct> = [
  {
    title: 'สินค้า',
    key: 'name',
    render: (_: unknown, p: LowStockProduct) => (
      <div>
        <div style={{ fontWeight: 500 }}>{p.name}</div>
        <div style={{ color: '#888', fontSize: 12 }}>{p.sku}</div>
      </div>
    ),
  },
  {
    title: 'ประเภท',
    dataIndex: 'productType',
    key: 'productType',
    width: 110,
    render: (type: string) => <Tag>{type}</Tag>,
  },
  {
    title: 'หน่วย',
    dataIndex: 'unit',
    key: 'unit',
    width: 80,
  },
  {
    title: 'คงเหลือ',
    dataIndex: 'currentStock',
    key: 'currentStock',
    width: 100,
    align: 'right' as const,
    render: (v: number) => (
      <span style={{ color: v === 0 ? '#ff4d4f' : '#fa8c16', fontWeight: 600 }}>{v}</span>
    ),
  },
  {
    title: 'ขั้นต่ำ',
    dataIndex: 'minStock',
    key: 'minStock',
    width: 90,
    align: 'right' as const,
  },
  {
    title: 'ขาดไป',
    key: 'shortage',
    width: 100,
    align: 'right' as const,
    render: (_: unknown, p: LowStockProduct) => (
      <span style={{ color: '#ff4d4f', fontWeight: 600 }}>-{p.minStock - p.currentStock}</span>
    ),
  },
]

function AlertsContent() {
  const [products, setProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    stockApi
      .getLowAlert()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={products}
      loading={loading}
      size="small"
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: 'ไม่มีสินค้าต่ำกว่าขั้นต่ำ ✓' }}
      pagination={{
        pageSize: 50,
        showSizeChanger: true,
        showTotal: (t: number) => `ทั้งหมด ${t} รายการ`,
      }}
    />
  )
}

export default function AlertsPage() {
  return (
    <App>
      <PageHeader
        title="Low Stock Alert"
        subtitle="สินค้าที่มีจำนวนต่ำกว่าขั้นต่ำที่กำหนด เรียงตามความเร่งด่วน"
      />
      <AlertsContent />
    </App>
  )
}
