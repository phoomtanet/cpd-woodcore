'use client'

import { Empty, Spin } from 'antd'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { formatNumber } from '@/lib/utils'
import type { ValueBreakdownItem } from '../types'

interface Props {
  data: ValueBreakdownItem[]
  loading?: boolean
}

const COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96', '#faad14']

export default function ValueBreakdownChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div style={{ height: 300, display: 'grid', placeItems: 'center' }}>
        <Spin />
      </div>
    )
  }
  const hasValue = data.some((d) => d.costValue > 0)
  if (data.length === 0 || !hasValue) {
    return (
      <div style={{ height: 300, display: 'grid', placeItems: 'center' }}>
        <Empty description="ไม่มีข้อมูล" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="costValue"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.key} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: unknown) => `${formatNumber(Number(value))} บาท`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
