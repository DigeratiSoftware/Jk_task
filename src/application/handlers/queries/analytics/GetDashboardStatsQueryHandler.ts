import type { IQueryHandler } from "../../queries/interfaces/IQuery"
import type {
  GetDashboardStatsQuery,
  GetDashboardStatsQueryResult,
} from "../../queries/analytics/GetDashboardStatsQuery"
import type { IUserRepository } from "../../../domain/interfaces/repositories/IUserRepository"
import type { IDocumentRepository } from "../../../domain/interfaces/repositories/IDocumentRepository"
import type { IQASessionRepository } from "../../../domain/interfaces/repositories/IQASessionRepository"
import { DocumentStatus } from "../../../domain/entities/Document"

export class GetDashboardStatsQueryHandler
  implements IQueryHandler<GetDashboardStatsQuery, GetDashboardStatsQueryResult>
{
  constructor(
    private userRepository: IUserRepository,
    private documentRepository: IDocumentRepository,
    private qaSessionRepository: IQASessionRepository,
  ) {}

  async handle(query: GetDashboardStatsQueryResult): Promise<GetDashboardStatsQueryResult> {
    const [totalDocuments, totalQASessions, totalUsers, processingDocuments, recentDocuments, recentQASessions] =
      await Promise.all([
        this.documentRepository.count(),
        this.qaSessionRepository.count(),
        query.userRole === "admin" ? this.userRepository.count() : Promise.resolve(0),
        this.getProcessingDocumentsCount(),
        this.getRecentDocuments(5),
        this.getRecentQASessions(5),
      ])

    const recentUsers = query.userRole === "admin" ? await this.getRecentUsers(5) : []

    return {
      data: {
        totalDocuments,
        totalQASessions,
        totalUsers: query.userRole === "admin" ? totalUsers : undefined,
        processingJobs: processingDocuments,
        recentDocuments,
        recentQASessions,
        recentUsers: query.userRole === "admin" ? recentUsers : undefined,
        systemHealth: await this.getSystemHealth(),
      },
    }
  }

  private async getProcessingDocumentsCount(): Promise<number> {
    const processingDocs = await this.documentRepository.findByStatus(DocumentStatus.PROCESSING)
    return processingDocs.length
  }

  private async getRecentDocuments(limit: number): Promise<any[]> {
    const result = await this.documentRepository.findAll(1, limit)
    return result.documents.map((doc) => doc.toJSON())
  }

  private async getRecentQASessions(limit: number): Promise<any[]> {
    const sessions = await this.qaSessionRepository.findRecentSessions(limit)
    return sessions.map((session) => session.toJSON())
  }

  private async getRecentUsers(limit: number): Promise<any[]> {
    const result = await this.userRepository.findAll(1, limit)
    return result.users.map((user) => user.toJSON())
  }

  private async getSystemHealth(): Promise<any> {
    // In a real implementation, you would check various system metrics
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    return {
      status: "healthy" as const,
      uptime,
      memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
      diskUsage: 0.5, // Mock value
    }
  }
}
