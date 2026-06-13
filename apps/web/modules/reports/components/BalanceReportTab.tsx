'use client'

import { useState } from 'react'
import { Table, Input, Select, DatePicker, Button, Space, Alert, App } from 'antd'
import { FileExcelOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { useMasterStore } from '@/store/masterStore'
import { formatNumber } from '@/lib/utils'
import { useBalanceReport, useBins } from '../hooks/useReports'
import { reportsApi } from '../services/reportsApi'
import type { BalanceItem, ExportFormat } from '../types'

export default function BalanceReportTab() {
  const { message } = App.useApp()
  const { filter, setFilter, data, loading, error } = useBalanceReport()
  const { productTypes, categories, warehouses } = useMasterStore()
  const bins = useBins(filter.warehouseId)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)
    try {
      await reportsApi.exportBalance(filter, format)
      message.success('ดาวน์โหลดไฟล์สำเร็จ')
    } catch {
      message.error('ส่งออกไฟล์ไม่สำเร็จ')
    } finally {
      setExporting(null)
    }
  }

  const columns: ColumnsType<BalanceItem> = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_: unknown, __: unknown, index: number) => (page - 1) * pageSize + index + 1,
    },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'ชื่อสินค้า', dataIndex: 'name', key: 'name' },
    {
      title: 'หมวดหมู่',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (c: string | null) => c ?? '-',
    },
    { title: 'หน่วย', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'คงเหลือ',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'ราคาทุน',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 110,
      align: 'right',
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'มูลค่าต้นทุน',
      dataIndex: 'costValue',
      key: 'costValue',
      width: 130,
      align: 'right',
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'มูลค่าขาย',
      dataIndex: 'saleValue',
      key: 'saleValue',
      width: 130,
      align: 'right',
      render: (v: number) => formatNumber(v),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="ค้นหาชื่อ, SKU"
          allowClear
          style={{ width: 220 }}
          onSearch={(v: string) => setFilter((f) => ({ ...f, search: v || undefined }))}
        />
        <Select
          style={{ width: 150 }}
          value={filter.productType ?? ''}
          onChange={(v: string) => setFilter((f) => ({ ...f, productType: v || undefined }))}
          options={[
            { value: '', label: 'ทุกประเภท' },
            ...productTypes.map((pt) => ({ value: pt.name, label: pt.label })),
          ]}
        />
        <Select
          style={{ width: 160 }}
          value={filter.categoryId ?? 0}
          onChange={(v: number) => setFilter((f) => ({ ...f, categoryId: v || undefined }))}
          options={[
            { value: 0, label: 'ทุกหมวดหมู่' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
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
        <DatePicker
          placeholder="ยอด ณ วันที่ (สด)"
          style={{ width: 170 }}
          onChange={(d: Dayjs | null) =>
            setFilter((f) => ({ ...f, asOf: d ? d.endOf('day').toISOString() : undefined }))
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

      <Table
        rowKey="productId"
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
        summary={() =>
          data ? (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} align="right">
                  <strong>รวม {formatNumber(data.summary.totalProducts)} รายการ</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <strong>{formatNumber(data.summary.totalQuantity)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  -
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right">
                  <strong>{formatNumber(data.summary.totalCostValue)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right">
                  <strong>{formatNumber(data.summary.totalSaleValue)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          ) : null
        }
      />
    </div>
  )
}
