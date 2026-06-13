'use client'

import { Empty, Spin } from 'antd'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { MovementTrendPoint } from '../types'

interface Props {
  data: MovementTrendPoint[]
  loading?: boolean
}

// Show only month-day on the axis to keep it readable over 30 days.
function shortDate(value: string): string {
  return value.slice(5) // 'YYYY-MM-DD' → 'MM-DD'
}

export default function MovementTrendChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div style={{ height: 300, display: 'grid', placeItems: 'center' }}>
        <Spin />
      </div>
    )
  }
  if (data.length === 0) {
    return (
      <div style={{ height: 300, display: 'grid', placeItems: 'center' }}>
        <Empty description="ไม่มีข้อมูล" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} fontSize={12} />
        <YAxis allowDecimals={false} fontSize={12} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="in"
          name="รับเข้า"
          stroke="#52c41a"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="out"
          name="เบิกออก"
          stroke="#ff4d4f"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="transfer"
          name="โอนย้าย"
          stroke="#1677ff"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
