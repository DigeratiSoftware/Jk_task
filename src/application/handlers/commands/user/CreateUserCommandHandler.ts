import type { ICommandHandler } from "../../commands/interfaces/ICommand"
import type { CreateUserCommand, CreateUserCommandResult } from "../../commands/user/CreateUserCommand"
import type { IUserRepository } from "../../../domain/interfaces/repositories/IUserRepository"
import type { IAuthService } from "../../../domain/interfaces/services/IAuthService"
import { User } from "../../../domain/entities/User"

export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand, CreateUserCommandResult> {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService,
  ) {}

  async handle(command: CreateUserCommand): Promise<CreateUserCommandResult> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(command.email)
      if (existingUser) {
        return {
          success: false,
          errors: ["User already exists with this email"],
        }
      }

      // Hash password
      const passwordHash = await this.authService.hashPassword(command.password)

      // Create user entity
      const user = new User(command.email, command.firstName, command.lastName, command.role, undefined, passwordHash)

      // Save user
      const savedUser = await this.userRepository.create(user)

      // Generate token
      const token = this.authService.generateToken(savedUser)

      return {
        success: true,
        data: {
          userId: savedUser.id!,
          token,
        },
      }
    } catch (error) {
      console.error("CreateUserCommandHandler error:", error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      }
    }
  }
}
