import type { IQASessionRepository } from "../../domain/interfaces/repositories/IQASessionRepository"
import type { IDocumentRepository } from "../../domain/interfaces/repositories/IDocumentRepository"
import type { IRAGService } from "../../domain/interfaces/services/IRAGService"
import { QASession } from "../../domain/entities/QASession"
import { ValidationException } from "../../domain/exceptions/DomainException"

export class QAService {
  constructor(
    private qaSessionRepository: IQASessionRepository,
    private documentRepository: IDocumentRepository,
    private ragService: IRAGService,
  ) {}

  async askQuestion(userId: string, question: string, documentIds?: string[]): Promise<QASession> {
    if (!question || question.trim().length === 0) {
      throw new ValidationException("Question cannot be empty")
    }

    // Get answer using RAG
    const { answer, confidence, relevantDocuments } = await this.ragService.askQuestion(question.trim(), documentIds)

    // Create and save Q&A session
    const session = new QASession(userId, question.trim(), answer, relevantDocuments, confidence)

    return await this.qaSessionRepository.create(session)
  }

  async getSession(id: string): Promise<QASession | null> {
    return await this.qaSessionRepository.findById(id)
  }

  async getUserSessions(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ sessions: QASession[]; total: number }> {
    return await this.qaSessionRepository.findByUserId(userId, page, limit)
  }

  async getRecentSessions(limit: number): Promise<QASession[]> {
    return await this.qaSessionRepository.findRecentSessions(limit)
  }

  async deleteSession(id: string): Promise<void> {
    const deleted = await this.qaSessionRepository.delete(id)
    if (!deleted) {
      throw new ValidationException("Failed to delete session")
    }
  }
}
