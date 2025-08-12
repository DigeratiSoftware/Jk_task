import type { IQuery, IQueryResult } from "../interfaces/IQuery"

export class GetDashboardStatsQuery implements IQuery {
  readonly timestamp: Date
  readonly correlationId: string

  constructor(
    public readonly userId?: string,
    public readonly userRole?: string,
    correlationId?: string,
  ) {
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
  }

  private generateCorrelationId(): string {
    return `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export interface GetDashboardStatsQueryResult
  extends IQueryResult<{
    totalDocuments: number
    totalQASessions: number
    totalUsers?: number
    processingJobs: number
    recentDocuments: any[]
    recentQASessions: any[]
    recentUsers?: any[]
    systemHealth: {
      status: "healthy" | "warning" | "error"
      uptime: number
      memoryUsage: number
      diskUsage: number
    }
  }> {}
