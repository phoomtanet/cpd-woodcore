'use client'

import { Form, Input, Button, Alert, Typography } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useLogin } from '../hooks/useLogin'

interface LoginFields {
  email: string
  password: string
}

export default function LoginForm() {
  const { login, loading, error } = useLogin()

  const onFinish = ({ email, password }: LoginFields) => {
    login(email, password)
  }

  return (
    <div
      style={{
        width: 380,
        background: '#fff',
        borderRadius: 8,
        padding: 32,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          CPD Woodcore
        </Typography.Title>
        <Typography.Text type="secondary">ระบบสต๊อกสินค้า — ซีพีดี ซอว์มิลล์</Typography.Text>
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Form layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'กรุณากรอก Email' },
            { type: 'email', message: 'รูปแบบ Email ไม่ถูกต้อง' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item name="password" rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="รหัสผ่าน" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block>
            เข้าสู่ระบบ
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
