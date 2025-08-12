import type { IQuery, IQueryResult } from "../interfaces/IQuery"
import type { QASession } from "../../../domain/entities/QASession"

export class GetQASessionQuery implements IQuery {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly sessionId: string,
    public readonly requestedBy?: string,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface GetQASessionQueryResult extends IQueryResult<QASession> {
  data: QASession
}
