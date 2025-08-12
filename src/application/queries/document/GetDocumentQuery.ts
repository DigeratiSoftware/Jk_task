import type { IQuery, IQueryResult } from "../interfaces/IQuery"
import type { Document } from "../../../domain/entities/Document"

export class GetDocumentQuery implements IQuery {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly documentId: string,
    public readonly requestedBy?: string,
    public readonly includeContent: boolean = false,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface GetDocumentQueryResult extends IQueryResult<Document> {
  data: Document
}
