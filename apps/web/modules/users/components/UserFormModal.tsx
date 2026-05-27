'use client'

import { useEffect, useState } from 'react'
import { Form, Input, Select, Switch, Modal, App } from 'antd'
import type { User } from '@/types'
import type { CreateUserDto, UpdateUserDto } from '../types'
import { useRolesStore } from '@/store/rolesStore'

interface UserFormModalProps {
  open: boolean
  editing: User | null
  onClose: () => void
  onCreate: (dto: CreateUserDto) => Promise<unknown>
  onUpdate: (id: number, dto: UpdateUserDto) => Promise<unknown>
}

export default function UserFormModal({
  open,
  editing,
  onClose,
  onCreate,
  onUpdate,
}: UserFormModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()
  const roles = useRolesStore((s) => s.roles)
  const roleOptions = roles.map((r) => ({ value: r.name, label: r.label }))
  const isEdit = !!editing

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (editing) {
        form.setFieldsValue({ name: editing.name, role: editing.role, isActive: editing.isActive })
      }
    }
  }, [open, editing, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      if (isEdit && editing) {
        await onUpdate(editing.id, values as UpdateUserDto)
        message.success('แก้ไขผู้ใช้สำเร็จ')
      } else {
        await onCreate(values as CreateUserDto)
        message.success('เพิ่มผู้ใช้สำเร็จ')
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

  return (
    <Modal
      open={open}
      title={isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}
      okText={isEdit ? 'บันทึก' : 'เพิ่ม'}
      cancelText="ยกเลิก"
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="ชื่อ" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}>
          <Input placeholder="ชื่อผู้ใช้" />
        </Form.Item>

        {!isEdit && (
          <>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'กรุณากรอก Email' },
                { type: 'email', message: 'รูปแบบ Email ไม่ถูกต้อง' },
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
            <Form.Item
              name="password"
              label="รหัสผ่าน"
              rules={[
                { required: true, message: 'กรุณากรอกรหัสผ่าน' },
                { min: 6, message: 'อย่างน้อย 6 ตัวอักษร' },
              ]}
            >
              <Input.Password placeholder="รหัสผ่าน" />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'กรุณาเลือก Role' }]}
        >
          <Select options={roleOptions} placeholder="เลือก Role" />
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
