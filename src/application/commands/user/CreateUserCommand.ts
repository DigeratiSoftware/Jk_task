import type { ICommand, ICommandResult } from "../interfaces/ICommand"
import { UserRole } from "../../../domain/entities/User"

export class CreateUserCommand implements ICommand {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: UserRole = UserRole.VIEWER,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface CreateUserCommandResult extends ICommandResult {
  data?: {
    userId: string
    token: string
  }
}
