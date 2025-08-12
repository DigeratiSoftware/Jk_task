import type { IQuery, IQueryResult } from "../interfaces/IQuery"

export class GetDocumentStatsQuery implements IQuery {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly userId?: string,
    public readonly dateRange?: {
      from: Date
      to: Date
    },
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface GetDocumentStatsQueryResult
  extends IQueryResult<{
    totalDocuments: number
    documentsByStatus: Record<string, number>
    documentsByType: Record<string, number>
    totalSize: number
    averageProcessingTime: number
  }> {}
