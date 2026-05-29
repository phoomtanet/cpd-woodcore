'use client'

import { useState, useEffect } from 'react'
import { Form, Select, InputNumber, Input, Button, Alert, App, Divider } from 'antd'
import PageHeader from '@/shared/components/PageHeader'
import { stockApi } from '../services/stockApi'
import { productsApi } from '@/modules/products/services/productsApi'
import { masterApi } from '@/modules/master/services/masterApi'
import { usePermissionStore } from '@/store/permissionStore'
import { useMasterStore } from '@/store/masterStore'
import { syncAlerts } from '@/store/alertsStore'
import type { Product } from '@/modules/products/types'
import type { BinLocationItem, WarehouseItem } from '@/types'

function StockTransferForm() {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const canCreate = usePermissionStore((s) => s.canCreate('stock-transfer'))
  const warehouses = useMasterStore((s) => s.warehouses)
  const multiWh = warehouses.length > 1
  const [fromBins, setFromBins] = useState<BinLocationItem[]>([])
  const [toBins, setToBins] = useState<BinLocationItem[]>([])

  const fetchBins = async (
    warehouseId: number,
    setter: React.Dispatch<React.SetStateAction<BinLocationItem[]>>
  ) => {
    try {
      const bins = await masterApi.getBinsByWarehouse(warehouseId, 'active')
      setter(bins)
    } catch {
      // bin fetch is optional — ignore errors
    }
  }

  useEffect(() => {
    productsApi
      .getAll({ status: 'active' })
      .then(setProducts)
      .catch(() => {})
    if (!multiWh && warehouses[0]) {
      fetchBins(warehouses[0].id, setFromBins)
      fetchBins(warehouses[0].id, setToBins)
    }
  }, [multiWh, warehouses])

  const handleFromWarehouseChange = (wid: number) => {
    form.setFieldValue('fromBinId', undefined)
    setFromBins([])
    fetchBins(wid, setFromBins)
  }

  const handleToWarehouseChange = (wid: number) => {
    form.setFieldValue('toBinId', undefined)
    setToBins([])
    fetchBins(wid, setToBins)
  }

  const getWarehouseLabel = (wh?: WarehouseItem | null) => wh?.shortName ?? wh?.name ?? 'ไม่ระบุ'

  const onFinish = async (values: {
    productId: number
    quantity: number
    fromWarehouseId?: number
    fromBinId?: number
    toWarehouseId?: number
    toBinId?: number
    note?: string
  }) => {
    setLoading(true)
    const fromWh = multiWh ? warehouses.find((w) => w.id === values.fromWarehouseId) : warehouses[0]
    const toWh = multiWh ? warehouses.find((w) => w.id === values.toWarehouseId) : warehouses[0]
    const fromBin = values.fromBinId ? fromBins.find((b) => b.id === values.fromBinId) : null
    const toBin = values.toBinId ? toBins.find((b) => b.id === values.toBinId) : null

    const fromLocation = fromBin
      ? `${getWarehouseLabel(fromWh)} / ${fromBin.code}`
      : getWarehouseLabel(fromWh)
    const toLocation = toBin
      ? `${getWarehouseLabel(toWh)} / ${toBin.code}`
      : getWarehouseLabel(toWh)

    try {
      await stockApi.stockTransfer({
        productId: values.productId,
        quantity: values.quantity,
        fromLocation,
        toLocation,
        fromWarehouseId: fromWh?.id,
        toWarehouseId: toWh?.id,
        binId: fromBin?.id,
        toBinId: toBin?.id,
        note: values.note,
      })
      message.success('โอนย้ายสินค้าเรียบร้อย')
      syncAlerts()
      form.resetFields()
      setFromBins([])
      setToBins([])
      if (!multiWh && warehouses[0]) {
        fetchBins(warehouses[0].id, setFromBins)
        fetchBins(warehouses[0].id, setToBins)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      message.error(typeof msg === 'string' ? msg : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const binOptions = (bins: BinLocationItem[]) =>
    bins.map((b) => ({ value: b.id, label: b.name ? `${b.code} — ${b.name}` : b.code }))

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
          label="จำนวนที่โอน"
          rules={[{ required: true, message: 'กรุณาระบุจำนวน' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="0" />
        </Form.Item>

        <Divider orientation="left" plain style={{ fontSize: 13 }}>
          ต้นทาง
        </Divider>

        {multiWh && (
          <Form.Item
            name="fromWarehouseId"
            label="คลังต้นทาง"
            rules={[{ required: true, message: 'กรุณาเลือกคลังต้นทาง' }]}
          >
            <Select
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              placeholder="เลือกคลัง"
              onChange={handleFromWarehouseChange}
            />
          </Form.Item>
        )}

        {fromBins.length > 0 && (
          <Form.Item name="fromBinId" label="Bin ต้นทาง">
            <Select options={binOptions(fromBins)} placeholder="เลือก Bin (ถ้ามี)" allowClear />
          </Form.Item>
        )}

        <Divider orientation="left" plain style={{ fontSize: 13 }}>
          ปลายทาง
        </Divider>

        {multiWh && (
          <Form.Item
            name="toWarehouseId"
            label="คลังปลายทาง"
            rules={[{ required: true, message: 'กรุณาเลือกคลังปลายทาง' }]}
          >
            <Select
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              placeholder="เลือกคลัง"
              onChange={handleToWarehouseChange}
            />
          </Form.Item>
        )}

        {toBins.length > 0 && (
          <Form.Item name="toBinId" label="Bin ปลายทาง">
            <Select options={binOptions(toBins)} placeholder="เลือก Bin (ถ้ามี)" allowClear />
          </Form.Item>
        )}

        <Form.Item name="note" label="หมายเหตุ">
          <Input.TextArea rows={2} placeholder="หมายเหตุ (ถ้ามี)" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={!canCreate}>
            บันทึกโอนย้ายสินค้า
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default function StockTransferPage() {
  return (
    <App>
      <PageHeader title="โอนย้ายสินค้า" subtitle="บันทึกการโอนย้ายสินค้าระหว่างสถานที่" />
      <StockTransferForm />
    </App>
  )
}
