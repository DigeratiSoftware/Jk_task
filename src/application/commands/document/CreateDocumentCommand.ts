import type { ICommand, ICommandResult } from "../interfaces/ICommand"

export class CreateDocumentCommand implements ICommand {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly title: string,
    public readonly content: string,
    public readonly filename: string,
    public readonly fileType: string,
    public readonly fileSize: number,
    public readonly uploadedBy: string,
    public readonly fileBuffer: Buffer,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface CreateDocumentCommandResult extends ICommandResult {
  data?: {
    documentId: string
    title: string
    status: string
  }
}
