import type { ICommand, ICommandResult } from "../interfaces/ICommand"

export class DeleteUserCommand implements ICommand {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly userId: string,
    public readonly deletedBy: string,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface DeleteUserCommandResult extends ICommandResult {
  data?: {
    userId: string
    deletedAt: Date
  }
}
