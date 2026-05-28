'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { productsApi } from '../services/productsApi'
import { syncAlerts } from '@/store/alertsStore'
import type { Product, UpdateProductDto } from '../types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [productType, setProductType] = useState<string | undefined>()
  const [categoryId, setCategoryId] = useState<number | undefined>()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productsApi.getAll({
        search: search || undefined,
        productType,
        categoryId,
      })
      setProducts(data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? 'โหลดข้อมูลไม่สำเร็จ')
      } else {
        setError('โหลดข้อมูลไม่สำเร็จ')
      }
    } finally {
      setLoading(false)
    }
  }, [search, productType, categoryId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const createProduct = async (dto: Parameters<typeof productsApi.create>[0]) => {
    const product = await productsApi.create(dto)
    setProducts((prev) => [product, ...prev])
    syncAlerts()
    return product
  }

  const updateProduct = async (id: number, dto: UpdateProductDto) => {
    const { isActive, ...rest } = dto
    let result = await productsApi.update(id, rest)
    if (isActive !== undefined) {
      result = await productsApi.toggleStatus(id, isActive)
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? result : p)))
    syncAlerts()
    return result
  }

  const removeProduct = async (id: number) => {
    await productsApi.remove(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    syncAlerts()
  }

  return {
    products,
    setProducts,
    loading,
    error,
    search,
    setSearch,
    productType,
    setProductType,
    categoryId,
    setCategoryId,
    refetch: fetch,
    createProduct,
    updateProduct,
    removeProduct,
  }
}
