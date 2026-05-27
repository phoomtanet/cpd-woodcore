'use client'

import { useEffect, useState } from 'react'
import { Form, Input, InputNumber, Select, Modal, App, Upload } from 'antd'
import { PictureOutlined, UploadOutlined } from '@ant-design/icons'
import type { Product, CreateProductDto } from '../types'
import { productsApi } from '../services/productsApi'

const PRODUCT_TYPE_OPTIONS = [
  { value: 'raw', label: 'วัตถุดิบ' },
  { value: 'wip', label: 'WIP' },
  { value: 'finished', label: 'สำเร็จรูป' },
]

interface Props {
  open: boolean
  editing: Product | null
  onClose: () => void
  onCreate: (dto: CreateProductDto) => Promise<Product>
  onUpdate: (id: number, dto: Partial<CreateProductDto>) => Promise<Product>
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
  const { message } = App.useApp()
  const isEdit = !!editing

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (editing) {
        form.setFieldsValue({
          name: editing.name,
          sku: editing.sku,
          productType: editing.productType,
          unit: editing.unit,
          barcode: editing.barcode,
          category: editing.category,
          costPrice: Number(editing.costPrice),
          salePrice: Number(editing.salePrice),
          minStock: editing.minStock,
        })
      }
    }
  }, [open, editing, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      if (isEdit && editing) {
        await onUpdate(editing.id, values as Partial<CreateProductDto>)
        message.success('แก้ไขสินค้าสำเร็จ')
      } else {
        await onCreate(values as CreateProductDto)
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

        <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'กรุณากรอก SKU' }]}>
          <Input placeholder="SKU" disabled={isEdit} />
        </Form.Item>

        <Form.Item
          name="productType"
          label="ประเภท"
          rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}
        >
          <Select options={PRODUCT_TYPE_OPTIONS} placeholder="เลือกประเภท" />
        </Form.Item>

        <Form.Item
          name="unit"
          label="หน่วย"
          rules={[{ required: true, message: 'กรุณากรอกหน่วย' }]}
        >
          <Input placeholder="เช่น แผ่น, ท่อน, กก." />
        </Form.Item>

        <Form.Item name="barcode" label="Barcode">
          <Input placeholder="Barcode (ถ้ามี)" />
        </Form.Item>

        <Form.Item name="category" label="หมวดหมู่">
          <Input placeholder="หมวดหมู่ (ถ้ามี)" />
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
      </Form>
    </Modal>
  )
}
