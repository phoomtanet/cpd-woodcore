import { Typography, Breadcrumb } from 'antd'

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumb?: { label: string; href?: string }[]
  extra?: React.ReactNode
}

export default function PageHeader({ title, subtitle, breadcrumb, extra }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumb && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={breadcrumb.map((b) => ({
            title: b.href ? <a href={b.href}>{b.label}</a> : b.label,
          }))}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </div>
        {extra && <div>{extra}</div>}
      </div>
    </div>
  )
}
