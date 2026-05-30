'use client'

import { useState, useEffect } from 'react'
import { Form, Select, InputNumber, Input, Button, Alert, App, Spin } from 'antd'
import PageHeader from '@/shared/components/PageHeader'
import { stockApi } from '../services/stockApi'
import { productsApi } from '@/modules/products/services/productsApi'
import { masterApi } from '@/modules/master/services/masterApi'
import { usePermissionStore } from '@/store/permissionStore'
import { useMasterStore } from '@/store/masterStore'
import { syncAlerts } from '@/store/alertsStore'
import WarehouseStockBadge from './WarehouseStockBadge'
import type { Product } from '@/modules/products/types'
import type { BinLocationItem } from '@/types'

function StockInForm() {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [freshProduct, setFreshProduct] = useState<Product | null>(null)
  const [stockLoading, setStockLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const canCreate = usePermissionStore((s) => s.canCreate('stock-in'))
  const warehouses = useMasterStore((s) => s.warehouses)
  const multiWh = warehouses.length > 1
  const [bins, setBins] = useState<BinLocationItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(() =>
    warehouses.length === 1 ? warehouses[0]?.id : undefined
  )
  const [selectedBinId, setSelectedBinId] = useState<number | undefined>(undefined)
  const [binStock, setBinStock] = useState<number | null>(null)
  const [binStockLoading, setBinStockLoading] = useState(false)

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

  const selectedProduct = freshProduct ?? products.find((p) => p.id === selectedProductId) ?? null
  const effectiveWarehouse = multiWh
    ? warehouses.find((w) => w.id === selectedWarehouseId)
    : warehouses[0]
  const effectiveWarehouseId = effectiveWarehouse?.id
  const warehouseStock =
    selectedProduct && effectiveWarehouseId != null
      ? (selectedProduct.stocks?.find((s) => s.warehouseId === effectiveWarehouseId)?.quantity ??
        null)
      : null
  const displayStock = selectedBinId != null ? binStock : warehouseStock
  const selectedBin = bins.find((b) => b.id === selectedBinId) ?? null
  const locationLabel = effectiveWarehouse
    ? selectedBin
      ? `${effectiveWarehouse.shortName ?? effectiveWarehouse.name} / ${selectedBin.code}`
      : (effectiveWarehouse.shortName ?? effectiveWarehouse.name)
    : undefined

  const handleProductChange = async (pid: number) => {
    setSelectedProductId(pid)
    setFreshProduct(null)
    setStockLoading(true)
    try {
      const p = await productsApi.getById(pid)
      setFreshProduct(p)
    } catch {
      // ถ้า fetch ไม่ได้ ใช้ข้อมูลจาก list แทน
    } finally {
      setStockLoading(false)
    }
  }

  const handleWarehouseChange = async (wid: number) => {
    setSelectedWarehouseId(wid)
    setSelectedBinId(undefined)
    setBinStock(null)
    form.setFieldValue('binId', undefined)
    setBins([])
    try {
      const b = await masterApi.getBinsByWarehouse(wid, 'active')
      setBins(b)
    } catch {
      // bin fetch is optional — ignore errors
    }
  }

  const handleBinChange = async (bid: number | undefined) => {
    setSelectedBinId(bid)
    if (bid == null || selectedProductId == null) {
      setBinStock(null)
      return
    }
    setBinStockLoading(true)
    try {
      const qty = await stockApi.getBinStock(selectedProductId, bid)
      setBinStock(qty)
    } catch {
      setBinStock(null)
    } finally {
      setBinStockLoading(false)
    }
  }

  const onFinish = async (values: {
    productId: number
    quantity: number
    warehouseId?: number
    binId?: number
    note?: string
  }) => {
    setLoading(true)
    const warehouseId = multiWh ? values.warehouseId : warehouses[0]?.id
    try {
      await stockApi.stockIn({ ...values, warehouseId })
      message.success('รับสินค้าเข้าเรียบร้อย')
      syncAlerts()
      form.resetFields()
      setSelectedProductId(undefined)
      setFreshProduct(null)
      setSelectedWarehouseId(multiWh ? undefined : warehouses[0]?.id)
      setSelectedBinId(undefined)
      setBinStock(null)
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
          extra={
            <Spin spinning={stockLoading || binStockLoading} size="small">
              <WarehouseStockBadge
                quantity={displayStock}
                unit={selectedProduct?.unit ?? ''}
                minStock={selectedProduct?.minStock ?? 0}
                location={locationLabel}
              />
            </Spin>
          }
        >
          <Select
            showSearch
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.sku})`,
            }))}
            filterOption={(input: string, opt?: { label?: unknown }) =>
              ((opt?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
            }
            placeholder="เลือกสินค้า"
            onChange={handleProductChange}
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
              onChange={handleBinChange}
            />
          </Form.Item>
        )}

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
