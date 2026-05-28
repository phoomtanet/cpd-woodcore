'use client'

import { useState, useEffect, useCallback } from 'react'
import { App, Button, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag } from 'antd'
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
  const { setProductTypes, setUnits } = useMasterStore()
  const canCreateTypes = usePermissionStore((s) => s.canCreate('master-types'))
  const canUpdateTypes = usePermissionStore((s) => s.canUpdate('master-types'))
  const canDeleteTypes = usePermissionStore((s) => s.canDelete('master-types'))
  const canCreateUnits = usePermissionStore((s) => s.canCreate('master-units'))
  const canUpdateUnits = usePermissionStore((s) => s.canUpdate('master-units'))
  const canDeleteUnits = usePermissionStore((s) => s.canDelete('master-units'))
  const { message } = App.useApp()

  const [allProductTypes, setAllProductTypes] = useState<ProductTypeItem[]>([])
  const [allUnits, setAllUnits] = useState<UnitItem[]>([])

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

  const syncMasterStore = useCallback(
    (pts: ProductTypeItem[], us: UnitItem[]) => {
      setProductTypes(pts.filter((p) => p.isActive))
      setUnits(us.filter((u) => u.isActive))
    },
    [setProductTypes, setUnits]
  )

  const loadAll = useCallback(async () => {
    const [pts, us] = await Promise.all([
      masterApi.getProductTypes('all'),
      masterApi.getUnits('all'),
    ])
    setAllProductTypes(pts)
    setAllUnits(us)
    syncMasterStore(pts, us)
  }, [syncMasterStore])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ─── Product Type handlers ────────────────────────────────────────────────

  const openPtModal = (editing: ProductTypeItem | null = null) => {
    ptForm.resetFields()
    if (editing) ptForm.setFieldsValue({ ...editing })
    setPtModal({ open: true, editing })
  }

  const handlePtSave = async () => {
    const values = await ptForm.validateFields()
    setLoading(true)
    try {
      const { isActive, ...rest } = values
      if (ptModal.editing) {
        await masterApi.updateProductType(ptModal.editing.id, rest)
        if (isActive !== ptModal.editing.isActive) {
          await masterApi.toggleProductTypeStatus(ptModal.editing.id, isActive)
        }
        message.success('แก้ไขประเภทสำเร็จ')
      } else {
        await masterApi.createProductType(rest)
        message.success('เพิ่มประเภทสำเร็จ')
      }
      setPtModal({ open: false, editing: null })
      await loadAll()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handlePtDelete = async (id: number) => {
    try {
      await masterApi.deleteProductType(id)
      message.success('ลบสำเร็จ')
      await loadAll()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    }
  }

  // ─── Unit handlers ────────────────────────────────────────────────────────

  const openUnitModal = (editing: UnitItem | null = null) => {
    unitForm.resetFields()
    if (editing) unitForm.setFieldsValue({ ...editing })
    setUnitModal({ open: true, editing })
  }

  const handleUnitSave = async () => {
    const values = await unitForm.validateFields()
    setLoading(true)
    try {
      const { isActive, ...rest } = values
      if (unitModal.editing) {
        await masterApi.updateUnit(unitModal.editing.id, rest)
        if (isActive !== unitModal.editing.isActive) {
          await masterApi.toggleUnitStatus(unitModal.editing.id, isActive)
        }
        message.success('แก้ไขหน่วยสำเร็จ')
      } else {
        await masterApi.createUnit(rest)
        message.success('เพิ่มหน่วยสำเร็จ')
      }
      setUnitModal({ open: false, editing: null })
      await loadAll()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleUnitDelete = async (id: number) => {
    try {
      await masterApi.deleteUnit(id)
      message.success('ลบสำเร็จ')
      await loadAll()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    }
  }

  // ─── Columns ──────────────────────────────────────────────────────────────

  const ptColumns = [
    { title: 'ชื่อ (name)', dataIndex: 'name', key: 'name', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'ป้ายกำกับ (label)', dataIndex: 'label', key: 'label' },
    {
      title: 'สถานะ',
      key: 'isActive',
      width: 110,
      render: (_: unknown, record: ProductTypeItem) =>
        record.isActive ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ไม่ใช้งาน</Tag>,
    },
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
    {
      title: 'สถานะ',
      key: 'isActive',
      width: 110,
      render: (_: unknown, record: UnitItem) =>
        record.isActive ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ไม่ใช้งาน</Tag>,
    },
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
              dataSource={allProductTypes}
              columns={ptColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 'max-content' }}
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
                {ptModal.editing && (
                  <Form.Item name="isActive" label="สถานะ" valuePropName="checked">
                    <Switch checkedChildren="ใช้งาน" unCheckedChildren="ปิด" />
                  </Form.Item>
                )}
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
              dataSource={allUnits}
              columns={unitColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 'max-content' }}
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
                {unitModal.editing && (
                  <Form.Item name="isActive" label="สถานะ" valuePropName="checked">
                    <Switch checkedChildren="ใช้งาน" unCheckedChildren="ปิด" />
                  </Form.Item>
                )}
              </Form>
            </Modal>
          </>
        )}
      </App>
    </RoleGuard>
  )
}
