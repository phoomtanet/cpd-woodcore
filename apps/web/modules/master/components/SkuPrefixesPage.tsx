'use client'

import { useState, useEffect, useCallback } from 'react'
import { App, Button, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import PermissionGuard from '@/shared/guards/PermissionGuard'
import { useMasterStore } from '@/store/masterStore'
import { masterApi } from '../services/masterApi'
import { usePermissionStore } from '@/store/permissionStore'
import type { SkuPrefixItem } from '@/types'

function SkuPrefixesContent() {
  const { setSkuPrefixes } = useMasterStore()
  const canCreate = usePermissionStore((s) => s.canCreate('master-sku-prefixes'))
  const canUpdate = usePermissionStore((s) => s.canUpdate('master-sku-prefixes'))
  const canDelete = usePermissionStore((s) => s.canDelete('master-sku-prefixes'))
  const { message } = App.useApp()

  const [items, setItems] = useState<SkuPrefixItem[]>([])
  const [modal, setModal] = useState<{ open: boolean; editing: SkuPrefixItem | null }>({
    open: false,
    editing: null,
  })
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const syncStore = useCallback(
    (prefixes: SkuPrefixItem[]) => setSkuPrefixes(prefixes.filter((p) => p.isActive)),
    [setSkuPrefixes]
  )

  const load = useCallback(async () => {
    const prefixes = await masterApi.getSkuPrefixes('all')
    setItems(prefixes)
    syncStore(prefixes)
  }, [syncStore])

  useEffect(() => {
    load()
  }, [load])

  const openModal = (editing: SkuPrefixItem | null = null) => {
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
        await masterApi.updateSkuPrefix(modal.editing.id, rest)
        if (isActive !== modal.editing.isActive) {
          await masterApi.toggleSkuPrefixStatus(modal.editing.id, isActive)
        }
        message.success('แก้ไข SKU Prefix สำเร็จ')
      } else {
        await masterApi.createSkuPrefix(rest)
        message.success('เพิ่ม SKU Prefix สำเร็จ')
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
      await masterApi.deleteSkuPrefix(id)
      message.success('ลบสำเร็จ')
      await load()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const columns = [
    {
      title: 'Prefix',
      dataIndex: 'prefix',
      key: 'prefix',
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: 'ป้ายกำกับ', dataIndex: 'label', key: 'label' },
    {
      title: 'สถานะ',
      key: 'isActive',
      width: 110,
      render: (_: unknown, r: SkuPrefixItem) =>
        r.isActive ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ไม่ใช้งาน</Tag>,
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: '',
            key: 'actions',
            width: 100,
            render: (_: unknown, r: SkuPrefixItem) => (
              <Space>
                {canUpdate && (
                  <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
                )}
                {canDelete && (
                  <Popconfirm title="ลบ SKU Prefix นี้?" onConfirm={() => handleDelete(r.id)}>
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
        title="SKU Prefix"
        subtitle="จัดการ prefix สำหรับรหัสสินค้า"
        extra={
          canCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              เพิ่ม Prefix
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
        title={modal.editing ? 'แก้ไข SKU Prefix' : 'เพิ่ม SKU Prefix'}
        okText={modal.editing ? 'บันทึก' : 'เพิ่ม'}
        cancelText="ยกเลิก"
        onOk={handleSave}
        onCancel={() => setModal({ open: false, editing: null })}
        confirmLoading={loading}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="prefix"
            label="Prefix (ตัวอักษร)"
            rules={[{ required: true, message: 'กรุณากรอก' }]}
          >
            <Input
              placeholder="เช่น PAL, WD, PKG"
              disabled={!!modal.editing}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
          <Form.Item
            name="label"
            label="ป้ายกำกับ (แสดงผล)"
            rules={[{ required: true, message: 'กรุณากรอก' }]}
          >
            <Input placeholder="เช่น พาเลท, ไม้, บรรจุภัณฑ์" />
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

export default function SkuPrefixesPage() {
  return (
    <PermissionGuard menuKey="master-sku-prefixes">
      <App>
        <SkuPrefixesContent />
      </App>
    </PermissionGuard>
  )
}
