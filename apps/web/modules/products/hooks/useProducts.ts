'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { productsApi } from '../services/productsApi'
import type { Product } from '../types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [productType, setProductType] = useState<string | undefined>()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productsApi.getAll({
        search: search || undefined,
        productType,
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
  }, [search, productType])

  useEffect(() => {
    fetch()
  }, [fetch])

  const createProduct = async (dto: Parameters<typeof productsApi.create>[0]) => {
    const product = await productsApi.create(dto)
    setProducts((prev) => [product, ...prev])
    return product
  }

  const updateProduct = async (id: number, dto: Parameters<typeof productsApi.update>[1]) => {
    const updated = await productsApi.update(id, dto)
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    return updated
  }

  const removeProduct = async (id: number) => {
    await productsApi.remove(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
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
    refetch: fetch,
    createProduct,
    updateProduct,
    removeProduct,
  }
}
