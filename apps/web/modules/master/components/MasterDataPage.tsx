'use client'

import { useState } from 'react'
import { App, Button, Form, Input, Modal, Popconfirm, Space, Table, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import RoleGuard from '@/shared/guards/RoleGuard'
import { useMasterStore } from '@/store/masterStore'
import { masterApi } from '../services/masterApi'
import { usePermissionStore } from '@/store/permissionStore'
import type { ProductTypeItem, UnitItem } from '@/types'

interface Props {
  mode: 'types' | 'units'
}

export default function MasterDataPage({ mode }: Props) {
  const { productTypes, units, setProductTypes, setUnits } = useMasterStore()
  const canCreateTypes = usePermissionStore((s) => s.canCreate('master-types'))
  const canUpdateTypes = usePermissionStore((s) => s.canUpdate('master-types'))
  const canDeleteTypes = usePermissionStore((s) => s.canDelete('master-types'))
  const canCreateUnits = usePermissionStore((s) => s.canCreate('master-units'))
  const canUpdateUnits = usePermissionStore((s) => s.canUpdate('master-units'))
  const canDeleteUnits = usePermissionStore((s) => s.canDelete('master-units'))
  const { message } = App.useApp()

  const [ptModal, setPtModal] = useState<{ open: boolean; editing: ProductTypeItem | null }>({
    open: false,
    editing: null,
  })
  const [unitModal, setUnitModal] = useState<{ open: boolean; editing: UnitItem | null }>({
    open: false,
    editing: null,
  })
  const [ptForm] = Form.useForm()
  const [unitForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const openPtModal = (editing: ProductTypeItem | null = null) => {
    ptForm.resetFields()
    if (editing) ptForm.setFieldsValue(editing)
    setPtModal({ open: true, editing })
  }

  const handlePtSave = async () => {
    const values = await ptForm.validateFields()
    setLoading(true)
    try {
      if (ptModal.editing) {
        const updated = await masterApi.updateProductType(ptModal.editing.id, values)
        setProductTypes(productTypes.map((p) => (p.id === updated.id ? updated : p)))
        message.success('แก้ไขประเภทสำเร็จ')
      } else {
        const created = await masterApi.createProductType(values)
        setProductTypes([...productTypes, created])
        message.success('เพิ่มประเภทสำเร็จ')
      }
      setPtModal({ open: false, editing: null })
    } catch {
      message.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handlePtDelete = async (id: number) => {
    try {
      await masterApi.deleteProductType(id)
      setProductTypes(productTypes.filter((p) => p.id !== id))
      message.success('ลบสำเร็จ')
    } catch {
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const openUnitModal = (editing: UnitItem | null = null) => {
    unitForm.resetFields()
    if (editing) unitForm.setFieldsValue(editing)
    setUnitModal({ open: true, editing })
  }

  const handleUnitSave = async () => {
    const values = await unitForm.validateFields()
    setLoading(true)
    try {
      if (unitModal.editing) {
        const updated = await masterApi.updateUnit(unitModal.editing.id, values)
        setUnits(units.map((u) => (u.id === updated.id ? updated : u)))
        message.success('แก้ไขหน่วยสำเร็จ')
      } else {
        const created = await masterApi.createUnit(values)
        setUnits([...units, created])
        message.success('เพิ่มหน่วยสำเร็จ')
      }
      setUnitModal({ open: false, editing: null })
    } catch {
      message.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleUnitDelete = async (id: number) => {
    try {
      await masterApi.deleteUnit(id)
      setUnits(units.filter((u) => u.id !== id))
      message.success('ลบสำเร็จ')
    } catch {
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const ptColumns = [
    { title: 'ชื่อ (name)', dataIndex: 'name', key: 'name', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'ป้ายกำกับ (label)', dataIndex: 'label', key: 'label' },
    ...(canUpdateTypes || canDeleteTypes
      ? [
          {
            title: '',
            key: 'actions',
            width: 100,
            render: (_: unknown, record: ProductTypeItem) => (
              <Space>
                {canUpdateTypes && (
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openPtModal(record)}
                  />
                )}
                {canDeleteTypes && (
                  <Popconfirm title="ลบประเภทนี้?" onConfirm={() => handlePtDelete(record.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ]

  const unitColumns = [
    { title: 'หน่วย', dataIndex: 'name', key: 'name' },
    ...(canUpdateUnits || canDeleteUnits
      ? [
          {
            title: '',
            key: 'actions',
            width: 100,
            render: (_: unknown, record: UnitItem) => (
              <Space>
                {canUpdateUnits && (
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openUnitModal(record)}
                  />
                )}
                {canDeleteUnits && (
                  <Popconfirm title="ลบหน่วยนี้?" onConfirm={() => handleUnitDelete(record.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ]

  return (
    <RoleGuard roles={['admin', 'manager']}>
      <App>
        {mode === 'types' ? (
          <>
            <PageHeader title="ประเภทสินค้า" subtitle="จัดการประเภทสินค้า" />
            {canCreateTypes && (
              <div style={{ marginBottom: 12 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openPtModal()}>
                  เพิ่มประเภท
                </Button>
              </div>
            )}
            <Table
              dataSource={productTypes}
              columns={ptColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
            <Modal
              open={ptModal.open}
              title={ptModal.editing ? 'แก้ไขประเภทสินค้า' : 'เพิ่มประเภทสินค้า'}
              okText={ptModal.editing ? 'บันทึก' : 'เพิ่ม'}
              cancelText="ยกเลิก"
              onOk={handlePtSave}
              onCancel={() => setPtModal({ open: false, editing: null })}
              confirmLoading={loading}
              destroyOnHidden
            >
              <Form form={ptForm} layout="vertical">
                <Form.Item
                  name="name"
                  label="ชื่อ (ใช้ใน system)"
                  rules={[{ required: true, message: 'กรุณากรอก' }]}
                >
                  <Input placeholder="เช่น raw, wip, finished" disabled={!!ptModal.editing} />
                </Form.Item>
                <Form.Item
                  name="label"
                  label="ป้ายกำกับ (แสดงผล)"
                  rules={[{ required: true, message: 'กรุณากรอก' }]}
                >
                  <Input placeholder="เช่น วัตถุดิบ, WIP, สำเร็จรูป" />
                </Form.Item>
              </Form>
            </Modal>
          </>
        ) : (
          <>
            <PageHeader title="หน่วยนับ" subtitle="จัดการหน่วยนับสินค้า" />
            {canCreateUnits && (
              <div style={{ marginBottom: 12 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openUnitModal()}>
                  เพิ่มหน่วย
                </Button>
              </div>
            )}
            <Table
              dataSource={units}
              columns={unitColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
            <Modal
              open={unitModal.open}
              title={unitModal.editing ? 'แก้ไขหน่วยนับ' : 'เพิ่มหน่วยนับ'}
              okText={unitModal.editing ? 'บันทึก' : 'เพิ่ม'}
              cancelText="ยกเลิก"
              onOk={handleUnitSave}
              onCancel={() => setUnitModal({ open: false, editing: null })}
              confirmLoading={loading}
              destroyOnHidden
            >
              <Form form={unitForm} layout="vertical">
                <Form.Item
                  name="name"
                  label="หน่วย"
                  rules={[{ required: true, message: 'กรุณากรอก' }]}
                >
                  <Input placeholder="เช่น แผ่น, ท่อน, กก." />
                </Form.Item>
              </Form>
            </Modal>
          </>
        )}
      </App>
    </RoleGuard>
  )
}
