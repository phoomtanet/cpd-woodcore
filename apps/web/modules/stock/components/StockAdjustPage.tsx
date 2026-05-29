'use client'

import { useState, useEffect } from 'react'
import { Form, Select, InputNumber, Input, Button, Alert, App } from 'antd'
import PageHeader from '@/shared/components/PageHeader'
import { stockApi } from '../services/stockApi'
import { productsApi } from '@/modules/products/services/productsApi'
import { masterApi } from '@/modules/master/services/masterApi'
import { usePermissionStore } from '@/store/permissionStore'
import { useMasterStore } from '@/store/masterStore'
import { syncAlerts } from '@/store/alertsStore'
import type { Product } from '@/modules/products/types'
import type { BinLocationItem } from '@/types'

function StockAdjustForm() {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const canCreate = usePermissionStore((s) => s.canCreate('stock-adjust'))
  const warehouses = useMasterStore((s) => s.warehouses)
  const multiWh = warehouses.length > 1
  const [bins, setBins] = useState<BinLocationItem[]>([])

  useEffect(() => {
    productsApi
      .getAll({ status: 'active' })
      .then(setProducts)
      .catch(() => {})
    if (!multiWh && warehouses[0]) {
      masterApi
        .getBinsByWarehouse(warehouses[0].id, 'active')
        .then(setBins)
        .catch(() => {})
    }
  }, [multiWh, warehouses])

  const handleWarehouseChange = async (wid: number) => {
    form.setFieldValue('binId', undefined)
    setBins([])
    try {
      const b = await masterApi.getBinsByWarehouse(wid, 'active')
      setBins(b)
    } catch {
      // bin fetch is optional — ignore errors
    }
  }

  const onFinish = async (values: {
    productId: number
    quantity: number
    warehouseId?: number
    binId?: number
    reason?: string
    note?: string
  }) => {
    setLoading(true)
    const warehouseId = multiWh ? values.warehouseId : warehouses[0]?.id
    try {
      await stockApi.stockAdjust({ ...values, warehouseId })
      message.success('ปรับสต๊อกเรียบร้อย')
      syncAlerts()
      form.resetFields()
      setBins([])
      if (!multiWh && warehouses[0]) {
        masterApi
          .getBinsByWarehouse(warehouses[0].id, 'active')
          .then(setBins)
          .catch(() => {})
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      message.error(typeof msg === 'string' ? msg : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!canCreate && (
        <Alert
          message="ไม่มีสิทธิ์บันทึกรายการ"
          type="warning"
          showIcon
          style={{ marginBottom: 16, maxWidth: 480 }}
        />
      )}
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 480 }}>
        <Form.Item
          name="productId"
          label="สินค้า"
          rules={[{ required: true, message: 'กรุณาเลือกสินค้า' }]}
        >
          <Select
            showSearch
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.sku}) — คงเหลือ ${p.currentStock} ${p.unit}`,
            }))}
            filterOption={(input: string, opt?: { label?: unknown }) =>
              ((opt?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
            }
            placeholder="เลือกสินค้า"
          />
        </Form.Item>

        {multiWh && (
          <Form.Item
            name="warehouseId"
            label="คลัง"
            rules={[{ required: true, message: 'กรุณาเลือกคลัง' }]}
          >
            <Select
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              placeholder="เลือกคลัง"
              onChange={handleWarehouseChange}
            />
          </Form.Item>
        )}

        {bins.length > 0 && (
          <Form.Item name="binId" label="Bin Location">
            <Select
              options={bins.map((b) => ({
                value: b.id,
                label: b.name ? `${b.code} — ${b.name}` : b.code,
              }))}
              placeholder="เลือก Bin (ถ้ามี)"
              allowClear
            />
          </Form.Item>
        )}

        <Form.Item
          name="quantity"
          label="จำนวนที่ถูกต้อง (ยอดปรับใหม่)"
          rules={[{ required: true, message: 'กรุณาระบุจำนวน' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
        </Form.Item>

        <Form.Item name="reason" label="เหตุผลการปรับ">
          <Input placeholder="เหตุผล (ถ้ามี)" />
        </Form.Item>

        <Form.Item name="note" label="หมายเหตุ">
          <Input.TextArea rows={2} placeholder="หมายเหตุ (ถ้ามี)" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate}>
            บันทึกปรับสต๊อก
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default function StockAdjustPage() {
  return (
    <App>
      <PageHeader title="ปรับสต๊อก" subtitle="ปรับจำนวนสินค้าให้ตรงกับสต๊อกจริง" />
      <StockAdjustForm />
    </App>
  )
}
