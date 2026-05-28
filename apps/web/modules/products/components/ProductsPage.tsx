'use client'

import { useState } from 'react'
import { Input, Select, Button, Alert, App, Space } from 'antd'
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons'
import PageHeader from '@/shared/components/PageHeader'
import PermissionGuard from '@/shared/guards/PermissionGuard'
import ProductTable from './ProductTable'
import ProductFormModal from './ProductFormModal'
import { useProducts } from '../hooks/useProducts'
import { usePermissionStore } from '@/store/permissionStore'
import { useMasterStore } from '@/store/masterStore'
import type { Product } from '../types'

export default function ProductsPage() {
  const {
    products,
    loading,
    error,
    search,
    setSearch,
    productType,
    setProductType,
    categoryId,
    setCategoryId,
    status,
    setStatus,
    createProduct,
    updateProduct,
    removeProduct,
    setProducts,
  } = useProducts()
  const { productTypes, categories } = useMasterStore()
  const productTypeFilterOptions = [
    { value: '', label: 'ทุกประเภท' },
    ...productTypes.map((pt) => ({ value: pt.name, label: pt.label })),
  ]
  const categoryFilterOptions = [
    { value: 0, label: 'ทุกหมวดหมู่' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const canCreate = usePermissionStore((s) => s.canCreate('products'))
  const canUpdate = usePermissionStore((s) => s.canUpdate('products'))
  const canDelete = usePermissionStore((s) => s.canDelete('products'))

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditing(product)
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleImageUploaded = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setEditing(updated)
  }

  return (
    <PermissionGuard menuKey="products">
      <App>
        <PageHeader
          title="รายการสินค้า"
          subtitle="จัดการสินค้าคงคลัง — วัตถุดิบ, WIP, สำเร็จรูป"
          extra={
            canCreate ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
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
            options={productTypeFilterOptions}
            value={productType ?? ''}
            onChange={(v: string) => setProductType(v || undefined)}
            style={{ width: 140 }}
            suffixIcon={<AppstoreOutlined />}
          />
          <Select
            options={categoryFilterOptions}
            value={categoryId ?? 0}
            onChange={(v: number) => setCategoryId(v || undefined)}
            style={{ width: 160 }}
          />
          <Select
            value={status}
            onChange={(v: 'active' | 'inactive' | 'all') => setStatus(v)}
            style={{ width: 140 }}
            options={[
              { value: 'active', label: 'ใช้งาน' },
              { value: 'inactive', label: 'ไม่ใช้งาน' },
              { value: 'all', label: 'ทั้งหมด' },
            ]}
          />
        </Space>

        <ProductTable
          products={products}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={handleEdit}
          onDelete={removeProduct}
        />

        <ProductFormModal
          open={modalOpen}
          editing={editing}
          onClose={handleClose}
          onCreate={createProduct}
          onUpdate={updateProduct}
          onImageUploaded={handleImageUploaded}
        />
      </App>
    </PermissionGuard>
  )
}
