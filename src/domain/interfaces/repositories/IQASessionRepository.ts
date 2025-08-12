import type { QASession } from "../entities/QASession"

export interface IQASessionRepository {
  findById(id: string): Promise<QASession | null>
  findByUserId(userId: string, page: number, limit: number): Promise<{ sessions: QASession[]; total: number }>
  create(session: QASession): Promise<QASession>
  delete(id: string): Promise<boolean>
  count(): Promise<number>
  findRecentSessions(limit: number): Promise<QASession[]>
}
