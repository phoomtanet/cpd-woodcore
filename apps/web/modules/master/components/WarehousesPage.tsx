'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import axios from 'axios'
import PageHeader from '@/shared/components/PageHeader'
import PermissionGuard from '@/shared/guards/PermissionGuard'
import { useMasterStore } from '@/store/masterStore'
import { masterApi } from '../services/masterApi'
import { usePermissionStore } from '@/store/permissionStore'
import type { WarehouseItem, BinLocationItem } from '@/types'

// ─── Bin Locations sub-table ──────────────────────────────────────────────

interface BinsTableProps {
  warehouseId: number
  bins: BinLocationItem[]
  canCreateBin: boolean
  canUpdateBin: boolean
  canDeleteBin: boolean
  onAddBin: (warehouseId: number) => void
  onEditBin: (bin: BinLocationItem) => void
  onDeleteBin: (id: number) => void
}

function BinsTable({
  warehouseId,
  bins,
  canCreateBin,
  canUpdateBin,
  canDeleteBin,
  onAddBin,
  onEditBin,
  onDeleteBin,
}: BinsTableProps) {
  const binColumns = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, i: number) => i + 1,
    },
    { title: 'รหัส Bin', dataIndex: 'code', key: 'code' },
    {
      title: 'ชื่อ',
      dataIndex: 'name',
      key: 'name',
      render: (v: string | null) => v ?? '-',
    },
    {
      title: 'สถานะ',
      key: 'isActive',
      width: 110,
      render: (_: unknown, r: BinLocationItem) =>
        r.isActive ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ไม่ใช้งาน</Tag>,
    },
    ...(canUpdateBin || canDeleteBin
      ? [
          {
            title: 'จัดการ',
            key: 'actions',
            width: 100,
            render: (_: unknown, r: BinLocationItem) => (
              <Space>
                {canUpdateBin && (
                  <Button type="text" icon={<EditOutlined />} onClick={() => onEditBin(r)} />
                )}
                {canDeleteBin && (
                  <Popconfirm title="ลบ Bin นี้?" onConfirm={() => onDeleteBin(r.id)}>
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
    <div style={{ margin: '8px 0 8px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Typography.Text strong>Bin Locations</Typography.Text>
        {canCreateBin && (
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onAddBin(warehouseId)}
          >
            เพิ่ม Bin
          </Button>
        )}
      </div>
      <Table
        dataSource={bins}
        columns={binColumns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'ยังไม่มี Bin Locations' }}
      />
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────

function WarehousesContent() {
  const { setWarehouses } = useMasterStore()
  const canCreate = usePermissionStore((s) => s.canCreate('master-warehouses'))
  const canUpdate = usePermissionStore((s) => s.canUpdate('master-warehouses'))
  const canDelete = usePermissionStore((s) => s.canDelete('master-warehouses'))
  const canCreateBin = usePermissionStore((s) => s.canCreate('master-bins'))
  const canUpdateBin = usePermissionStore((s) => s.canUpdate('master-bins'))
  const canDeleteBin = usePermissionStore((s) => s.canDelete('master-bins'))
  const { message } = App.useApp()

  const [warehouses, setWhs] = useState<WarehouseItem[]>([])
  const [binsCache, setBinsCache] = useState<Record<number, BinLocationItem[]>>({})
  const [whModal, setWhModal] = useState<{ open: boolean; editing: WarehouseItem | null }>({
    open: false,
    editing: null,
  })
  const [binModal, setBinModal] = useState<{
    open: boolean
    editing: BinLocationItem | null
    warehouseId: number | null
  }>({ open: false, editing: null, warehouseId: null })
  const [whForm] = Form.useForm()
  const [binForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const syncStore = useCallback(
    (whs: WarehouseItem[]) => setWarehouses(whs.filter((w) => w.isActive)),
    [setWarehouses]
  )

  const loadWarehouses = useCallback(async () => {
    const whs = await masterApi.getWarehouses('all')
    setWhs(whs)
    syncStore(whs)
  }, [syncStore])

  const loadBins = useCallback(async (warehouseId: number) => {
    const bins = await masterApi.getBinsByWarehouse(warehouseId, 'all')
    setBinsCache((prev) => ({ ...prev, [warehouseId]: bins }))
  }, [])

  useEffect(() => {
    loadWarehouses()
  }, [loadWarehouses])

  // ── Warehouse modal ──

  const openWhModal = (editing: WarehouseItem | null = null) => {
    setWhModal({ open: true, editing })
  }

  const handleSaveWarehouse = async () => {
    const values = await whForm.validateFields()
    setLoading(true)
    try {
      const { isActive, ...rest } = values
      if (whModal.editing) {
        await masterApi.updateWarehouse(whModal.editing.id, rest)
        if (isActive !== whModal.editing.isActive) {
          await masterApi.toggleWarehouseStatus(whModal.editing.id, isActive)
        }
        message.success('แก้ไขคลังสำเร็จ')
      } else {
        await masterApi.createWarehouse(rest)
        message.success('เพิ่มคลังสำเร็จ')
      }
      setWhModal({ open: false, editing: null })
      await loadWarehouses()
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined
      message.error(msg ?? 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWarehouse = async (id: number) => {
    try {
      await masterApi.deleteWarehouse(id)
      message.success('ลบสำเร็จ')
      await loadWarehouses()
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined
      message.error(msg ?? 'เกิดข้อผิดพลาด')
    }
  }

  // ── Bin modal ──

  const openBinModal = (warehouseId: number, editing: BinLocationItem | null = null) => {
    setBinModal({ open: true, editing, warehouseId })
  }

  const handleSaveBin = async () => {
    const values = await binForm.validateFields()
    setLoading(true)
    try {
      const { isActive, ...rest } = values
      if (binModal.editing) {
        await masterApi.updateBin(binModal.editing.id, rest)
        if (isActive !== binModal.editing.isActive) {
          await masterApi.toggleBinStatus(binModal.editing.id, isActive)
        }
        message.success('แก้ไข Bin สำเร็จ')
      } else {
        await masterApi.createBin({ warehouseId: binModal.warehouseId!, ...rest })
        message.success('เพิ่ม Bin สำเร็จ')
      }
      setBinModal({ open: false, editing: null, warehouseId: null })
      if (binModal.warehouseId) await loadBins(binModal.warehouseId)
      if (binModal.editing) await loadBins(binModal.editing.warehouseId)
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined
      message.error(msg ?? 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBin = async (id: number, warehouseId: number) => {
    try {
      await masterApi.deleteBin(id)
      message.success('ลบ Bin สำเร็จ')
      await loadBins(warehouseId)
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : undefined
      message.error(msg ?? 'เกิดข้อผิดพลาด')
    }
  }

  // ── Warehouse table columns ──

  const warehouseColumns = [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, i: number) => i + 1,
    },
    { title: 'รหัส', dataIndex: 'code', key: 'code', width: 120 },
    { title: 'ชื่อคลัง', dataIndex: 'name', key: 'name' },
    {
      title: 'ชื่อย่อ',
      dataIndex: 'shortName',
      key: 'shortName',
      render: (v: string | null) => v ?? '-',
    },
    {
      title: 'สถานะ',
      key: 'isActive',
      width: 110,
      render: (_: unknown, r: WarehouseItem) =>
        r.isActive ? <Tag color="success">ใช้งาน</Tag> : <Tag color="default">ไม่ใช้งาน</Tag>,
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: 'จัดการ',
            key: 'actions',
            width: 100,
            render: (_: unknown, r: WarehouseItem) => (
              <Space>
                {canUpdate && (
                  <Button type="text" icon={<EditOutlined />} onClick={() => openWhModal(r)} />
                )}
                {canDelete && (
                  <Popconfirm title="ลบคลังนี้?" onConfirm={() => handleDeleteWarehouse(r.id)}>
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
        title="คลังสินค้า"
        subtitle="จัดการคลังสินค้าและ Bin Locations"
        extra={
          canCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openWhModal()}>
              เพิ่มคลัง
            </Button>
          ) : undefined
        }
      />

      <Table
        dataSource={warehouses}
        columns={warehouseColumns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowRender: (record: WarehouseItem) => (
            <BinsTable
              warehouseId={record.id}
              bins={binsCache[record.id] ?? []}
              canCreateBin={canCreateBin}
              canUpdateBin={canUpdateBin}
              canDeleteBin={canDeleteBin}
              onAddBin={(wid) => openBinModal(wid)}
              onEditBin={(bin) => openBinModal(bin.warehouseId, bin)}
              onDeleteBin={(id) => handleDeleteBin(id, record.id)}
            />
          ),
          onExpand: (expanded: boolean, record: WarehouseItem) => {
            if (expanded) loadBins(record.id)
          },
        }}
      />

      {/* Warehouse modal */}
      <Modal
        open={whModal.open}
        title={whModal.editing ? 'แก้ไขคลังสินค้า' : 'เพิ่มคลังสินค้า'}
        okText={whModal.editing ? 'บันทึก' : 'เพิ่ม'}
        cancelText="ยกเลิก"
        onOk={handleSaveWarehouse}
        onCancel={() => setWhModal({ open: false, editing: null })}
        confirmLoading={loading}
        destroyOnHidden
        afterOpenChange={(open: boolean) => {
          if (open) {
            whForm.resetFields()
            if (whModal.editing) whForm.setFieldsValue({ ...whModal.editing })
          }
        }}
      >
        <Form form={whForm} layout="vertical">
          <Form.Item
            name="code"
            label="รหัสคลัง"
            rules={[{ required: true, message: 'กรุณากรอก' }]}
          >
            <Input placeholder="เช่น WH-001" />
          </Form.Item>
          <Form.Item
            name="name"
            label="ชื่อคลัง"
            rules={[{ required: true, message: 'กรุณากรอก' }]}
          >
            <Input placeholder="เช่น คลังหลัก" />
          </Form.Item>
          <Form.Item name="shortName" label="ชื่อย่อ">
            <Input placeholder="เช่น MAIN" />
          </Form.Item>
          <Form.Item name="address" label="ที่อยู่">
            <Input.TextArea rows={2} placeholder="ที่อยู่คลัง" />
          </Form.Item>
          {whModal.editing && (
            <Form.Item name="isActive" label="สถานะ" valuePropName="checked">
              <Switch checkedChildren="ใช้งาน" unCheckedChildren="ปิด" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Bin modal */}
      <Modal
        open={binModal.open}
        title={binModal.editing ? 'แก้ไข Bin Location' : 'เพิ่ม Bin Location'}
        okText={binModal.editing ? 'บันทึก' : 'เพิ่ม'}
        cancelText="ยกเลิก"
        onOk={handleSaveBin}
        onCancel={() => setBinModal({ open: false, editing: null, warehouseId: null })}
        confirmLoading={loading}
        destroyOnHidden
        afterOpenChange={(open: boolean) => {
          if (open) {
            binForm.resetFields()
            if (binModal.editing) binForm.setFieldsValue({ ...binModal.editing })
          }
        }}
      >
        <Form form={binForm} layout="vertical">
          <Form.Item
            name="code"
            label="รหัส Bin"
            rules={[{ required: true, message: 'กรุณากรอก' }]}
          >
            <Input placeholder="เช่น A-01" />
          </Form.Item>
          <Form.Item name="name" label="ชื่อ Bin">
            <Input placeholder="เช่น ชั้น A แถว 1" />
          </Form.Item>
          {binModal.editing && (
            <Form.Item name="isActive" label="สถานะ" valuePropName="checked">
              <Switch checkedChildren="ใช้งาน" unCheckedChildren="ปิด" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  )
}

export default function WarehousesPage() {
  return (
    <PermissionGuard menuKey="master-warehouses">
      <App>
        <WarehousesContent />
      </App>
    </PermissionGuard>
  )
}
