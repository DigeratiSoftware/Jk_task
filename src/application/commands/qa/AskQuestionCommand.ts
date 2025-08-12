import type { ICommand, ICommandResult } from "../interfaces/ICommand"

export class AskQuestionCommand implements ICommand {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly userId: string,
    public readonly question: string,
    public readonly documentIds?: string[],
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface AskQuestionCommandResult extends ICommandResult {
  data?: {
    sessionId: string
    question: string
    answer: string
    confidence: number
    relevantDocuments: string[]
  }
}
