'use client'

import { useState, useEffect } from 'react'
import { Table, Select, DatePicker, Button, Space, Tag, Alert, App } from 'antd'
import { FileExcelOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { useMasterStore } from '@/store/masterStore'
import { productsApi } from '@/modules/products/services/productsApi'
import { formatNumber, formatDate } from '@/lib/utils'
import { useMovementReport, useBins } from '../hooks/useReports'
import { reportsApi } from '../services/reportsApi'
import type { MovementItem, MovementFilter, ExportFormat } from '../types'

const { RangePicker } = DatePicker

const TYPE_META: Record<string, { label: string; color: string }> = {
  in: { label: 'รับเข้า', color: 'green' },
  out: { label: 'เบิกออก', color: 'red' },
  adjust: { label: 'ปรับสต๊อก', color: 'orange' },
  transfer: { label: 'โอนย้าย', color: 'blue' },
}

export default function MovementReportTab() {
  const { message } = App.useApp()
  const { filter, setFilter, data, loading, error } = useMovementReport()
  const { warehouses } = useMasterStore()
  const bins = useBins(filter.warehouseId)
  const [products, setProducts] = useState<{ id: number; name: string; sku: string }[]>([])
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    productsApi
      .getAll({ status: 'all' })
      .then((list) => setProducts(list.map((p) => ({ id: p.id, name: p.name, sku: p.sku }))))
      .catch(() => {})
  }, [])

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)
    try {
      await reportsApi.exportMovement(filter, format)
      message.success('ดาวน์โหลดไฟล์สำเร็จ')
    } catch {
      message.error('ส่งออกไฟล์ไม่สำเร็จ')
    } finally {
      setExporting(null)
    }
  }

  const columns: ColumnsType<MovementItem> = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_: unknown, __: unknown, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      title: 'วันที่',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'ประเภท',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (t: string) => <Tag color={TYPE_META[t]?.color}>{TYPE_META[t]?.label ?? t}</Tag>,
    },
    {
      title: 'สินค้า',
      key: 'product',
      render: (_: unknown, r: MovementItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.product.name}</div>
          <div style={{ color: '#888', fontSize: 12 }}>{r.product.sku}</div>
        </div>
      ),
    },
    {
      title: 'จำนวน',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      align: 'right',
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'หน่วย',
      key: 'unit',
      width: 70,
      render: (_: unknown, r: MovementItem) => r.product.unit,
    },
    {
      title: 'คลัง',
      key: 'warehouse',
      width: 160,
      render: (_: unknown, r: MovementItem) => {
        if (r.type === 'transfer' && r.toWarehouse) {
          return `${r.warehouse?.name ?? '-'} → ${r.toWarehouse.name}`
        }
        return r.warehouse?.name ?? '-'
      },
    },
    {
      title: 'Bin',
      key: 'bin',
      width: 120,
      render: (_: unknown, r: MovementItem) => {
        if (r.type === 'transfer' && r.tobin) {
          return `${r.bin?.code ?? '-'} → ${r.tobin.code}`
        }
        return r.bin?.code ?? '-'
      },
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'note',
      key: 'note',
      render: (v: string | null) => v ?? '-',
    },
    {
      title: 'ผู้บันทึก',
      key: 'createdBy',
      width: 120,
      render: (_: unknown, r: MovementItem) => r.createdBy?.name ?? '-',
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          style={{ width: 140 }}
          value={filter.type ?? ''}
          onChange={(v: string) =>
            setFilter((f) => ({ ...f, type: (v || undefined) as MovementFilter['type'] }))
          }
          options={[
            { value: '', label: 'ทุกประเภท' },
            { value: 'in', label: 'รับเข้า' },
            { value: 'out', label: 'เบิกออก' },
            { value: 'adjust', label: 'ปรับสต๊อก' },
            { value: 'transfer', label: 'โอนย้าย' },
          ]}
        />
        <Select
          style={{ width: 240 }}
          showSearch
          allowClear
          placeholder="ทุกสินค้า"
          optionFilterProp="label"
          value={filter.productId}
          onChange={(v?: number) => setFilter((f) => ({ ...f, productId: v }))}
          options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
        />
        {warehouses.length > 1 && (
          <Select
            style={{ width: 160 }}
            value={filter.warehouseId ?? 0}
            onChange={(v: number) =>
              setFilter((f) => ({ ...f, warehouseId: v || undefined, binId: undefined }))
            }
            options={[
              { value: 0, label: 'ทุกคลัง' },
              ...warehouses.map((w) => ({ value: w.id, label: w.name })),
            ]}
          />
        )}
        {filter.warehouseId && bins.length > 0 && (
          <Select
            style={{ width: 150 }}
            allowClear
            placeholder="ทุก Bin"
            value={filter.binId}
            onChange={(v?: number) => setFilter((f) => ({ ...f, binId: v }))}
            options={bins.map((b) => ({ value: b.id, label: b.code }))}
          />
        )}
        <RangePicker
          style={{ width: 260 }}
          onChange={(range: [Dayjs | null, Dayjs | null] | null) =>
            setFilter((f) => ({
              ...f,
              from: range?.[0] ? range[0].startOf('day').toISOString() : undefined,
              to: range?.[1] ? range[1].endOf('day').toISOString() : undefined,
            }))
          }
        />
      </Space>

      <Space style={{ marginBottom: 16 }} wrap>
        <Button
          icon={<FileExcelOutlined />}
          loading={exporting === 'xlsx'}
          disabled={!data || data.items.length === 0}
          onClick={() => handleExport('xlsx')}
        >
          Export Excel
        </Button>
        <Button
          icon={<FileTextOutlined />}
          loading={exporting === 'csv'}
          disabled={!data || data.items.length === 0}
          onClick={() => handleExport('csv')}
        >
          Export CSV
        </Button>
      </Space>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      {data && (
        <Space style={{ marginBottom: 12 }} wrap size="large">
          <span>
            รับเข้า:{' '}
            <strong style={{ color: '#52c41a' }}>{formatNumber(data.summary.totalIn)}</strong>
          </span>
          <span>
            เบิกออก:{' '}
            <strong style={{ color: '#ff4d4f' }}>{formatNumber(data.summary.totalOut)}</strong>
          </span>
          <span>
            คงเหลือสุทธิ: <strong>{formatNumber(data.summary.netChange)}</strong>
          </span>
        </Space>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
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
      />
    </div>
  )
}
