'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Layout, Menu, theme, Typography, Avatar, Dropdown, Space, Badge } from 'antd'
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
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/store/authStore'
import { usePermissionStore } from '@/store/permissionStore'
import { useRolesStore } from '@/store/rolesStore'
import { useMasterStore } from '@/store/masterStore'
import { masterApi } from '@/modules/master/services/masterApi'
import { stockApi } from '@/modules/stock/services/stockApi'
import { useAlertsStore } from '@/store/alertsStore'

const { Sider, Header, Content, Footer } = Layout

type MenuLeaf = { key: string; icon: React.ReactNode; label: string; menuKey: string }
type MenuGroup = { key: string; icon: React.ReactNode; label: string; children: MenuLeaf[] }
type MenuDef = MenuLeaf | MenuGroup

function isGroup(item: MenuDef): item is MenuGroup {
  return 'children' in item
}

const ALL_MENU_ITEMS: MenuDef[] = [
  { key: ROUTES.DASHBOARD, icon: <DashboardOutlined />, label: 'Dashboard', menuKey: 'dashboard' },
  {
    key: 'master-group',
    icon: <AppstoreOutlined />,
    label: 'ข้อมูลหลัก',
    children: [
      {
        key: ROUTES.SETTINGS_MASTER_TYPES,
        icon: <AppstoreOutlined />,
        label: 'ประเภทสินค้า',
        menuKey: 'master-types',
      },
      {
        key: ROUTES.SETTINGS_MASTER_UNITS,
        icon: <AppstoreOutlined />,
        label: 'หน่วยนับ',
        menuKey: 'master-units',
      },
      {
        key: ROUTES.SETTINGS_MASTER_CATEGORIES,
        icon: <AppstoreOutlined />,
        label: 'หมวดหมู่',
        menuKey: 'master-categories',
      },
      {
        key: ROUTES.SETTINGS_MASTER_SKU_PREFIXES,
        icon: <AppstoreOutlined />,
        label: 'SKU Prefix',
        menuKey: 'master-sku-prefixes',
      },
    ],
  },
  { key: ROUTES.PRODUCTS, icon: <AppstoreOutlined />, label: 'สินค้า', menuKey: 'products' },
  {
    key: 'stock',
    icon: <FileTextOutlined />,
    label: 'คลังสินค้า',
    children: [
      {
        key: ROUTES.STOCK_IN,
        icon: <ImportOutlined />,
        label: 'รับสินค้าเข้า',
        menuKey: 'stock-in',
      },
      {
        key: ROUTES.STOCK_OUT,
        icon: <ExportOutlined />,
        label: 'เบิกสินค้าออก',
        menuKey: 'stock-out',
      },
      {
        key: ROUTES.STOCK_ADJUST,
        icon: <ControlOutlined />,
        label: 'ปรับสต๊อก',
        menuKey: 'stock-adjust',
      },
      {
        key: ROUTES.STOCK_TRANSFER,
        icon: <SwapOutlined />,
        label: 'โอนย้าย',
        menuKey: 'stock-transfer',
      },
      {
        key: ROUTES.STOCK_CARD,
        icon: <FileTextOutlined />,
        label: 'Stock Card',
        menuKey: 'stock-card',
      },
    ],
  },
  { key: ROUTES.ALERTS, icon: <BellOutlined />, label: 'Low Stock Alert', menuKey: 'alerts' },
  { key: ROUTES.REPORTS, icon: <BarChartOutlined />, label: 'รายงาน', menuKey: 'reports' },
  { key: ROUTES.USERS, icon: <TeamOutlined />, label: 'จัดการผู้ใช้', menuKey: 'users' },
  {
    key: 'settings-group',
    icon: <SettingOutlined />,
    label: 'ตั้งค่า',
    children: [
      {
        key: ROUTES.SETTINGS_ROLES,
        icon: <SettingOutlined />,
        label: 'สิทธิ์การใช้งาน',
        menuKey: 'settings',
      },
    ],
  },
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
  const { clearPermissions, canView } = usePermissionStore()
  const { clearRoles, getLabelByName } = useRolesStore()
  const {
    productTypes,
    units,
    categories,
    skuPrefixes,
    setProductTypes,
    setUnits,
    setCategories,
    setSkuPrefixes,
    clearMaster,
  } = useMasterStore()
  const { lowStockCount, setLowStockCount, clearAlerts } = useAlertsStore()

  useEffect(() => {
    const needsLoad =
      productTypes.length === 0 ||
      units.length === 0 ||
      categories.length === 0 ||
      skuPrefixes.length === 0
    if (needsLoad) {
      Promise.all([
        masterApi.getProductTypes(),
        masterApi.getUnits(),
        masterApi.getCategories(),
        masterApi.getSkuPrefixes(),
      ])
        .then(([pts, us, cats, prefixes]) => {
          setProductTypes(pts)
          setUnits(us)
          setCategories(cats)
          setSkuPrefixes(prefixes)
        })
        .catch(() => {})
    }
  }, [
    productTypes.length,
    units.length,
    categories.length,
    skuPrefixes.length,
    setProductTypes,
    setUnits,
    setCategories,
    setSkuPrefixes,
  ])

  useEffect(() => {
    stockApi
      .getLowAlert()
      .then((data) => setLowStockCount(data.length))
      .catch(() => {})
  }, [setLowStockCount])

  const visibleMenuItems = ALL_MENU_ITEMS.filter((item) => {
    if (isGroup(item)) return item.children.some((child) => canView(child.menuKey))
    return canView(item.menuKey)
  }).map((item) => {
    if (!isGroup(item)) {
      const label =
        item.menuKey === 'alerts' && lowStockCount > 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.label}
            <Badge count={lowStockCount} size="small" />
          </span>
        ) : (
          item.label
        )
      return { key: item.key, icon: item.icon, label }
    }
    return {
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children
        .filter((child) => canView(child.menuKey))
        .map((child) => ({ key: child.key, icon: child.icon, label: child.label })),
    }
  })

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'ออกจากระบบ',
      onClick: () => {
        clearAuth()
        clearPermissions()
        clearRoles()
        clearMaster()
        clearAlerts()
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
          items={visibleMenuItems}
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
                    ({getLabelByName(user.role)})
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
