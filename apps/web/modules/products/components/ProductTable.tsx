'use client'

import { useState } from 'react'
import { Table, Tag, Button, Space, Popconfirm, App, Avatar } from 'antd'
import { EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Product, ProductType } from '../types'

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  raw: 'วัตถุดิบ',
  wip: 'WIP',
  finished: 'สำเร็จรูป',
}

const PRODUCT_TYPE_COLORS: Record<ProductType, string> = {
  raw: 'blue',
  wip: 'orange',
  finished: 'green',
}

function StockBadge({ current, min }: { current: number; min: number }) {
  if (current === 0) return <Tag color="error">ไม่มีสต๊อก</Tag>
  if (current < min) return <Tag color="warning">{current} (ต่ำกว่ากำหนด)</Tag>
  return <Tag color="success">{current}</Tag>
}

interface ProductTableProps {
  products: Product[]
  loading: boolean
  canUpdate: boolean
  canDelete: boolean
  onEdit: (product: Product) => void
  onDelete: (id: number) => Promise<void>
}

export default function ProductTable({
  products,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleDelete = async (id: number) => {
    try {
      await onDelete(id)
      message.success('ลบสินค้าสำเร็จ')
    } catch {
      message.error('ลบสินค้าไม่สำเร็จ')
    }
  }

  const columns: ColumnsType<Product> = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      title: 'รูป',
      key: 'image',
      width: 64,
      render: (_: unknown, record: Product) =>
        record.image ? (
          <Avatar shape="square" size={48} src={record.image} />
        ) : (
          <Avatar shape="square" size={48} icon={<PictureOutlined />} />
        ),
    },
    {
      title: 'ชื่อสินค้า',
      key: 'name',
      render: (_: unknown, record: Product) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {record.sku}
            {record.barcode && ` · ${record.barcode}`}
          </div>
        </div>
      ),
    },
    {
      title: 'ประเภท',
      dataIndex: 'productType',
      key: 'productType',
      width: 110,
      render: (t: ProductType) => (
        <Tag color={PRODUCT_TYPE_COLORS[t]}>{PRODUCT_TYPE_LABELS[t]}</Tag>
      ),
    },
    {
      title: 'หน่วย',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: 'ราคาทุน',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 100,
      align: 'right',
      render: (v: number) => Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
    },
    {
      title: 'สต๊อก',
      key: 'stock',
      width: 150,
      align: 'center',
      render: (_: unknown, record: Product) => (
        <StockBadge current={record.currentStock} min={record.minStock} />
      ),
    },
    {
      title: 'สถานะ',
      key: 'isActive',
      width: 110,
      align: 'center',
      render: (_: unknown, record: Product) =>
        record.isActive ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ไม่ใช้งาน</Tag>,
    },
  ]

  if (canUpdate || canDelete) {
    columns.push({
      title: 'จัดการ',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Product) => (
        <Space>
          {canUpdate && (
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          )}
          {canDelete && (
            <Popconfirm
              title="ยืนยันการลบ"
              description={`ลบสินค้า "${record.name}" ออกจากระบบ?`}
              onConfirm={() => handleDelete(record.id)}
              okText="ลบ"
              cancelText="ยกเลิก"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    })
  }

  return (
    <Table
      columns={columns}
      dataSource={products}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (total: number) => `ทั้งหมด ${total} รายการ`,
        onChange: (p: number) => setPage(p),
        onShowSizeChange: (_: number, size: number) => {
          setPageSize(size)
          setPage(1)
        },
      }}
      size="small"
      scroll={{ x: 'max-content' }}
    />
  )
}
