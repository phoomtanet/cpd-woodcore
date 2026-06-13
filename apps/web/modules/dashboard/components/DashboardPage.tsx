'use client'

import { useState, useEffect } from 'react'
import { Row, Col, Select, Space, Table, Tag, Typography, Segmented } from 'antd'
import {
  AppstoreOutlined,
  DollarOutlined,
  WarningOutlined,
  HomeOutlined,
  TagOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PageHeader from '@/shared/components/PageHeader'
import { useBins } from '@/shared/hooks/useBins'
import { useMasterStore } from '@/store/masterStore'
import { stockApi } from '@/modules/stock/services/stockApi'
import type { LowStockProduct } from '@/modules/stock/types'
import { formatNumber, formatDate } from '@/lib/utils'
import { useDashboard } from '../hooks/useDashboard'
import { useDashboardCharts } from '../hooks/useDashboardCharts'
import StatsCard from './StatsCard'
import MovementTrendChart from './MovementTrendChart'
import ValueBreakdownChart from './ValueBreakdownChart'
import type { RecentTransaction, BreakdownBy } from '../types'

const TYPE_META: Record<string, { label: string; color: string }> = {
  in: { label: 'รับเข้า', color: 'green' },
  out: { label: 'เบิกออก', color: 'red' },
  adjust: { label: 'ปรับสต๊อก', color: 'orange' },
  transfer: { label: 'โอนย้าย', color: 'blue' },
}

function warehouseLabel(r: RecentTransaction): string {
  const from = r.bin ? `${r.warehouse?.name ?? '-'} / ${r.bin.code}` : (r.warehouse?.name ?? '-')
  if (r.type === 'transfer' && r.toWarehouse) {
    const to = r.tobin ? `${r.toWarehouse.name} / ${r.tobin.code}` : r.toWarehouse.name
    return `${from} → ${to}`
  }
  return from
}

export default function DashboardPage() {
  const { filter, setFilter, summary, recent, loading } = useDashboard()
  const { warehouses } = useMasterStore()
  const bins = useBins(filter.warehouseId)
  const [breakdownBy, setBreakdownBy] = useState<BreakdownBy>('type')
  const { trend, breakdown, loading: chartsLoading } = useDashboardCharts(filter, breakdownBy)
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([])

  useEffect(() => {
    stockApi
      .getLowAlert()
      .then(setLowStock)
      .catch(() => {})
  }, [])

  const recentColumns: ColumnsType<RecentTransaction> = [
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
      width: 100,
      render: (t: string) => <Tag color={TYPE_META[t]?.color}>{TYPE_META[t]?.label ?? t}</Tag>,
    },
    {
      title: 'สินค้า',
      key: 'product',
      render: (_: unknown, r: RecentTransaction) => (
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
      render: (v: number, r: RecentTransaction) => `${formatNumber(v)} ${r.product.unit}`,
    },
    {
      title: 'คลัง',
      key: 'warehouse',
      width: 200,
      render: (_: unknown, r: RecentTransaction) => warehouseLabel(r),
    },
    {
      title: 'ผู้บันทึก',
      key: 'createdBy',
      width: 120,
      render: (_: unknown, r: RecentTransaction) => r.createdBy?.name ?? '-',
    },
  ]

  const lowStockColumns: ColumnsType<LowStockProduct> = [
    {
      title: 'สินค้า',
      key: 'product',
      render: (_: unknown, p: LowStockProduct) => (
        <div>
          <div style={{ fontWeight: 500 }}>{p.name}</div>
          <div style={{ color: '#888', fontSize: 12 }}>{p.sku}</div>
        </div>
      ),
    },
    {
      title: 'คงเหลือ',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 90,
      align: 'right',
      render: (v: number) => (
        <span style={{ color: v === 0 ? '#ff4d4f' : '#fa8c16', fontWeight: 600 }}>{v}</span>
      ),
    },
    {
      title: 'ขั้นต่ำ',
      dataIndex: 'minStock',
      key: 'minStock',
      width: 80,
      align: 'right',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="ภาพรวมสต๊อกสินค้า — มูลค่าคงเหลือ, การแจ้งเตือน, ความเคลื่อนไหวล่าสุด"
        extra={
          <Space wrap>
            {warehouses.length > 1 && (
              <Select
                style={{ width: 160 }}
                value={filter.warehouseId ?? 0}
                onChange={(v: number) =>
                  setFilter({ warehouseId: v || undefined, binId: undefined })
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
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={8} lg={6}>
          <StatsCard
            title="สินค้าทั้งหมด"
            value={summary?.totalProducts ?? 0}
            suffix="รายการ"
            icon={<AppstoreOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={6}>
          <StatsCard
            title="มูลค่าต้นทุน"
            value={summary?.totalCostValue ?? 0}
            precision={2}
            suffix="บาท"
            icon={<DollarOutlined />}
            valueColor="#1677ff"
            loading={loading}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={6}>
          <StatsCard
            title="มูลค่าราคาขาย"
            value={summary?.totalSaleValue ?? 0}
            precision={2}
            suffix="บาท"
            icon={<TagOutlined />}
            valueColor="#52c41a"
            loading={loading}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={6}>
          <StatsCard
            title="Low Stock"
            value={summary?.lowStockCount ?? 0}
            suffix="รายการ"
            icon={<WarningOutlined />}
            valueColor={(summary?.lowStockCount ?? 0) > 0 ? '#ff4d4f' : undefined}
            loading={loading}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={6}>
          <StatsCard
            title="สต๊อกคงเหลือ"
            value={summary?.totalStockQuantity ?? 0}
            icon={<AppstoreOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={12} sm={12} md={8} lg={6}>
          <StatsCard
            title="จำนวนคลัง"
            value={summary?.warehouseCount ?? 0}
            suffix="คลัง"
            icon={<HomeOutlined />}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Typography.Title level={5}>แนวโน้มความเคลื่อนไหว (30 วัน)</Typography.Title>
          <div
            style={{
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <MovementTrendChart data={trend} loading={chartsLoading} />
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Typography.Title level={5} style={{ margin: 0 }}>
              สัดส่วนมูลค่าต้นทุน
            </Typography.Title>
            <Segmented
              size="small"
              value={breakdownBy}
              onChange={(v: string | number) => setBreakdownBy(v as BreakdownBy)}
              options={[
                { label: 'ตามประเภท', value: 'type' },
                { label: 'ตามหมวดหมู่', value: 'category' },
              ]}
            />
          </div>
          <div
            style={{
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <ValueBreakdownChart data={breakdown} loading={chartsLoading} />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Typography.Title level={5}>ความเคลื่อนไหวล่าสุด</Typography.Title>
          <Table
            rowKey="id"
            columns={recentColumns}
            dataSource={recent}
            loading={loading}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            locale={{ emptyText: 'ยังไม่มีรายการ' }}
          />
        </Col>
        <Col xs={24} lg={9}>
          <Typography.Title level={5}>สินค้าใกล้หมด (รวมทุกคลัง)</Typography.Title>
          <Table
            rowKey="id"
            columns={lowStockColumns}
            dataSource={lowStock}
            size="small"
            scroll={{ x: 'max-content' }}
            pagination={false}
            locale={{ emptyText: 'ไม่มีสินค้าต่ำกว่าขั้นต่ำ ✓' }}
          />
        </Col>
      </Row>
    </div>
  )
}
