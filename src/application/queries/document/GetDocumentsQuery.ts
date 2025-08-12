import type { IQuery, IQueryResult } from "../interfaces/IQuery"
import type { Document, DocumentStatus } from "../../../domain/entities/Document"

export class GetDocumentsQuery implements IQuery {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly userId?: string,
    public readonly status?: DocumentStatus,
    public readonly searchTerm?: string,
    public readonly sortBy: string = "createdAt",
    public readonly sortOrder: "asc" | "desc" = "desc",
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface GetDocumentsQueryResult
  extends IQueryResult<{
    documents: Document[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {}
