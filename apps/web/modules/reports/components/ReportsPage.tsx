'use client'

import { Tabs, App } from 'antd'
import PageHeader from '@/shared/components/PageHeader'
import PermissionGuard from '@/shared/guards/PermissionGuard'
import BalanceReportTab from './BalanceReportTab'
import MovementReportTab from './MovementReportTab'

export default function ReportsPage() {
  return (
    <PermissionGuard menuKey="reports">
      <App>
        <PageHeader
          title="รายงาน"
          subtitle="ยอดคงเหลือ และความเคลื่อนไหวสินค้า — ส่งออก Excel / CSV"
        />
        <Tabs
          defaultActiveKey="balance"
          items={[
            { key: 'balance', label: 'ยอดคงเหลือ (Stock Balance)', children: <BalanceReportTab /> },
            {
              key: 'movement',
              label: 'ความเคลื่อนไหว (Movement)',
              children: <MovementReportTab />,
            },
          ]}
        />
      </App>
    </PermissionGuard>
  )
}
