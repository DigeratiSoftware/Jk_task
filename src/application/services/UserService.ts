import type { IUserRepository } from "../../domain/interfaces/repositories/IUserRepository"
import type { IAuthService } from "../../domain/interfaces/services/IAuthService"
import { User, UserRole } from "../../domain/entities/User"
import {
  UserNotFoundException,
  ValidationException,
  UnauthorizedException,
} from "../../domain/exceptions/DomainException"

export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService,
  ) {}

  async createUser(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: UserRole
  }): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email)
    if (existingUser) {
      throw new ValidationException("User already exists with this email")
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(userData.password)

    // Create user entity
    const user = new User(
      userData.email,
      userData.firstName,
      userData.lastName,
      userData.role || UserRole.VIEWER,
      undefined,
      passwordHash,
    )

    // Save user
    const savedUser = await this.userRepository.create(user)

    // Generate token
    const token = this.authService.generateToken(savedUser)

    return { user: savedUser, token }
  }

  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string }> {
    const result = await this.authService.authenticate(email, password)
    if (!result) {
      throw new UnauthorizedException("Invalid credentials")
    }
    return result
  }

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new UserNotFoundException(id)
    }
    return user
  }

  async getUsers(page: number, limit: number): Promise<{ users: User[]; total: number }> {
    return await this.userRepository.findAll(page, limit)
  }

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const user = await this.getUser(id)
    user.updateRole(role)

    const updatedUser = await this.userRepository.update(id, user)
    if (!updatedUser) {
      throw new UserNotFoundException(id)
    }

    return updatedUser
  }

  async updateUserProfile(id: string, firstName: string, lastName: string): Promise<User> {
    const user = await this.getUser(id)
    user.updateProfile(firstName, lastName)

    const updatedUser = await this.userRepository.update(id, user)
    if (!updatedUser) {
      throw new UserNotFoundException(id)
    }

    return updatedUser
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUser(id)
    const deleted = await this.userRepository.delete(id)

    if (!deleted) {
      throw new ValidationException("Failed to delete user")
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await this.userRepository.findByRole(role)
  }
}
