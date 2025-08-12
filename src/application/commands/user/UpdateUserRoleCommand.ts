import type { ICommand, ICommandResult } from "../interfaces/ICommand"
import type { UserRole } from "../../../domain/entities/User"

export class UpdateUserRoleCommand implements ICommand {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly userId: string,
    public readonly newRole: UserRole,
    public readonly updatedBy: string,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface UpdateUserRoleCommandResult extends ICommandResult {
  data?: {
    userId: string
    previousRole: UserRole
    newRole: UserRole
  }
}
