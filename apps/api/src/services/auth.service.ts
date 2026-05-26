import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/user.repository'
import { UnauthorizedError, NotFoundError } from '../utils/errors'

export const AuthService = {
  async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email)
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Invalid credentials')

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET ?? '', {
      expiresIn: '7d',
    })

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  },

  async getMe(userId: number) {
    const user = await UserRepository.findByIdPublic(userId)
    if (!user) throw new NotFoundError('User not found')
    return user
  },
}
