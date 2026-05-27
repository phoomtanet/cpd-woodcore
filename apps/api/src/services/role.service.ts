import { RoleRepository } from '../repositories/role.repository'
import { ConflictError, NotFoundError } from '../utils/errors'

export const RoleService = {
  findAll() {
    return RoleRepository.findAll()
  },

  async create(data: { name: string; label: string }) {
    const existing = await RoleRepository.findByName(data.name)
    if (existing) throw new ConflictError('Role name already exists')
    return RoleRepository.create(data)
  },

  async update(id: number, data: { name?: string; label?: string }) {
    const role = await RoleRepository.findById(id)
    if (!role) throw new NotFoundError('Role not found')
    return RoleRepository.update(id, data)
  },

  async deleteById(id: number) {
    const role = await RoleRepository.findById(id)
    if (!role) throw new NotFoundError('Role not found')
    return RoleRepository.deleteById(id)
  },
}
