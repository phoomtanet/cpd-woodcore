export type ProductType = 'raw' | 'wip' | 'finished'

export interface Product {
  id: number
  name: string
  sku: string
  barcode?: string
  image?: string
  categoryId?: number
  category?: { id: number; name: string; isActive: boolean }
  productType: ProductType
  unit: string
  costPrice: number
  salePrice: number
  minStock: number
  currentStock: number
  isActive: boolean
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
  categoryId?: number
  minStock?: number
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  isActive?: boolean
}
