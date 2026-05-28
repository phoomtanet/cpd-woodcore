import { MasterRepository } from '../repositories/master.repository'
import { ConflictError, NotFoundError } from '../utils/errors'

export const MasterService = {
  // Product Types
  findAllProductTypes(status: 'active' | 'all' = 'active') {
    return MasterRepository.findAllProductTypes(status)
  },

  async createProductType(data: { name: string; label: string }) {
    const existing = await MasterRepository.findProductTypeByName(data.name)
    if (existing) throw new ConflictError('Product type name already exists')
    return MasterRepository.createProductType(data)
  },

  async updateProductType(id: number, data: { name?: string; label?: string }) {
    const item = await MasterRepository.findProductTypeById(id)
    if (!item) throw new NotFoundError('Product type not found')
    if (data.name && data.name !== item.name) {
      const conflict = await MasterRepository.findProductTypeByName(data.name)
      if (conflict) throw new ConflictError('Product type name already exists')
    }
    return MasterRepository.updateProductType(id, data)
  },

  async toggleProductTypeStatus(id: number, isActive: boolean) {
    const item = await MasterRepository.findProductTypeById(id)
    if (!item) throw new NotFoundError('Product type not found')
    return MasterRepository.updateProductTypeStatus(id, isActive)
  },

  async deleteProductTypeById(id: number) {
    const item = await MasterRepository.findProductTypeById(id)
    if (!item) throw new NotFoundError('Product type not found')
    return MasterRepository.deleteProductTypeById(id)
  },

  // Units
  findAllUnits(status: 'active' | 'all' = 'active') {
    return MasterRepository.findAllUnits(status)
  },

  async createUnit(data: { name: string }) {
    const existing = await MasterRepository.findUnitByName(data.name)
    if (existing) throw new ConflictError('Unit name already exists')
    return MasterRepository.createUnit(data)
  },

  async updateUnit(id: number, data: { name: string }) {
    const item = await MasterRepository.findUnitById(id)
    if (!item) throw new NotFoundError('Unit not found')
    if (data.name !== item.name) {
      const conflict = await MasterRepository.findUnitByName(data.name)
      if (conflict) throw new ConflictError('Unit name already exists')
    }
    return MasterRepository.updateUnit(id, data)
  },

  async toggleUnitStatus(id: number, isActive: boolean) {
    const item = await MasterRepository.findUnitById(id)
    if (!item) throw new NotFoundError('Unit not found')
    return MasterRepository.updateUnitStatus(id, isActive)
  },

  async deleteUnitById(id: number) {
    const item = await MasterRepository.findUnitById(id)
    if (!item) throw new NotFoundError('Unit not found')
    return MasterRepository.deleteUnitById(id)
  },

  // Categories
  findAllCategories(status: 'active' | 'all' = 'active') {
    return MasterRepository.findAllCategories(status)
  },

  async createCategory(data: { name: string }) {
    const existing = await MasterRepository.findCategoryByName(data.name)
    if (existing) throw new ConflictError('Category name already exists')
    return MasterRepository.createCategory(data)
  },

  async updateCategory(id: number, data: { name: string }) {
    const item = await MasterRepository.findCategoryById(id)
    if (!item) throw new NotFoundError('Category not found')
    if (data.name !== item.name) {
      const conflict = await MasterRepository.findCategoryByName(data.name)
      if (conflict) throw new ConflictError('Category name already exists')
    }
    return MasterRepository.updateCategory(id, data)
  },

  async toggleCategoryStatus(id: number, isActive: boolean) {
    const item = await MasterRepository.findCategoryById(id)
    if (!item) throw new NotFoundError('Category not found')
    return MasterRepository.updateCategoryStatus(id, isActive)
  },

  async deleteCategoryById(id: number) {
    const item = await MasterRepository.findCategoryById(id)
    if (!item) throw new NotFoundError('Category not found')
    return MasterRepository.deleteCategoryById(id)
  },
}
