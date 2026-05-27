'use client'

import { Input, Select, Button, Alert, App, Space } from 'antd'
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import RoleGuard from '@/shared/guards/RoleGuard'
import ProductTable from './ProductTable'
import { useProducts } from '../hooks/useProducts'
import { usePermissionStore } from '@/store/permissionStore'
import type { Product } from '../types'

const PRODUCT_TYPE_OPTIONS = [
  { value: '', label: 'ทุกประเภท' },
  { value: 'raw', label: 'วัตถุดิบ' },
  { value: 'wip', label: 'WIP' },
  { value: 'finished', label: 'สำเร็จรูป' },
]

interface ProductsPageProps {
  onEdit?: (product: Product) => void
  onAdd?: () => void
}

export default function ProductsPage({ onEdit, onAdd }: ProductsPageProps) {
  const {
    products,
    loading,
    error,
    search,
    setSearch,
    productType,
    setProductType,
    removeProduct,
  } = useProducts()
  const canCreate = usePermissionStore((s) => s.canCreate('products'))
  const canUpdate = usePermissionStore((s) => s.canUpdate('products'))
  const canDelete = usePermissionStore((s) => s.canDelete('products'))

  return (
    <RoleGuard roles={['manager', 'admin']}>
      <App>
        <PageHeader
          title="รายการสินค้า"
          subtitle="จัดการสินค้าคงคลัง — วัตถุดิบ, WIP, สำเร็จรูป"
          extra={
            canCreate && onAdd ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
                เพิ่มสินค้า
              </Button>
            ) : undefined
          }
        />

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search
            placeholder="ค้นหาชื่อ, SKU, Barcode"
            allowClear
            style={{ width: 260 }}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onSearch={(v: string) => setSearch(v)}
          />
          <Select
            options={PRODUCT_TYPE_OPTIONS}
            value={productType ?? ''}
            onChange={(v: string) => setProductType(v || undefined)}
            style={{ width: 140 }}
            suffixIcon={<AppstoreOutlined />}
          />
        </Space>

        <ProductTable
          products={products}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={onEdit ?? (() => {})}
          onDelete={removeProduct}
        />
      </App>
    </RoleGuard>
  )
}
