import { MasterRepository } from '../repositories/master.repository'
import { ConflictError, NotFoundError } from '../utils/errors'

export const MasterService = {
  // Product Types
  findAllProductTypes(status: 'active' | 'all' = 'active') {
    return MasterRepository.findAllProductTypes(status)
  },

  async createProductType(data: { name: string; label: string }, userId: number) {
    const existing = await MasterRepository.findProductTypeByName(data.name)
    if (existing) throw new ConflictError('ชื่อประเภทนี้มีอยู่แล้ว')
    return MasterRepository.createProductType({ ...data, createdById: userId })
  },

  async updateProductType(id: number, data: { name?: string; label?: string }, userId: number) {
    const item = await MasterRepository.findProductTypeById(id)
    if (!item) throw new NotFoundError('ไม่พบประเภทสินค้า')
    if (data.name && data.name !== item.name) {
      const conflict = await MasterRepository.findProductTypeByName(data.name)
      if (conflict) throw new ConflictError('ชื่อประเภทนี้มีอยู่แล้ว')
    }
    return MasterRepository.updateProductType(id, { ...data, updatedById: userId })
  },

  async toggleProductTypeStatus(id: number, isActive: boolean, userId: number) {
    const item = await MasterRepository.findProductTypeById(id)
    if (!item) throw new NotFoundError('ไม่พบประเภทสินค้า')
    return MasterRepository.updateProductTypeStatus(id, isActive, userId)
  },

  async deleteProductTypeById(id: number) {
    const item = await MasterRepository.findProductTypeById(id)
    if (!item) throw new NotFoundError('ไม่พบประเภทสินค้า')
    return MasterRepository.deleteProductTypeById(id)
  },

  // Units
  findAllUnits(status: 'active' | 'all' = 'active') {
    return MasterRepository.findAllUnits(status)
  },

  async createUnit(data: { name: string }, userId: number) {
    const existing = await MasterRepository.findUnitByName(data.name)
    if (existing) throw new ConflictError('ชื่อหน่วยนี้มีอยู่แล้ว')
    return MasterRepository.createUnit({ ...data, createdById: userId })
  },

  async updateUnit(id: number, data: { name: string }, userId: number) {
    const item = await MasterRepository.findUnitById(id)
    if (!item) throw new NotFoundError('ไม่พบหน่วยนับ')
    if (data.name !== item.name) {
      const conflict = await MasterRepository.findUnitByName(data.name)
      if (conflict) throw new ConflictError('ชื่อหน่วยนี้มีอยู่แล้ว')
    }
    return MasterRepository.updateUnit(id, { ...data, updatedById: userId })
  },

  async toggleUnitStatus(id: number, isActive: boolean, userId: number) {
    const item = await MasterRepository.findUnitById(id)
    if (!item) throw new NotFoundError('ไม่พบหน่วยนับ')
    return MasterRepository.updateUnitStatus(id, isActive, userId)
  },

  async deleteUnitById(id: number) {
    const item = await MasterRepository.findUnitById(id)
    if (!item) throw new NotFoundError('ไม่พบหน่วยนับ')
    return MasterRepository.deleteUnitById(id)
  },

  // Categories
  findAllCategories(status: 'active' | 'all' = 'active') {
    return MasterRepository.findAllCategories(status)
  },

  async createCategory(data: { name: string }, userId: number) {
    const existing = await MasterRepository.findCategoryByName(data.name)
    if (existing) throw new ConflictError('ชื่อหมวดหมู่นี้มีอยู่แล้ว')
    return MasterRepository.createCategory({ ...data, createdById: userId })
  },

  async updateCategory(id: number, data: { name: string }, userId: number) {
    const item = await MasterRepository.findCategoryById(id)
    if (!item) throw new NotFoundError('ไม่พบหมวดหมู่')
    if (data.name !== item.name) {
      const conflict = await MasterRepository.findCategoryByName(data.name)
      if (conflict) throw new ConflictError('ชื่อหมวดหมู่นี้มีอยู่แล้ว')
    }
    return MasterRepository.updateCategory(id, { ...data, updatedById: userId })
  },

  async toggleCategoryStatus(id: number, isActive: boolean, userId: number) {
    const item = await MasterRepository.findCategoryById(id)
    if (!item) throw new NotFoundError('ไม่พบหมวดหมู่')
    return MasterRepository.updateCategoryStatus(id, isActive, userId)
  },

  async deleteCategoryById(id: number) {
    const item = await MasterRepository.findCategoryById(id)
    if (!item) throw new NotFoundError('ไม่พบหมวดหมู่')
    return MasterRepository.deleteCategoryById(id)
  },
}
