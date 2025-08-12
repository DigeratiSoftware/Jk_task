import type { ICommandHandler } from "../../commands/interfaces/ICommand"
import type { UpdateUserRoleCommand, UpdateUserRoleCommandResult } from "../../commands/user/UpdateUserRoleCommand"
import type { IUserRepository } from "../../../domain/interfaces/repositories/IUserRepository"

export class UpdateUserRoleCommandHandler
  implements ICommandHandler<UpdateUserRoleCommand, UpdateUserRoleCommandResult>
{
  constructor(private userRepository: IUserRepository) {}

  async handle(command: UpdateUserRoleCommand): Promise<UpdateUserRoleCommandResult> {
    try {
      const user = await this.userRepository.findById(command.userId)
      if (!user) {
        return {
          success: false,
          errors: ["User not found"],
        }
      }

      const previousRole = user.role
      user.updateRole(command.newRole)

      const updatedUser = await this.userRepository.update(command.userId, user)
      if (!updatedUser) {
        return {
          success: false,
          errors: ["Failed to update user role"],
        }
      }

      return {
        success: true,
        data: {
          userId: command.userId,
          previousRole,
          newRole: command.newRole,
        },
      }
    } catch (error) {
      console.error("UpdateUserRoleCommandHandler error:", error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      }
    }
  }
}
