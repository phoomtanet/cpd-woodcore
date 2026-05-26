export type ProductType = 'raw' | 'wip' | 'finished'

export interface Product {
  id: number
  name: string
  sku: string
  barcode?: string
  image?: string
  category?: string
  productType: ProductType
  unit: string
  costPrice: number
  salePrice: number
  minStock: number
  currentStock: number
  createdAt: string
  updatedAt: string
}

export interface CreateProductDto {
  name: string
  sku: string
  unit: string
  productType?: ProductType
  costPrice: number
  salePrice: number
  barcode?: string
  category?: string
  minStock?: number
}
