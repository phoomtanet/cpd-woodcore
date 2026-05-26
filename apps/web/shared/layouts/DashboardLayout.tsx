'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Layout, Menu, theme, Typography, Avatar, Dropdown, Space } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  ImportOutlined,
  ExportOutlined,
  ControlOutlined,
  SwapOutlined,
  FileTextOutlined,
  BellOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { ROUTES, ROLE_LABELS } from '@/constants'
import { useAuthStore } from '@/store/authStore'

const { Sider, Header, Content, Footer } = Layout

const menuItems = [
  { key: ROUTES.DASHBOARD, icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: ROUTES.PRODUCTS, icon: <AppstoreOutlined />, label: 'สินค้า' },
  {
    key: 'stock',
    icon: <FileTextOutlined />,
    label: 'คลังสินค้า',
    children: [
      { key: ROUTES.STOCK_IN, icon: <ImportOutlined />, label: 'รับสินค้าเข้า' },
      { key: ROUTES.STOCK_OUT, icon: <ExportOutlined />, label: 'เบิกสินค้าออก' },
      { key: ROUTES.STOCK_ADJUST, icon: <ControlOutlined />, label: 'ปรับสต๊อก' },
      { key: ROUTES.STOCK_TRANSFER, icon: <SwapOutlined />, label: 'โอนย้าย' },
      { key: ROUTES.STOCK_CARD, icon: <FileTextOutlined />, label: 'Stock Card' },
    ],
  },
  { key: ROUTES.ALERTS, icon: <BellOutlined />, label: 'Low Stock Alert' },
  { key: ROUTES.REPORTS, icon: <BarChartOutlined />, label: 'รายงาน' },
  { key: ROUTES.USERS, icon: <TeamOutlined />, label: 'จัดการผู้ใช้' },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const {
    token: { colorBgContainer },
  } = theme.useToken()
  const { user, clearAuth } = useAuthStore()

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ออกจากระบบ',
      onClick: () => {
        clearAuth()
        router.push(ROUTES.LOGIN)
      },
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 48,
            margin: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            overflow: 'hidden',
          }}
        >
          <Typography.Text strong style={{ color: '#fff', fontSize: 14, whiteSpace: 'nowrap' }}>
            {collapsed ? 'CPD' : 'CPD Woodcore'}
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['stock']}
          items={menuItems}
          onClick={({ key }: { key: string }) => router.push(key)}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              {user && (
                <span>
                  {user.name}
                  <Typography.Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>
                    ({ROLE_LABELS[user.role] ?? user.role})
                  </Typography.Text>
                </span>
              )}
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 16 }}>
          <div
            style={{ padding: 24, background: colorBgContainer, minHeight: 360, borderRadius: 8 }}
          >
            {children}
          </div>
        </Content>

        <Footer style={{ textAlign: 'center', color: '#888', fontSize: 12 }}>
          CPD Woodcore ©{new Date().getFullYear()} — ระบบสต๊อกสินค้า
        </Footer>
      </Layout>
    </Layout>
  )
}
