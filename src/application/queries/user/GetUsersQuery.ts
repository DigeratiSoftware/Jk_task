import type { IQuery, IQueryResult } from "../interfaces/IQuery"
import type { User, UserRole } from "../../../domain/entities/User"

export class GetUsersQuery implements IQuery {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly role?: UserRole,
    public readonly searchTerm?: string,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface GetUsersQueryResult
  extends IQueryResult<{
    users: User[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {}
