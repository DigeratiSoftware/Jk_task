import type { IQuery, IQueryResult } from "../interfaces/IQuery"
import type { User } from "../../../domain/entities/User"

export class GetUserQuery implements IQuery {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly userId: string,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface GetUserQueryResult extends IQueryResult<User> {
  data: User
}
