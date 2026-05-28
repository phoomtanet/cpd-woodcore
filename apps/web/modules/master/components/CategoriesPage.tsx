'use client'

import { useState, useEffect, useCallback } from 'react'
import { App, Button, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import PermissionGuard from '@/shared/guards/PermissionGuard'
import { useMasterStore } from '@/store/masterStore'
import { masterApi } from '../services/masterApi'
import { usePermissionStore } from '@/store/permissionStore'
import type { CategoryItem } from '@/types'

function CategoriesContent() {
  const { setCategories } = useMasterStore()
  const canCreate = usePermissionStore((s) => s.canCreate('master-categories'))
  const canUpdate = usePermissionStore((s) => s.canUpdate('master-categories'))
  const canDelete = usePermissionStore((s) => s.canDelete('master-categories'))
  const { message } = App.useApp()

  const [items, setItems] = useState<CategoryItem[]>([])
  const [modal, setModal] = useState<{ open: boolean; editing: CategoryItem | null }>({
    open: false,
    editing: null,
  })
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const syncStore = useCallback(
    (cats: CategoryItem[]) => setCategories(cats.filter((c) => c.isActive)),
    [setCategories]
  )

  const load = useCallback(async () => {
    const cats = await masterApi.getCategories('all')
    setItems(cats)
    syncStore(cats)
  }, [syncStore])

  useEffect(() => {
    load()
  }, [load])

  const openModal = (editing: CategoryItem | null = null) => {
    setModal({ open: true, editing })
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      const { isActive, ...rest } = values
      if (modal.editing) {
        await masterApi.updateCategory(modal.editing.id, rest)
        if (isActive !== modal.editing.isActive) {
          await masterApi.toggleCategoryStatus(modal.editing.id, isActive)
        }
        message.success('แก้ไขหมวดหมู่สำเร็จ')
      } else {
        await masterApi.createCategory(rest)
        message.success('เพิ่มหมวดหมู่สำเร็จ')
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
      await masterApi.deleteCategory(id)
      message.success('ลบสำเร็จ')
      await load()
    } catch {
      message.error('เกิดข้อผิดพลาด')
    }
  }

  const columns = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    { title: 'หมวดหมู่', dataIndex: 'name', key: 'name' },
    {
      title: 'สถานะ',
      key: 'isActive',
      width: 110,
      render: (_: unknown, r: CategoryItem) =>
        r.isActive ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ไม่ใช้งาน</Tag>,
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: 'จัดการ',
            key: 'actions',
            width: 100,
            render: (_: unknown, r: CategoryItem) => (
              <Space>
                {canUpdate && (
                  <Button type="text" icon={<EditOutlined />} onClick={() => openModal(r)} />
                )}
                {canDelete && (
                  <Popconfirm title="ลบหมวดหมู่นี้?" onConfirm={() => handleDelete(r.id)}>
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
        title="หมวดหมู่สินค้า"
        subtitle="จัดการหมวดหมู่สินค้า"
        extra={
          canCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              เพิ่มหมวดหมู่
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
        title={modal.editing ? 'แก้ไขหมวดหมู่สินค้า' : 'เพิ่มหมวดหมู่สินค้า'}
        okText={modal.editing ? 'บันทึก' : 'เพิ่ม'}
        cancelText="ยกเลิก"
        onOk={handleSave}
        onCancel={() => setModal({ open: false, editing: null })}
        confirmLoading={loading}
        destroyOnHidden
        afterOpenChange={(open: boolean) => {
          if (open) {
            form.resetFields()
            if (modal.editing) form.setFieldsValue({ ...modal.editing })
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="ชื่อหมวดหมู่"
            rules={[{ required: true, message: 'กรุณากรอก' }]}
          >
            <Input placeholder="เช่น พาเลท, ไม้แปรรูป, บรรจุภัณฑ์" />
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

export default function CategoriesPage() {
  return (
    <PermissionGuard menuKey="master-categories">
      <App>
        <CategoriesContent />
      </App>
    </PermissionGuard>
  )
}
