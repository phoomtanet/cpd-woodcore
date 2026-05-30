interface Props {
  quantity: number | null
  unit: string
  minStock: number
  location?: string
}

export default function WarehouseStockBadge({ quantity, unit, minStock, location }: Props) {
  if (quantity === null) return null
  const color = quantity <= 0 ? '#ff4d4f' : quantity < minStock ? '#fa8c16' : '#52c41a'
  const label = quantity <= 0 ? 'หมดสต๊อก' : quantity < minStock ? 'ต่ำกว่ากำหนด' : 'ปกติ'
  const prefix = location ? `สต๊อกใน ${location}` : 'สต๊อกในคลังนี้'
  return (
    <span style={{ color, fontSize: 13 }}>
      {prefix}: <strong>{quantity}</strong> {unit} ({label})
    </span>
  )
}
