import bcrypt from 'bcryptjs'
import { UserRepository } from '../repositories/user.repository'
import { ConflictError, NotFoundError } from '../utils/errors'

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: string
}

export interface UpdateUserDto {
  name?: string
  role?: string
  isActive?: boolean
}

export const UserService = {
  findAll() {
    return UserRepository.findAll()
  },

  async create(dto: CreateUserDto) {
    const existing = await UserRepository.findByEmail(dto.email)
    if (existing) throw new ConflictError('Email already exists')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    return UserRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
    })
  },

  async update(id: number, dto: UpdateUserDto) {
    const user = await UserRepository.findByIdPublic(id)
    if (!user) throw new NotFoundError('User not found')
    return UserRepository.update(id, dto)
  },

  async deleteById(id: number) {
    const user = await UserRepository.findByIdPublic(id)
    if (!user) throw new NotFoundError('User not found')
    await UserRepository.deleteById(id)
  },
}
