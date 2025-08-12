import type { User, UserRole } from "../entities/User"

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findAll(page: number, limit: number): Promise<{ users: User[]; total: number }>
  create(user: User): Promise<User>
  update(id: string, updates: Partial<User>): Promise<User | null>
  delete(id: string): Promise<boolean>
  findByRole(role: UserRole): Promise<User[]>
  count(): Promise<number>
}
