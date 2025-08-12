import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { IAuthService } from "../../domain/interfaces/services/IAuthService"
import type { IUserRepository } from "../../domain/interfaces/repositories/IUserRepository"
import { User } from "../../domain/entities/User"

export class JWTAuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private jwtSecret: string,
  ) {}

  async authenticate(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = await this.userRepository.findByEmail(email)
    if (!user || !user.passwordHash) {
      return null
    }

    const isMatch = await this.comparePassword(password, user.passwordHash)
    if (!isMatch) {
      return null
    }

    const token = this.generateToken(user)
    return { user, token }
  }

  async register(userData: any): Promise<{ user: User; token: string }> {
    const passwordHash = await this.hashPassword(userData.password)

    const user = new User(userData.email, userData.firstName, userData.lastName, userData.role, undefined, passwordHash)

    const savedUser = await this.userRepository.create(user)
    const token = this.generateToken(savedUser)

    return { user: savedUser, token }
  }

  generateToken(user: User): string {
    return jwt.sign({ userId: user.id, email: user.email, role: user.role }, this.jwtSecret, { expiresIn: "7d" })
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any
      return await this.userRepository.findById(decoded.userId)
    } catch (error) {
      return null
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12)
    return bcrypt.hash(password, salt)
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}
