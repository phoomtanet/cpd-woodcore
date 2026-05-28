'use client'

import { useState, useEffect, useCallback } from 'react'
import { App, Button, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import PermissionGuard from '@/shared/guards/PermissionGuard'
import { useMasterStore } from '@/store/masterStore'
import { masterApi } from '../services/masterApi'
import { usePermissionStore } from '@/store/permissionStore'
import type { ProductTypeItem, UnitItem } from '@/types'

interface Props {
  mode: 'types' | 'units'
}

// ─── Product Types ────────────────────────────────────────────────────────────

function ProductTypesContent() {
  const { setProductTypes, setUnits } = useMasterStore()
  const canCreate = usePermissionStore((s) => s.canCreate('master-types'))
  const canUpdate = usePermissionStore((s) => s.canUpdate('master-types'))
  const canDelete = usePermissionStore((s) => s.canDelete('master-types'))
  const { message } = App.useApp()

  const [items, setItems] = useState<ProductTypeItem[]>([])
  const [modal, setModal] = useState<{ open: boolean; editing: ProductTypeItem | null }>({
    open: false,
    editing: null,
  })
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const syncStore = useCallback(
    (pts: ProductTypeItem[]) => setProductTypes(pts.filter((p) => p.isActive)),
    [setProductTypes]
  )

  const load = useCallback(async () => {
    const [pts, us] = await Promise.all([
      masterApi.getProductTypes('all'),
      masterApi.getUnits('all'),
    ])
    setItems(pts)
    syncStore(pts)
    setUnits(us.filter((u) => u.isActive))
  }, [syncStore, setUnits])

  useEffect(() => {
    load()
  }, [load])

  const openModal = (editing: ProductTypeItem | null = null) => {
    form.resetFields()
    if (editing) form.setFieldsValue({ ...editing })
    setModal({ open: true, editing })
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      const { isActive, ...rest } = values
      if (modal.editing) {
        await masterApi.updateProductType(modal.editing.id, rest)
        if (isActive !== modal.editing.isActive) {
          await masterApi.toggleProductTypeStatus(modal.editing.id, isActive)
        }
        message.success('แก้ไขประเภทสำเร็จ')
      } else {
        await masterApi.createProductType(rest)
        message.success('เพิ่มประเภทสำเร็จ')
      }
      setModal({ open: false, editing: null })
      await load()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await masterApi.deleteProductType(id)
      message.success('ลบสำเร็จ')
      await load()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const columns = [
    { title: 'ชื่อ (name)', dataIndex: 'name', key: 'name', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'ป้ายกำกับ (label)', dataIndex: 'label', key: 'label' },
    {
      title: 'สถานะ',
      key: 'isActive',
      width: 110,
      render: (_: unknown, r: ProductTypeItem) =>
        r.isActive ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ไม่ใช้งาน</Tag>,
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: '',
            key: 'actions',
            width: 100,
            render: (_: unknown, r: ProductTypeItem) => (
              <Space>
                {canUpdate && (
                  <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
                )}
                {canDelete && (
                  <Popconfirm title="ลบประเภทนี้?" onConfirm={() => handleDelete(r.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <PageHeader
        title="ประเภทสินค้า"
        subtitle="จัดการประเภทสินค้า"
        extra={
          canCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              เพิ่มประเภท
            </Button>
          ) : undefined
        }
      />
      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        open={modal.open}
        title={modal.editing ? 'แก้ไขประเภทสินค้า' : 'เพิ่มประเภทสินค้า'}
        okText={modal.editing ? 'บันทึก' : 'เพิ่ม'}
        cancelText="ยกเลิก"
        onOk={handleSave}
        onCancel={() => setModal({ open: false, editing: null })}
        confirmLoading={loading}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="ชื่อ (ใช้ใน system)"
            rules={[{ required: true, message: 'กรุณากรอก' }]}
          >
            <Input placeholder="เช่น raw, wip, finished" disabled={!!modal.editing} />
          </Form.Item>
          <Form.Item
            name="label"
            label="ป้ายกำกับ (แสดงผล)"
            rules={[{ required: true, message: 'กรุณากรอก' }]}
          >
            <Input placeholder="เช่น วัตถุดิบ, WIP, สำเร็จรูป" />
          </Form.Item>
          {modal.editing && (
            <Form.Item name="isActive" label="สถานะ" valuePropName="checked">
              <Switch checkedChildren="ใช้งาน" unCheckedChildren="ปิด" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  )
}

// ─── Units ────────────────────────────────────────────────────────────────────

function UnitsContent() {
  const { setProductTypes, setUnits } = useMasterStore()
  const canCreate = usePermissionStore((s) => s.canCreate('master-units'))
  const canUpdate = usePermissionStore((s) => s.canUpdate('master-units'))
  const canDelete = usePermissionStore((s) => s.canDelete('master-units'))
  const { message } = App.useApp()

  const [items, setItems] = useState<UnitItem[]>([])
  const [modal, setModal] = useState<{ open: boolean; editing: UnitItem | null }>({
    open: false,
    editing: null,
  })
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const syncStore = useCallback(
    (us: UnitItem[]) => setUnits(us.filter((u) => u.isActive)),
    [setUnits]
  )

  const load = useCallback(async () => {
    const [pts, us] = await Promise.all([
      masterApi.getProductTypes('all'),
      masterApi.getUnits('all'),
    ])
    setItems(us)
    syncStore(us)
    setProductTypes(pts.filter((p) => p.isActive))
  }, [syncStore, setProductTypes])

  useEffect(() => {
    load()
  }, [load])

  const openModal = (editing: UnitItem | null = null) => {
    form.resetFields()
    if (editing) form.setFieldsValue({ ...editing })
    setModal({ open: true, editing })
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      const { isActive, ...rest } = values
      if (modal.editing) {
        await masterApi.updateUnit(modal.editing.id, rest)
        if (isActive !== modal.editing.isActive) {
          await masterApi.toggleUnitStatus(modal.editing.id, isActive)
        }
        message.success('แก้ไขหน่วยสำเร็จ')
      } else {
        await masterApi.createUnit(rest)
        message.success('เพิ่มหน่วยสำเร็จ')
      }
      setModal({ open: false, editing: null })
      await load()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await masterApi.deleteUnit(id)
      message.success('ลบสำเร็จ')
      await load()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const columns = [
    { title: 'หน่วย', dataIndex: 'name', key: 'name' },
    {
      title: 'สถานะ',
      key: 'isActive',
      render: (_: unknown, r: UnitItem) =>
        r.isActive ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ไม่ใช้งาน</Tag>,
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: '',
            key: 'actions',
            render: (_: unknown, r: UnitItem) => (
              <Space>
                {canUpdate && (
                  <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
                )}
                {canDelete && (
                  <Popconfirm title="ลบหน่วยนี้?" onConfirm={() => handleDelete(r.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <PageHeader
        title="หน่วยนับ"
        subtitle="จัดการหน่วยนับสินค้า"
        extra={
          canCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              เพิ่มหน่วย
            </Button>
          ) : undefined
        }
      />
      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        open={modal.open}
        title={modal.editing ? 'แก้ไขหน่วยนับ' : 'เพิ่มหน่วยนับ'}
        okText={modal.editing ? 'บันทึก' : 'เพิ่ม'}
        cancelText="ยกเลิก"
        onOk={handleSave}
        onCancel={() => setModal({ open: false, editing: null })}
        confirmLoading={loading}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="หน่วย" rules={[{ required: true, message: 'กรุณากรอก' }]}>
            <Input placeholder="เช่น แผ่น, ท่อน, กก." />
          </Form.Item>
          {modal.editing && (
            <Form.Item name="isActive" label="สถานะ" valuePropName="checked">
              <Switch checkedChildren="ใช้งาน" unCheckedChildren="ปิด" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  )
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function MasterDataPage({ mode }: Props) {
  const menuKey = mode === 'types' ? 'master-types' : 'master-units'
  return (
    <PermissionGuard menuKey={menuKey}>
      <App>{mode === 'types' ? <ProductTypesContent /> : <UnitsContent />}</App>
    </PermissionGuard>
  )
}
