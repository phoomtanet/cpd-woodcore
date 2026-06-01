'use client'

import { useState, useEffect, useRef } from 'react'
import { Form, Select, InputNumber, Input, Button, Alert, App, Row, Col, Spin } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import { stockApi } from '../services/stockApi'
import { productsApi } from '@/modules/products/services/productsApi'
import { masterApi } from '@/modules/master/services/masterApi'
import { usePermissionStore } from '@/store/permissionStore'
import { useMasterStore } from '@/store/masterStore'
import { syncAlerts } from '@/store/alertsStore'
import WarehouseStockBadge from './WarehouseStockBadge'
import type { Product } from '@/modules/products/types'
import type { BinLocationItem, WarehouseItem } from '@/types'

const PANEL_STYLE: React.CSSProperties = {
  border: '1px solid #f0f0f0',
  borderRadius: 8,
  padding: '12px 16px 12px',
  background: '#fafafa',
  minHeight: 80,
}

function StockTransferForm() {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [freshProduct, setFreshProduct] = useState<Product | null>(null)
  const [stockLoading, setStockLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const canCreate = usePermissionStore((s) => s.canCreate('stock-transfer'))
  const warehouses = useMasterStore((s) => s.warehouses)
  const multiWh = warehouses.length > 1
  const [fromBins, setFromBins] = useState<BinLocationItem[]>([])
  const [toBins, setToBins] = useState<BinLocationItem[]>([])

  const initWhId = warehouses.length === 1 ? warehouses[0]?.id : undefined
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined)
  const [selectedFromWarehouseId, setSelectedFromWarehouseId] = useState<number | undefined>(
    initWhId
  )
  const [selectedFromBinId, setSelectedFromBinId] = useState<number | undefined>(undefined)
  const [fromBinStock, setFromBinStock] = useState<number | null>(null)
  const [fromBinStockLoading, setFromBinStockLoading] = useState(false)
  const [selectedToWarehouseId, setSelectedToWarehouseId] = useState<number | undefined>(initWhId)
  const [selectedToBinId, setSelectedToBinId] = useState<number | undefined>(undefined)
  const [toBinStock, setToBinStock] = useState<number | null>(null)
  const [toBinStockLoading, setToBinStockLoading] = useState(false)
  const enteredQty = Form.useWatch('quantity', form)

  // Clear dependent fields after fromWarehouseId changes — must run outside onChange
  // to avoid Ant Design's circular-reference warning (setFieldValue during dispatch cycle)
  const prevFromWhRef = useRef(initWhId)
  useEffect(() => {
    if (prevFromWhRef.current === selectedFromWarehouseId) return
    prevFromWhRef.current = selectedFromWarehouseId
    form.setFieldValue('fromBinId', undefined)
    form.resetFields(['quantity'])
  }, [selectedFromWarehouseId, form])

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

  // ── computed ──────────────────────────────────────────────
  // ใช้ freshProduct สำหรับ stock (ข้อมูลสด) — fallback ไปยัง list ถ้ายังไม่โหลด
  const activeProduct = freshProduct ?? products.find((p) => p.id === selectedProductId) ?? null

  const fromWarehouse = multiWh
    ? warehouses.find((w) => w.id === selectedFromWarehouseId)
    : warehouses[0]
  const fromWarehouseStock =
    activeProduct && fromWarehouse
      ? (activeProduct.stocks?.find((s) => s.warehouseId === fromWarehouse.id)?.quantity ?? null)
      : null
  const fromDisplayStock = selectedFromBinId != null ? fromBinStock : fromWarehouseStock
  const selectedFromBin = fromBins.find((b) => b.id === selectedFromBinId) ?? null
  const fromLocationLabel = fromWarehouse
    ? selectedFromBin
      ? `${fromWarehouse.shortName ?? fromWarehouse.name} / ${selectedFromBin.code}`
      : (fromWarehouse.shortName ?? fromWarehouse.name)
    : undefined

  const toWarehouse = multiWh
    ? warehouses.find((w) => w.id === selectedToWarehouseId)
    : warehouses[0]
  const toWarehouseStock =
    activeProduct && toWarehouse
      ? (activeProduct.stocks?.find((s) => s.warehouseId === toWarehouse.id)?.quantity ?? null)
      : null
  const toDisplayStock = selectedToBinId != null ? toBinStock : toWarehouseStock
  const selectedToBin = toBins.find((b) => b.id === selectedToBinId) ?? null
  const toLocationLabel = toWarehouse
    ? selectedToBin
      ? `${toWarehouse.shortName ?? toWarehouse.name} / ${selectedToBin.code}`
      : (toWarehouse.shortName ?? toWarehouse.name)
    : undefined

  // quantity disabled จนกว่าจะเลือกคลังต้นทาง (multi-wh เท่านั้น; single-wh เปิดได้เลย)
  const qtyDisabled = multiWh && !selectedFromWarehouseId
  const qtyExceedsStock =
    fromDisplayStock !== null && enteredQty !== undefined && enteredQty > fromDisplayStock

  // ── handlers ──────────────────────────────────────────────
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

  const handleFromWarehouseChange = (wid: number) => {
    setSelectedFromWarehouseId(wid)
    setSelectedFromBinId(undefined)
    setFromBinStock(null)
    setFromBins([])
    fetchBins(wid, setFromBins)
  }

  const handleToWarehouseChange = (wid: number) => {
    setSelectedToWarehouseId(wid)
    setSelectedToBinId(undefined)
    setToBinStock(null)
    form.setFieldValue('toBinId', undefined)
    setToBins([])
    fetchBins(wid, setToBins)
  }

  const handleFromBinChange = async (bid: number | undefined) => {
    setSelectedFromBinId(bid)
    if (bid == null || selectedProductId == null) {
      setFromBinStock(null)
      return
    }
    setFromBinStockLoading(true)
    try {
      const qty = await stockApi.getBinStock(selectedProductId, bid)
      setFromBinStock(qty)
    } catch {
      setFromBinStock(null)
    } finally {
      setFromBinStockLoading(false)
    }
  }

  const handleToBinChange = async (bid: number | undefined) => {
    setSelectedToBinId(bid)
    if (bid == null || selectedProductId == null) {
      setToBinStock(null)
      return
    }
    setToBinStockLoading(true)
    try {
      const qty = await stockApi.getBinStock(selectedProductId, bid)
      setToBinStock(qty)
    } catch {
      setToBinStock(null)
    } finally {
      setToBinStockLoading(false)
    }
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
      setSelectedProductId(undefined)
      setFreshProduct(null)
      const resetFromWhId = multiWh ? undefined : warehouses[0]?.id
      prevFromWhRef.current = resetFromWhId
      setSelectedFromWarehouseId(resetFromWhId)
      setSelectedFromBinId(undefined)
      setFromBinStock(null)
      setSelectedToWarehouseId(multiWh ? undefined : warehouses[0]?.id)
      setSelectedToBinId(undefined)
      setToBinStock(null)
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
          style={{ marginBottom: 16 }}
        />
      )}
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 720 }}>
        {/* สินค้า — full width */}
        <Form.Item
          name="productId"
          label="สินค้า"
          rules={[{ required: true, message: 'กรุณาเลือกสินค้า' }]}
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

        {/* 2-column: ต้นทาง ← → ปลายทาง */}
        <Row gutter={12} align="top" style={{ marginBottom: 16 }}>
          {/* ── ต้นทาง ── */}
          <Col xs={24} md={11}>
            <div style={PANEL_STYLE}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: '#1677ff', fontSize: 13 }}>
                ต้นทาง
              </div>

              {multiWh && (
                <Form.Item
                  name="fromWarehouseId"
                  label="คลัง"
                  rules={[{ required: true, message: 'กรุณาเลือกคลัง' }]}
                >
                  <Select
                    options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                    placeholder="เลือกคลัง"
                    onChange={handleFromWarehouseChange}
                  />
                </Form.Item>
              )}

              {fromBins.length > 0 && (
                <Form.Item name="fromBinId" label="Bin">
                  <Select
                    options={binOptions(fromBins)}
                    placeholder="เลือก Bin (ถ้ามี)"
                    allowClear
                    onChange={handleFromBinChange}
                  />
                </Form.Item>
              )}

              {/* จำนวนที่โอน — อยู่ใน panel ต้นทาง, disabled จนกว่าจะเลือกคลัง */}
              <Form.Item
                name="quantity"
                label="จำนวนที่โอน"
                rules={[{ required: true, message: 'กรุณาระบุจำนวน' }]}
                style={{ marginBottom: 8 }}
                extra={
                  qtyExceedsStock ? (
                    <span style={{ color: '#ff4d4f', fontSize: 13 }}>
                      ⚠ เกินสต๊อก{selectedFromBinId != null ? 'ใน Bin' : ''} (มีอยู่{' '}
                      {fromDisplayStock} {activeProduct?.unit})
                    </span>
                  ) : undefined
                }
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder={qtyDisabled ? 'เลือกคลังก่อน' : '0'}
                  disabled={qtyDisabled}
                />
              </Form.Item>

              <Spin spinning={stockLoading || fromBinStockLoading} size="small">
                <WarehouseStockBadge
                  quantity={fromDisplayStock}
                  unit={activeProduct?.unit ?? ''}
                  minStock={activeProduct?.minStock ?? 0}
                  location={fromLocationLabel}
                />
              </Spin>
            </div>
          </Col>

          {/* ── ลูกศร (desktop only) ── */}
          <Col
            xs={0}
            md={2}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 36,
            }}
          >
            <ArrowRightOutlined style={{ fontSize: 20, color: '#bfbfbf' }} />
          </Col>

          {/* ── ปลายทาง ── */}
          <Col xs={24} md={11}>
            <div style={PANEL_STYLE}>
              <div style={{ fontWeight: 600, marginBottom: 12, color: '#52c41a', fontSize: 13 }}>
                ปลายทาง
              </div>

              {multiWh && (
                <Form.Item
                  name="toWarehouseId"
                  label="คลัง"
                  rules={[{ required: true, message: 'กรุณาเลือกคลัง' }]}
                >
                  <Select
                    options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                    placeholder="เลือกคลัง"
                    onChange={handleToWarehouseChange}
                  />
                </Form.Item>
              )}

              {toBins.length > 0 && (
                <Form.Item name="toBinId" label="Bin">
                  <Select
                    options={binOptions(toBins)}
                    placeholder="เลือก Bin (ถ้ามี)"
                    allowClear
                    onChange={handleToBinChange}
                  />
                </Form.Item>
              )}

              <Spin spinning={stockLoading || toBinStockLoading} size="small">
                <WarehouseStockBadge
                  quantity={toDisplayStock}
                  unit={activeProduct?.unit ?? ''}
                  minStock={activeProduct?.minStock ?? 0}
                  location={toLocationLabel}
                />
              </Spin>
            </div>
          </Col>
        </Row>

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
