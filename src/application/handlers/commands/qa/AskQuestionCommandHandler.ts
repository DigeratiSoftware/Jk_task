import type { ICommandHandler } from "../../commands/interfaces/ICommand"
import type { AskQuestionCommand, AskQuestionCommandResult } from "../../commands/qa/AskQuestionCommand"
import type { IQASessionRepository } from "../../../domain/interfaces/repositories/IQASessionRepository"
import type { IRAGService } from "../../../domain/interfaces/services/IRAGService"
import { QASession } from "../../../domain/entities/QASession"

export class AskQuestionCommandHandler implements ICommandHandler<AskQuestionCommand, AskQuestionCommandResult> {
  constructor(
    private qaSessionRepository: IQASessionRepository,
    private ragService: IRAGService,
  ) {}

  async handle(command: AskQuestionCommand): Promise<AskQuestionCommandResult> {
    try {
      if (!command.question || command.question.trim().length === 0) {
        return {
          success: false,
          errors: ["Question cannot be empty"],
        }
      }

      // Get answer using RAG
      const { answer, confidence, relevantDocuments } = await this.ragService.askQuestion(
        command.question.trim(),
        command.documentIds,
      )

      // Create and save Q&A session
      const session = new QASession(command.userId, command.question.trim(), answer, relevantDocuments, confidence)

      const savedSession = await this.qaSessionRepository.create(session)

      return {
        success: true,
        data: {
          sessionId: savedSession.id!,
          question: savedSession.question,
          answer: savedSession.answer,
          confidence: savedSession.confidence,
          relevantDocuments: savedSession.relevantDocuments,
        },
      }
    } catch (error) {
      console.error("AskQuestionCommandHandler error:", error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error occurred"],
      }
    }
  }
}
