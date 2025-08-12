import type { Request, Response } from "express"
import { container } from "../../infrastructure/config/DIContainer"
import type { QAService } from "../../application/services/QAService"
import { DomainException } from "../../domain/exceptions/DomainException"

export class QAController {
  private qaService: QAService

  constructor() {
    this.qaService = container.resolve<QAService>("QAService")
  }

  askQuestion = async (req: Request, res: Response) => {
    try {
      const { question, documentIds } = req.body
      const user = (req as any).user

      const session = await this.qaService.askQuestion(user.id, question, documentIds)

      res.json({
        success: true,
        data: {
          question: session.question,
          answer: session.answer,
          confidence: session.confidence,
          relevantDocuments: session.relevantDocuments,
          sessionId: session.id,
        },
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  getHistory = async (req: Request, res: Response) => {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 20
      const user = (req as any).user

      const result = await this.qaService.getUserSessions(user.id, page, limit)

      res.json({
        success: true,
        data: {
          sessions: result.sessions.map((session) => session.toJSON()),
          pagination: {
            page,
            limit,
            total: result.total,
            pages: Math.ceil(result.total / limit),
          },
        },
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  getSession = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const user = (req as any).user

      const session = await this.qaService.getSession(id)
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found",
        })
      }

      // Check permissions
      if (user.role !== "admin" && session.userId !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      res.json({
        success: true,
        data: session.toJSON(),
      })
    } catch (error) {
      this.handleError(error, res)
    }
  }

  private handleError(error: any, res: Response) {
    console.error("QAController error:", error)

    if (error instanceof DomainException) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}
