import type { IQuery, IQueryResult } from "../interfaces/IQuery"
import type { QASession } from "../../../domain/entities/QASession"

export class GetQAHistoryQuery implements IQuery {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly searchTerm?: string,
    public readonly confidenceThreshold?: number,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface GetQAHistoryQueryResult
  extends IQueryResult<{
    sessions: QASession[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {}
