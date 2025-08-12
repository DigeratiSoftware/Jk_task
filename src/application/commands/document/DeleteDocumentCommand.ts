import type { ICommand, ICommandResult } from "../interfaces/ICommand"

export class DeleteDocumentCommand implements ICommand {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly documentId: string,
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

export interface DeleteDocumentCommandResult extends ICommandResult {
  data?: {
    documentId: string
    deletedAt: Date
  }
}
