'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { usersApi } from '../services/usersApi'
import type { User } from '@/types'
import type { CreateUserDto, UpdateUserDto } from '../types'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await usersApi.getAll()
      setUsers(data)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? 'โหลดข้อมูลไม่สำเร็จ')
      } else {
        setError('โหลดข้อมูลไม่สำเร็จ')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const createUser = async (dto: CreateUserDto) => {
    const user = await usersApi.create(dto)
    setUsers((prev) => [...prev, user])
    return user
  }

  const updateUser = async (id: number, dto: UpdateUserDto) => {
    const updated = await usersApi.update(id, dto)
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    return updated
  }

  const removeUser = async (id: number) => {
    await usersApi.remove(id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  return { users, loading, error, refetch: fetch, createUser, updateUser, removeUser }
}
