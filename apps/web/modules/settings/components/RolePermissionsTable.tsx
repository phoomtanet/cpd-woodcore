'use client'

import { useState } from 'react'
import React from 'react'
import { Table, Checkbox, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { RolePermission, Role } from '@/types'
import type { UpdatePermissionDto } from '../types'

// Mirrors the sidebar structure from DashboardLayout
type MenuStructureEntry =
  | { type: 'group'; label: string }
  | { type: 'item'; menuKey: string; label: string; indent?: boolean }

const MENU_STRUCTURE: MenuStructureEntry[] = [
  { type: 'item', menuKey: 'dashboard', label: 'Dashboard' },
  { type: 'group', label: 'ข้อมูลหลัก' },
  { type: 'item', menuKey: 'master-types', label: 'ประเภทสินค้า', indent: true },
  { type: 'item', menuKey: 'master-units', label: 'หน่วยนับ', indent: true },
  { type: 'item', menuKey: 'master-categories', label: 'หมวดหมู่', indent: true },
  { type: 'item', menuKey: 'products', label: 'สินค้า' },
  { type: 'group', label: 'คลังสินค้า' },
  { type: 'item', menuKey: 'stock-in', label: 'รับสินค้าเข้า', indent: true },
  { type: 'item', menuKey: 'stock-out', label: 'เบิกสินค้าออก', indent: true },
  { type: 'item', menuKey: 'stock-adjust', label: 'ปรับสต๊อก', indent: true },
  { type: 'item', menuKey: 'stock-transfer', label: 'โอนย้าย', indent: true },
  { type: 'item', menuKey: 'stock-card', label: 'Stock Card', indent: true },
  { type: 'item', menuKey: 'alerts', label: 'Low Stock Alert' },
  { type: 'item', menuKey: 'reports', label: 'รายงาน' },
  { type: 'item', menuKey: 'users', label: 'จัดการผู้ใช้' },
  { type: 'group', label: 'ตั้งค่า' },
  { type: 'item', menuKey: 'settings', label: 'สิทธิ์การใช้งาน', indent: true },
]

type GroupRow = { _type: 'group'; _key: string; _label: string }
type ItemRow = RolePermission & { _type: 'item'; _label: string; _indent: boolean }
type TableRow = GroupRow | ItemRow

const PERM_FIELDS: { key: keyof UpdatePermissionDto; label: string }[] = [
  { key: 'canView', label: 'ดู' },
  { key: 'canCreate', label: 'เพิ่ม' },
  { key: 'canUpdate', label: 'แก้ไข' },
  { key: 'canDelete', label: 'ลบ' },
]

const COL_COUNT = 1 + 1 + PERM_FIELDS.length // menu + all + 4 perms

interface Props {
  role: Role
  data: RolePermission[]
  onUpdate: (role: Role, menuKey: string, dto: UpdatePermissionDto) => Promise<RolePermission>
}

export default function RolePermissionsTable({ role, data, onUpdate }: Props) {
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())
  const { message } = App.useApp()

  // Build ordered rows following MENU_STRUCTURE, append unknowns at end
  const tableData: TableRow[] = (() => {
    const rows: TableRow[] = []
    const used = new Set<string>()

    for (const entry of MENU_STRUCTURE) {
      if (entry.type === 'group') {
        rows.push({ _type: 'group', _key: `group:${entry.label}`, _label: entry.label })
      } else {
        const perm = data.find((p) => p.menuKey === entry.menuKey)
        if (perm) {
          rows.push({ ...perm, _type: 'item', _label: entry.label, _indent: entry.indent ?? false })
          used.add(entry.menuKey)
        }
      }
    }

    // Any permissions not in MENU_STRUCTURE go at bottom
    for (const perm of data) {
      if (!used.has(perm.menuKey)) {
        rows.push({ ...perm, _type: 'item', _label: perm.menuKey, _indent: false })
      }
    }

    return rows
  })()

  const handleChange = async (
    record: ItemRow,
    field: keyof UpdatePermissionDto,
    value: boolean
  ) => {
    const loadingKey = `${record.menuKey}:${field}`
    setLoadingKeys((prev) => new Set(prev).add(loadingKey))
    try {
      const dto: UpdatePermissionDto = {
        canView: record.canView,
        canCreate: record.canCreate,
        canUpdate: record.canUpdate,
        canDelete: record.canDelete,
        [field]: value,
      }
      await onUpdate(role, record.menuKey, dto)
      message.success('บันทึกสำเร็จ')
    } catch {
      message.error('บันทึกไม่สำเร็จ')
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev)
        next.delete(loadingKey)
        return next
      })
    }
  }

  const handleCheckAll = async (record: ItemRow, value: boolean) => {
    const loadingKey = `${record.menuKey}:all`
    setLoadingKeys((prev) => new Set(prev).add(loadingKey))
    try {
      const dto: UpdatePermissionDto = {
        canView: value,
        canCreate: value,
        canUpdate: value,
        canDelete: value,
      }
      await onUpdate(role, record.menuKey, dto)
      message.success('บันทึกสำเร็จ')
    } catch {
      message.error('บันทึกไม่สำเร็จ')
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev)
        next.delete(loadingKey)
        return next
      })
    }
  }

  const columns: ColumnsType<TableRow> = [
    {
      title: 'เมนู',
      key: 'menu',
      width: 180,
      onCell: (row) => (row._type === 'group' ? { colSpan: COL_COUNT } : {}),
      render: (_, row) => {
        if (row._type === 'group') {
          return <span style={{}}>{row._label}</span>
        }
        return (
          <span style={{ paddingLeft: row._indent ? 20 : 0 }}>
            {row._indent && (
              <span style={{ color: '#d9d9d9', marginRight: 6, fontSize: 10 }}>└</span>
            )}
            {row._label}
          </span>
        )
      },
    },
    {
      title: 'ทั้งหมด',
      key: 'all',
      width: 80,
      align: 'center' as const,
      onCell: (row) => (row._type === 'group' ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row._type === 'group') return null
        const record = row as ItemRow
        const checkedCount = PERM_FIELDS.filter(({ key }) => record[key]).length
        const allChecked = checkedCount === PERM_FIELDS.length
        const indeterminate = checkedCount > 0 && !allChecked
        return (
          <Checkbox
            checked={allChecked}
            indeterminate={indeterminate}
            disabled={loadingKeys.has(`${record.menuKey}:all`)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleCheckAll(record, e.target.checked)
            }
          />
        )
      },
    },
    ...PERM_FIELDS.map(({ key, label }) => ({
      title: label,
      key,
      width: 70,
      align: 'center' as const,
      onCell: (row: TableRow) => (row._type === 'group' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: TableRow) => {
        if (row._type === 'group') return null
        const record = row as ItemRow
        const loadingKey = `${record.menuKey}:${key}`
        return (
          <Checkbox
            checked={record[key]}
            disabled={loadingKeys.has(loadingKey)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange(record, key, e.target.checked)
            }
          />
        )
      },
    })),
  ]

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      rowKey={(row: TableRow) =>
        row._type === 'group' ? row._key : `item:${(row as ItemRow).menuKey}`
      }
      pagination={false}
      size="small"
      rowClassName={(row: TableRow) => (row._type === 'group' ? 'permission-group-header' : '')}
      onRow={(row: TableRow) => (row._type === 'group' ? { style: { background: '#fafafa' } } : {})}
    />
  )
}
