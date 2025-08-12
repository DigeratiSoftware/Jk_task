import type { ICommand, ICommandResult } from "../interfaces/ICommand"

export class UpdateDocumentCommand implements ICommand {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly documentId: string,
    public readonly title?: string,
    public readonly content?: string,
    public readonly updatedBy?: string,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface UpdateDocumentCommandResult extends ICommandResult {
  data?: {
    documentId: string
    updatedFields: string[]
  }
}
