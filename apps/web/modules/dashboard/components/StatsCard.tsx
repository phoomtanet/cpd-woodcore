'use client'

import { Statistic } from 'antd'
import type { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: number
  suffix?: string
  precision?: number
  icon?: ReactNode
  valueColor?: string
  loading?: boolean
}

export default function StatsCard({
  title,
  value,
  suffix,
  precision,
  icon,
  valueColor,
  loading,
}: StatsCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        padding: '16px 20px',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {icon && <span style={{ color: valueColor ?? '#1677ff', fontSize: 18 }}>{icon}</span>}
        <span style={{ color: '#888', fontSize: 13 }}>{title}</span>
      </div>
      <Statistic
        value={value}
        suffix={suffix}
        precision={precision}
        loading={loading}
        valueStyle={{ color: valueColor, fontSize: 24 }}
      />
    </div>
  )
}
