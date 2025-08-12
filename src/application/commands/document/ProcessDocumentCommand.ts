import type { ICommand, ICommandResult } from "../interfaces/ICommand"

export class ProcessDocumentCommand implements ICommand {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly documentId: string,
    public readonly triggeredBy: string,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface ProcessDocumentCommandResult extends ICommandResult {
  data?: {
    documentId: string
    processingStarted: boolean
    estimatedCompletionTime?: Date
  }
}
