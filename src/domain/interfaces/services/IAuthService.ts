import type { User } from "../entities/User"

export interface IAuthService {
  authenticate(email: string, password: string): Promise<{ user: User; token: string } | null>
  register(userData: any): Promise<{ user: User; token: string }>
  generateToken(user: User): string
  verifyToken(token: string): Promise<User | null>
  hashPassword(password: string): Promise<string>
  comparePassword(password: string, hash: string): Promise<boolean>
}
