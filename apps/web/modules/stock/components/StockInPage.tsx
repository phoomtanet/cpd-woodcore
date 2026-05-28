'use client'

import { useState, useEffect } from 'react'
import { Form, Select, InputNumber, Input, Button, Alert, App } from 'antd'
import PageHeader from '@/shared/components/PageHeader'
import { stockApi } from '../services/stockApi'
import { productsApi } from '@/modules/products/services/productsApi'
import { usePermissionStore } from '@/store/permissionStore'
import { syncAlerts } from '@/store/alertsStore'
import type { Product } from '@/modules/products/types'

function StockInForm() {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const canCreate = usePermissionStore((s) => s.canCreate('stock-in'))

  useEffect(() => {
    productsApi
      .getAll({ status: 'active' })
      .then(setProducts)
      .catch(() => {})
  }, [])

  const onFinish = async (values: { productId: number; quantity: number; note?: string }) => {
    setLoading(true)
    try {
      await stockApi.stockIn(values)
      message.success('รับสินค้าเข้าเรียบร้อย')
      syncAlerts()
      form.resetFields()
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

        <Form.Item
          name="quantity"
          label="จำนวนที่รับเข้า"
          rules={[{ required: true, message: 'กรุณาระบุจำนวน' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="0" />
        </Form.Item>

        <Form.Item name="note" label="หมายเหตุ">
          <Input.TextArea rows={2} placeholder="หมายเหตุ (ถ้ามี)" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate}>
            บันทึกรับสินค้าเข้า
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default function StockInPage() {
  return (
    <App>
      <PageHeader title="รับสินค้าเข้า" subtitle="บันทึกการรับสินค้าเข้าคลัง" />
      <StockInForm />
    </App>
  )
}
