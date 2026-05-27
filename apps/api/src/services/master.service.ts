import { MasterRepository } from '../repositories/master.repository'
import { ConflictError, NotFoundError } from '../utils/errors'

export const MasterService = {
  // Product Types
  findAllProductTypes() {
    return MasterRepository.findAllProductTypes()
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

  async deleteProductTypeById(id: number) {
    const item = await MasterRepository.findProductTypeById(id)
    if (!item) throw new NotFoundError('Product type not found')
    return MasterRepository.deleteProductTypeById(id)
  },

  // Units
  findAllUnits() {
    return MasterRepository.findAllUnits()
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

  async deleteUnitById(id: number) {
    const item = await MasterRepository.findUnitById(id)
    if (!item) throw new NotFoundError('Unit not found')
    return MasterRepository.deleteUnitById(id)
  },
}
