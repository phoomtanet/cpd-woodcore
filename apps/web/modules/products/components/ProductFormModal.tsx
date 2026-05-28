'use client'

import { useEffect, useState } from 'react'
import { Form, Input, InputNumber, Select, Switch, Modal, App, Upload, Space } from 'antd'
import { PictureOutlined, UploadOutlined } from '@ant-design/icons'
import type { Product, CreateProductDto, UpdateProductDto } from '../types'
import { productsApi } from '../services/productsApi'
import { useMasterStore } from '@/store/masterStore'

interface Props {
  open: boolean
  editing: Product | null
  onClose: () => void
  onCreate: (dto: CreateProductDto) => Promise<Product>
  onUpdate: (id: number, dto: UpdateProductDto) => Promise<Product>
  onImageUploaded?: (updated: Product) => void
}

export default function ProductFormModal({
  open,
  editing,
  onClose,
  onCreate,
  onUpdate,
  onImageUploaded,
}: Props) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [skuPrefix, setSkuPrefix] = useState('')
  const [skuNumber, setSkuNumber] = useState('')
  const { message } = App.useApp()
  const isEdit = !!editing
  const { productTypes, units, categories, skuPrefixes } = useMasterStore()

  const productTypeOptions = productTypes.map((pt) => ({ value: pt.name, label: pt.label }))
  const unitOptions = units.map((u) => ({ value: u.name, label: u.name }))
  const categoryOptions = [
    { value: 0, label: '— ไม่ระบุ —' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]
  const skuPrefixOptions = skuPrefixes.map((p) => ({
    value: p.prefix,
    label: `${p.prefix} — ${p.label}`,
  }))

  useEffect(() => {
    if (open) {
      form.resetFields()
      setSkuPrefix('')
      setSkuNumber('')
      if (editing) {
        form.setFieldsValue({
          name: editing.name,
          sku: editing.sku,
          productType: editing.productType,
          unit: editing.unit,
          barcode: editing.barcode,
          categoryId: editing.categoryId ?? 0,
          costPrice: Number(editing.costPrice),
          salePrice: Number(editing.salePrice),
          minStock: editing.minStock,
          isActive: editing.isActive,
        })
      }
    }
  }, [open, editing, form])

  const composeSku = (prefix: string, num: string) => {
    if (!prefix && !num) return ''
    if (prefix && num) return `${prefix}-${num}`
    if (prefix) return `${prefix}-`
    return num
  }

  const handlePrefixChange = (val: string) => {
    setSkuPrefix(val)
    form.setFieldValue('sku', composeSku(val, skuNumber))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSkuNumber(val)
    form.setFieldValue('sku', composeSku(skuPrefix, val))
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      // normalize categoryId: 0 means "no category"
      const categoryId = values.categoryId ? Number(values.categoryId) : undefined
      const dto = { ...values, categoryId }
      if (isEdit && editing) {
        await onUpdate(editing.id, dto as UpdateProductDto)
        message.success('แก้ไขสินค้าสำเร็จ')
      } else {
        await onCreate(dto as CreateProductDto)
        message.success('เพิ่มสินค้าสำเร็จ')
      }
      onClose()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      message.error(typeof msg === 'string' ? msg : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!editing) return false
    setUploading(true)
    try {
      const updated = await productsApi.uploadImage(editing.id, file)
      onImageUploaded?.(updated)
      message.success('อัปโหลดรูปสำเร็จ')
    } catch {
      message.error('อัปโหลดรูปไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
    return false
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}
      okText={isEdit ? 'บันทึก' : 'เพิ่ม'}
      cancelText="ยกเลิก"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      destroyOnHidden
      width={560}
    >
      {isEdit && editing?.image && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img
            src={editing.image}
            width={120}
            height={120}
            alt="product"
            style={{ objectFit: 'cover', borderRadius: 8 }}
          />
        </div>
      )}

      {isEdit && (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleImageUpload}
            disabled={uploading}
          >
            <span style={{ cursor: 'pointer', color: '#1677ff', fontSize: 13 }}>
              <UploadOutlined /> {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปสินค้า'}
            </span>
          </Upload>
        </div>
      )}

      {!isEdit && (
        <div style={{ textAlign: 'center', marginBottom: 16, color: '#aaa', fontSize: 12 }}>
          <PictureOutlined style={{ fontSize: 32 }} />
          <div>อัปโหลดรูปสินค้าได้หลังจากบันทึกแล้ว</div>
        </div>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="ชื่อสินค้า"
          rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}
        >
          <Input placeholder="ชื่อสินค้า" />
        </Form.Item>

        {!isEdit && skuPrefixOptions.length > 0 && (
          <Form.Item label="SKU Prefix (ตัวช่วยสร้าง SKU)" style={{ marginBottom: 8 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                options={skuPrefixOptions}
                placeholder="เลือก Prefix"
                value={skuPrefix || undefined}
                onChange={handlePrefixChange}
                style={{ width: '55%' }}
                allowClear
              />
              <Input
                placeholder="เลขรันนิ่ง เช่น 001"
                value={skuNumber}
                onChange={handleNumberChange}
                style={{ width: '45%' }}
              />
            </Space.Compact>
          </Form.Item>
        )}

        <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'กรุณากรอก SKU' }]}>
          <Input placeholder="SKU" disabled={isEdit} />
        </Form.Item>

        <Form.Item
          name="productType"
          label="ประเภท"
          rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}
        >
          <Select options={productTypeOptions} placeholder="เลือกประเภท" />
        </Form.Item>

        <Form.Item
          name="unit"
          label="หน่วย"
          rules={[{ required: true, message: 'กรุณากรอกหน่วย' }]}
        >
          <Select options={unitOptions} placeholder="เลือกหน่วย" showSearch allowClear />
        </Form.Item>

        <Form.Item name="barcode" label="Barcode">
          <Input placeholder="Barcode (ถ้ามี)" />
        </Form.Item>

        <Form.Item name="categoryId" label="หมวดหมู่">
          <Select options={categoryOptions} placeholder="เลือกหมวดหมู่ (ถ้ามี)" allowClear />
        </Form.Item>

        <Form.Item
          name="costPrice"
          label="ราคาทุน (บาท)"
          rules={[{ required: true, message: 'กรุณากรอกราคาทุน' }]}
        >
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>

        <Form.Item
          name="salePrice"
          label="ราคาขาย (บาท)"
          rules={[{ required: true, message: 'กรุณากรอกราคาขาย' }]}
        >
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>

        <Form.Item name="minStock" label="จำนวนขั้นต่ำ (สำหรับแจ้งเตือน)">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
        </Form.Item>

        {isEdit && (
          <Form.Item name="isActive" label="สถานะ" valuePropName="checked">
            <Switch checkedChildren="ใช้งาน" unCheckedChildren="ปิด" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
